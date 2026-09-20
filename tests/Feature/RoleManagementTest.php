<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RoleManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_administrator_can_view_the_roles_screen(): void
    {
        $admin = User::factory()->role(UserRole::ADMINISTRATOR)->create();

        $this->actingAs($admin)->get(route('roles.index'))->assertOk();
    }

    public function test_updating_a_roles_permissions_immediately_changes_what_that_role_can_do(): void
    {
        $admin = User::factory()->role(UserRole::ADMINISTRATOR)->create();
        $investigator = User::factory()->role(UserRole::INVESTIGATOR)->create();
        $this->assertTrue($investigator->can('evidence.register'));

        $role = Role::where('name', UserRole::INVESTIGATOR)->firstOrFail();
        $this->actingAs($admin)->patch(route('roles.update', $role), [
            'permissions' => ['findings.record'],
        ])->assertRedirect();

        $this->assertFalse($investigator->can('evidence.register'));
        $this->assertTrue($investigator->can('findings.record'));
    }

    public function test_administrator_can_create_a_custom_role(): void
    {
        $admin = User::factory()->role(UserRole::ADMINISTRATOR)->create();

        $this->actingAs($admin)->post(route('roles.store'), [
            'name' => 'FIELD_AGENT',
            'permissions' => ['evidence.register'],
        ])->assertRedirect();

        $this->assertDatabaseHas('roles', ['name' => 'FIELD_AGENT']);
    }

    public function test_a_built_in_role_cannot_be_deleted(): void
    {
        $admin = User::factory()->role(UserRole::ADMINISTRATOR)->create();
        $role = Role::where('name', UserRole::ANALYST)->firstOrFail();

        $this->actingAs($admin)->delete(route('roles.destroy', $role))->assertSessionHasErrors('role');
        $this->assertDatabaseHas('roles', ['name' => UserRole::ANALYST]);
    }

    public function test_a_custom_role_still_assigned_to_a_user_cannot_be_deleted(): void
    {
        $admin = User::factory()->role(UserRole::ADMINISTRATOR)->create();
        $role = Role::create(['name' => 'FIELD_AGENT', 'guard_name' => 'web']);
        User::factory()->role('FIELD_AGENT')->create();

        $this->actingAs($admin)->delete(route('roles.destroy', $role))->assertSessionHasErrors('role');
        $this->assertDatabaseHas('roles', ['name' => 'FIELD_AGENT']);
    }

    public function test_an_unused_custom_role_can_be_deleted(): void
    {
        $admin = User::factory()->role(UserRole::ADMINISTRATOR)->create();
        $role = Role::create(['name' => 'FIELD_AGENT', 'guard_name' => 'web']);

        $this->actingAs($admin)->delete(route('roles.destroy', $role))->assertRedirect();
        $this->assertDatabaseMissing('roles', ['name' => 'FIELD_AGENT']);
    }

    public function test_non_privileged_user_cannot_manage_roles(): void
    {
        $investigator = User::factory()->role(UserRole::INVESTIGATOR)->create();

        $this->actingAs($investigator)->get(route('roles.index'))->assertForbidden();
    }
}
