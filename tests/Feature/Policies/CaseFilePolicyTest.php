<?php

namespace Tests\Feature\Policies;

use App\Enums\UserRole;
use App\Models\CaseAssignment;
use App\Models\CaseFile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CaseFilePolicyTest extends TestCase
{
    use RefreshDatabase;

    public function test_administrator_can_update_any_case(): void
    {
        $admin = User::factory()->role(UserRole::ADMINISTRATOR)->create();
        $case = CaseFile::factory()->create();

        $this->assertTrue($admin->can('update', $case));
    }

    public function test_case_manager_of_the_case_can_update_it(): void
    {
        $manager = User::factory()->role(UserRole::CASE_MANAGER)->create();
        $case = CaseFile::factory()->create(['case_manager_id' => $manager->id]);

        $this->assertTrue($manager->can('update', $case));
    }

    public function test_an_unrelated_investigator_cannot_update_the_case(): void
    {
        $investigator = User::factory()->role(UserRole::INVESTIGATOR)->create();
        $case = CaseFile::factory()->create();

        $this->assertFalse($investigator->can('update', $case));
    }

    public function test_only_administrator_and_case_manager_roles_can_create_cases(): void
    {
        $analyst = User::factory()->role(UserRole::ANALYST)->create();
        $caseManager = User::factory()->role(UserRole::CASE_MANAGER)->create();

        $this->assertFalse($analyst->can('create', CaseFile::class));
        $this->assertTrue($caseManager->can('create', CaseFile::class));
    }

    public function test_only_administrator_can_delete_a_case(): void
    {
        $admin = User::factory()->role(UserRole::ADMINISTRATOR)->create();
        $manager = User::factory()->role(UserRole::CASE_MANAGER)->create();
        $case = CaseFile::factory()->create(['case_manager_id' => $manager->id]);

        $this->assertTrue($admin->can('delete', $case));
        $this->assertFalse($manager->can('delete', $case));
    }

    public function test_auditor_can_view_any_case_without_assignment(): void
    {
        $auditor = User::factory()->role(UserRole::AUDITOR)->create();
        $case = CaseFile::factory()->create();

        $this->assertTrue($auditor->can('view', $case));
    }

    public function test_an_assigned_user_can_view_the_case(): void
    {
        $user = User::factory()->role(UserRole::EVIDENCE_CUSTODIAN)->create();
        $case = CaseFile::factory()->create();

        CaseAssignment::factory()->create([
            'case_id' => $case->id,
            'user_id' => $user->id,
        ]);

        $this->assertTrue($user->can('view', $case));
    }

    public function test_an_unrelated_user_cannot_view_the_case(): void
    {
        $user = User::factory()->role(UserRole::ANALYST)->create();
        $case = CaseFile::factory()->create();

        $this->assertFalse($user->can('view', $case));
    }
}
