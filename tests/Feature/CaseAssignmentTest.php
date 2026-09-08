<?php

namespace Tests\Feature;

use App\Enums\CaseAssignmentRole;
use App\Models\CaseAssignment;
use App\Models\CaseFile;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CaseAssignmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_assignment_links_a_case_and_a_user_with_a_role(): void
    {
        $case = CaseFile::factory()->create();
        $user = User::factory()->create();

        $assignment = CaseAssignment::factory()->create([
            'case_id' => $case->id,
            'user_id' => $user->id,
            'role_on_case' => CaseAssignmentRole::EXAMINER,
        ]);

        $this->assertTrue($assignment->case->is($case));
        $this->assertTrue($assignment->user->is($user));
        $this->assertSame(CaseAssignmentRole::EXAMINER, $assignment->role_on_case);
    }

    public function test_the_same_user_cannot_be_assigned_the_same_role_on_a_case_twice(): void
    {
        $case = CaseFile::factory()->create();
        $user = User::factory()->create();

        CaseAssignment::factory()->create([
            'case_id' => $case->id,
            'user_id' => $user->id,
            'role_on_case' => CaseAssignmentRole::ANALYST,
        ]);

        $this->expectException(QueryException::class);

        CaseAssignment::factory()->create([
            'case_id' => $case->id,
            'user_id' => $user->id,
            'role_on_case' => CaseAssignmentRole::ANALYST,
        ]);
    }

    public function test_the_same_user_can_hold_two_different_roles_on_the_same_case(): void
    {
        $case = CaseFile::factory()->create();
        $user = User::factory()->create();

        CaseAssignment::factory()->create([
            'case_id' => $case->id,
            'user_id' => $user->id,
            'role_on_case' => CaseAssignmentRole::ANALYST,
        ]);

        $second = CaseAssignment::factory()->create([
            'case_id' => $case->id,
            'user_id' => $user->id,
            'role_on_case' => CaseAssignmentRole::EXAMINER,
        ]);

        $this->assertNotNull($second->id);
    }
}
