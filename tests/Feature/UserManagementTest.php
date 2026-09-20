<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_administrator_can_create_a_user_and_it_receives_a_matching_spatie_role(): void
    {
        $admin = User::factory()->role(UserRole::ADMINISTRATOR)->create();

        $this->actingAs($admin)->post(route('users.store'), [
            'name' => 'New Examiner',
            'email' => 'examiner@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => UserRole::FORENSIC_EXAMINER,
        ])->assertRedirect(route('users.index'));

        $user = User::where('email', 'examiner@example.com')->firstOrFail();
        $this->assertSame(UserRole::FORENSIC_EXAMINER, $user->role);
        $this->assertTrue($user->hasRole(UserRole::FORENSIC_EXAMINER));
        $this->assertTrue($user->can('evidence.verify'));
    }

    public function test_administrator_can_update_a_users_role_and_permissions_change_accordingly(): void
    {
        $admin = User::factory()->role(UserRole::ADMINISTRATOR)->create();
        $user = User::factory()->role(UserRole::AUDITOR)->create();
        $this->assertFalse($user->can('evidence.register'));

        $this->actingAs($admin)->put(route('users.update', $user), [
            'name' => $user->name,
            'email' => $user->email,
            'role' => UserRole::INVESTIGATOR,
        ])->assertRedirect(route('users.index'));

        $this->assertTrue($user->fresh()->can('evidence.register'));
    }

    public function test_non_privileged_user_cannot_manage_users(): void
    {
        $investigator = User::factory()->role(UserRole::INVESTIGATOR)->create();

        $this->actingAs($investigator)->get(route('users.index'))->assertForbidden();
        $this->actingAs($investigator)->post(route('users.store'), [
            'name' => 'Should not work',
            'email' => 'nope@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => UserRole::INVESTIGATOR,
        ])->assertForbidden();
    }

    public function test_public_self_registration_no_longer_exists(): void
    {
        $this->get('/register')->assertNotFound();
        $this->post('/register', [
            'name' => 'Anonymous',
            'email' => 'anon@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertNotFound();
    }
}
