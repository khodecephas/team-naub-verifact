<?php

namespace Tests\Feature;

use App\Enums\CaseAssignmentRole;
use App\Enums\UserRole;
use App\Models\CaseFile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CaseMemberManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_case_manager_can_add_a_member_to_their_own_case(): void
    {
        $manager = User::factory()->role(UserRole::CASE_MANAGER)->create();
        $case = CaseFile::factory()->create(['created_by' => $manager->id, 'case_manager_id' => $manager->id]);
        $newMember = User::factory()->role(UserRole::FORENSIC_EXAMINER)->create();

        $this->actingAs($manager)->post(route('cases.members.store', $case), [
            'user_id' => $newMember->id,
            'role_on_case' => CaseAssignmentRole::EXAMINER,
        ])->assertRedirect();

        $this->assertDatabaseHas('case_assignments', [
            'case_id' => $case->id, 'user_id' => $newMember->id, 'role_on_case' => CaseAssignmentRole::EXAMINER,
        ]);
    }

    public function test_case_manager_can_remove_a_member_from_their_own_case(): void
    {
        $manager = User::factory()->role(UserRole::CASE_MANAGER)->create();
        $case = CaseFile::factory()->create(['created_by' => $manager->id, 'case_manager_id' => $manager->id]);
        $member = User::factory()->role(UserRole::FORENSIC_EXAMINER)->create();
        $assignment = \App\Models\CaseAssignment::factory()->create([
            'case_id' => $case->id, 'user_id' => $member->id, 'assigned_by' => $manager->id,
        ]);

        $this->actingAs($manager)->delete(route('cases.members.destroy', [$case, $assignment]))->assertRedirect();

        $this->assertDatabaseMissing('case_assignments', ['id' => $assignment->id]);
    }

    public function test_a_user_who_does_not_manage_the_case_cannot_add_members(): void
    {
        $manager = User::factory()->role(UserRole::CASE_MANAGER)->create();
        $case = CaseFile::factory()->create(['created_by' => $manager->id, 'case_manager_id' => $manager->id]);
        $outsider = User::factory()->role(UserRole::CASE_MANAGER)->create();
        $newMember = User::factory()->role(UserRole::FORENSIC_EXAMINER)->create();

        $this->actingAs($outsider)->post(route('cases.members.store', $case), [
            'user_id' => $newMember->id,
            'role_on_case' => CaseAssignmentRole::EXAMINER,
        ])->assertForbidden();
    }

    public function test_duplicate_assignment_is_rejected_gracefully(): void
    {
        $manager = User::factory()->role(UserRole::CASE_MANAGER)->create();
        $case = CaseFile::factory()->create(['created_by' => $manager->id, 'case_manager_id' => $manager->id]);
        $member = User::factory()->role(UserRole::FORENSIC_EXAMINER)->create();
        \App\Models\CaseAssignment::factory()->create([
            'case_id' => $case->id, 'user_id' => $member->id, 'role_on_case' => CaseAssignmentRole::EXAMINER, 'assigned_by' => $manager->id,
        ]);

        $response = $this->actingAs($manager)->post(route('cases.members.store', $case), [
            'user_id' => $member->id,
            'role_on_case' => CaseAssignmentRole::EXAMINER,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertSame(1, \App\Models\CaseAssignment::where('case_id', $case->id)->where('user_id', $member->id)->count());
    }

    public function test_administrator_can_manage_members_on_any_case(): void
    {
        $admin = User::factory()->role(UserRole::ADMINISTRATOR)->create();
        $manager = User::factory()->role(UserRole::CASE_MANAGER)->create();
        $case = CaseFile::factory()->create(['created_by' => $manager->id, 'case_manager_id' => $manager->id]);
        $newMember = User::factory()->role(UserRole::FORENSIC_EXAMINER)->create();

        $this->actingAs($admin)->post(route('cases.members.store', $case), [
            'user_id' => $newMember->id,
            'role_on_case' => CaseAssignmentRole::EXAMINER,
        ])->assertRedirect();

        $this->assertDatabaseHas('case_assignments', ['case_id' => $case->id, 'user_id' => $newMember->id]);
    }
}
