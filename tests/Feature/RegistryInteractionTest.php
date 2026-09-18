<?php

namespace Tests\Feature;

use App\Enums\EvidenceType;
use App\Enums\IntegrityStatus;
use App\Enums\UserRole;
use App\Models\CaseFile;
use App\Models\Evidence;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RegistryInteractionTest extends TestCase
{
    use RefreshDatabase;

    /** Search returns matching records and excludes records outside the user's case scope. */
    public function test_global_search_respects_case_visibility(): void
    {
        $manager = User::factory()->role(UserRole::CASE_MANAGER)->create();
        $visible = CaseFile::factory()->create([
            'title' => 'Needle response matter',
            'case_manager_id' => $manager->id,
            'created_by' => $manager->id,
        ]);
        CaseFile::factory()->create(['title' => 'Needle hidden matter']);

        $this->actingAs($manager)
            ->get(route('search.index', ['q' => 'Needle']))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Search/Index')
                ->has('cases', 1)
                ->where('cases.0.case_number', $visible->case_number));
    }

    /** Case export applies the same filters used by the on-screen register. */
    public function test_case_export_applies_current_filters(): void
    {
        $manager = User::factory()->role(UserRole::CASE_MANAGER)->create();
        $matching = CaseFile::factory()->create([
            'title' => 'Export needle matter',
            'case_manager_id' => $manager->id,
            'created_by' => $manager->id,
        ]);
        CaseFile::factory()->create([
            'title' => 'Different visible matter',
            'case_manager_id' => $manager->id,
            'created_by' => $manager->id,
        ]);

        $response = $this->actingAs($manager)->get(route('cases.export', ['search' => 'needle']));

        $response->assertOk();
        $this->assertStringContainsString($matching->case_number, $response->streamedContent());
        $this->assertStringNotContainsString('Different visible matter', $response->streamedContent());
    }

    /** Evidence filters and export share type and integrity criteria. */
    public function test_evidence_register_and_export_share_filters(): void
    {
        $manager = User::factory()->role(UserRole::CASE_MANAGER)->create();
        $case = CaseFile::factory()->create([
            'case_manager_id' => $manager->id,
            'created_by' => $manager->id,
        ]);
        $matching = Evidence::factory()->create([
            'case_id' => $case->id,
            'registered_by' => $manager->id,
            'evidence_type' => EvidenceType::DOCUMENT,
            'integrity_status' => IntegrityStatus::BASELINE_ESTABLISHED,
        ]);
        Evidence::factory()->create([
            'case_id' => $case->id,
            'registered_by' => $manager->id,
            'evidence_type' => EvidenceType::VIDEO,
            'integrity_status' => IntegrityStatus::VERIFIED,
        ]);
        $filters = [
            'type' => EvidenceType::DOCUMENT,
            'integrity' => IntegrityStatus::BASELINE_ESTABLISHED,
        ];

        $this->actingAs($manager)
            ->get(route('evidence.index', $filters))
            ->assertInertia(fn (Assert $page) => $page
                ->has('evidence.data', 1)
                ->where('evidence.data.0.evidence_number', $matching->evidence_number));

        $export = $this->actingAs($manager)->get(route('evidence.export', $filters));
        $this->assertStringContainsString($matching->evidence_number, $export->streamedContent());
    }
}
