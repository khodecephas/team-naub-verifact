<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\CaseAssignment;
use App\Models\CaseFile;
use App\Models\Finding;
use App\Models\User;
use App\Services\FindingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FindingWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
    }

    public function test_assigned_examiner_can_record_a_finding(): void
    {
        [$manager, $examiner, $case] = $this->findingContext();

        $this->actingAs($examiner)->post(route('cases.findings.store', $case), [
            'title' => 'Deleted files recovered',
            'narrative' => 'Recovered three deleted files from unallocated space.',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('findings', [
            'case_id' => $case->id, 'authored_by' => $examiner->id, 'sequence_number' => 1,
        ]);
    }

    public function test_finding_numbers_use_the_public_finding_sequence(): void
    {
        [, $examiner, $case] = $this->findingContext();
        FindingService::record($case, $examiner, 'Finding one', 'Narrative one');

        $this->assertMatchesRegularExpression('/^FINDING-\d{4}-\d{6}$/', Finding::firstOrFail()->finding_number);
    }

    public function test_findings_are_chained_in_sequence_per_case(): void
    {
        [, $examiner, $case] = $this->findingContext();
        $first = FindingService::record($case, $examiner, 'First', 'Narrative one');
        $second = FindingService::record($case, $examiner, 'Second', 'Narrative two');

        $this->assertSame(1, $first->sequence_number);
        $this->assertSame(2, $second->sequence_number);
        $this->assertSame($first->finding_hash, $second->previous_finding_hash);
        $this->assertTrue(FindingService::verifyChain($case));
    }

    public function test_tampering_with_a_finding_breaks_chain_verification(): void
    {
        [, $examiner, $case] = $this->findingContext();
        $finding = FindingService::record($case, $examiner, 'Original title', 'Original narrative');
        DB::table('findings')->where('id', $finding->id)->update(['narrative' => 'Changed narrative']);

        $this->assertFalse(FindingService::verifyChain($case));
    }

    public function test_model_updates_to_findings_are_blocked(): void
    {
        [, $examiner, $case] = $this->findingContext();
        $finding = FindingService::record($case, $examiner, 'Original title', 'Original narrative');

        $this->expectException(\LogicException::class);
        $finding->update(['title' => 'Changed']);
    }

    public function test_model_deletes_of_findings_are_blocked(): void
    {
        [, $examiner, $case] = $this->findingContext();
        $finding = FindingService::record($case, $examiner, 'Original title', 'Original narrative');

        $this->expectException(\LogicException::class);
        $finding->delete();
    }

    public function test_auditor_cannot_record_a_finding(): void
    {
        [$manager, , $case] = $this->findingContext();
        $auditor = $this->assignedUser($case, $manager, UserRole::AUDITOR);

        $this->actingAs($auditor)->post(route('cases.findings.store', $case), [
            'title' => 'Attempted finding',
            'narrative' => 'Should not be permitted.',
        ])->assertForbidden();
    }

    public function test_examiner_can_open_the_standalone_record_finding_page(): void
    {
        [, $examiner, $case] = $this->findingContext();

        $this->actingAs($examiner)->get(route('cases.findings.create', $case))->assertOk()->assertInertia(
            fn (Assert $page) => $page->component('Findings/Create')
                ->where('case.case_number', $case->case_number),
        );
    }

    public function test_finding_store_redirects_to_the_case_findings_tab(): void
    {
        [, $examiner, $case] = $this->findingContext();

        $this->actingAs($examiner)->post(route('cases.findings.store', $case), [
            'title' => 'Deleted files recovered',
            'narrative' => 'Recovered three deleted files from unallocated space.',
        ])->assertRedirect(route('cases.show', $case).'?tab=findings');
    }

    public function test_a_document_can_be_attached_when_recording_a_finding(): void
    {
        [, $examiner, $case] = $this->findingContext();

        $this->actingAs($examiner)->post(route('cases.findings.store', $case), [
            'title' => 'Recovered log export',
            'narrative' => 'Attached the exported access log covering the incident window.',
            'attachment' => UploadedFile::fake()->create('access-log.pdf', 200, 'application/pdf'),
        ])->assertRedirect();

        $finding = Finding::firstOrFail();
        $this->assertSame('access-log.pdf', $finding->attachment_original_filename);
        $this->assertNotNull($finding->attachment_sha256);
        Storage::disk('local')->assertExists($finding->attachment_path);
    }

    public function test_downloading_an_attachment_requires_case_access(): void
    {
        [, $examiner, $case] = $this->findingContext();
        $finding = FindingService::record(
            $case, $examiner, 'Recovered log export', 'Narrative.', null,
            UploadedFile::fake()->create('access-log.pdf', 200, 'application/pdf'),
        );
        $outsider = User::factory()->role(UserRole::FORENSIC_EXAMINER)->create();

        $this->actingAs($outsider)->get(route('findings.attachment.download', $finding))->assertForbidden();
        $this->actingAs($examiner)->get(route('findings.attachment.download', $finding))->assertOk();
    }

    public function test_case_show_page_includes_its_findings_ledger(): void
    {
        [, $examiner, $case] = $this->findingContext();
        FindingService::record($case, $examiner, 'Deleted files recovered', 'Recovered deleted files.');

        $this->actingAs($examiner)->get(route('cases.show', $case))->assertOk()->assertInertia(
            fn (Assert $page) => $page->component('Cases/Show')
                ->has('findings.items', 1)
                ->where('findings.items.0.title', 'Deleted files recovered')
                ->where('findings.chain_verified', true),
        );
    }

    /** @return array{User, User, CaseFile} */
    private function findingContext(): array
    {
        $manager = User::factory()->role(UserRole::CASE_MANAGER)->create();
        $examiner = User::factory()->role(UserRole::FORENSIC_EXAMINER)->create();
        $case = CaseFile::factory()->create(['created_by' => $manager->id, 'case_manager_id' => $manager->id]);
        CaseAssignment::factory()->create(['case_id' => $case->id, 'user_id' => $examiner->id, 'assigned_by' => $manager->id]);

        return [$manager, $examiner, $case];
    }

    private function assignedUser(CaseFile $case, User $actor, string $role): User
    {
        $user = User::factory()->role($role)->create();
        CaseAssignment::factory()->create(['case_id' => $case->id, 'user_id' => $user->id, 'assigned_by' => $actor->id]);

        return $user;
    }
}
