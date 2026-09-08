<?php

namespace Tests\Feature;

use App\Enums\CaseStatus;
use App\Models\CaseAssignment;
use App\Models\CaseFile;
use App\Models\PhysicalSource;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CaseFileTest extends TestCase
{
    use RefreshDatabase;

    public function test_case_defaults_to_open_status(): void
    {
        $case = CaseFile::factory()->create();

        $this->assertSame(CaseStatus::OPEN, $case->status);
    }

    public function test_case_belongs_to_its_creator_and_case_manager(): void
    {
        $creator = User::factory()->create();
        $manager = User::factory()->create();

        $case = CaseFile::factory()->create([
            'created_by' => $creator->id,
            'case_manager_id' => $manager->id,
        ]);

        $this->assertTrue($case->creator->is($creator));
        $this->assertTrue($case->caseManager->is($manager));
    }

    public function test_closing_a_case_records_who_closed_it(): void
    {
        $closer = User::factory()->create();

        $case = CaseFile::factory()->closed()->create(['closed_by' => $closer->id]);

        $this->assertSame(CaseStatus::CLOSED, $case->status);
        $this->assertTrue($case->closer->is($closer));
        $this->assertNotNull($case->closed_at);
    }

    public function test_case_has_many_physical_sources(): void
    {
        $case = CaseFile::factory()->create();
        PhysicalSource::factory()->count(2)->create(['case_id' => $case->id]);

        $this->assertCount(2, $case->physicalSources);
    }

    public function test_case_has_many_assigned_users(): void
    {
        $case = CaseFile::factory()->create();
        $user = User::factory()->create();

        CaseAssignment::factory()->create([
            'case_id' => $case->id,
            'user_id' => $user->id,
        ]);

        $this->assertTrue($case->assignedUsers->contains($user));
    }
}
