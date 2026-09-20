<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRolePermissionsRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Role → permission management. Every policy in this app that used to
 * hardcode "which roles can do X" as a PHP array now reads the answer
 * from here (see database/migrations/..._seed_roles_and_permissions.php
 * for the starting mapping and app/Policies for how each permission is
 * consumed) — this screen is what makes that mapping actually
 * reconfigurable instead of requiring a code change.
 */
class RoleController extends Controller
{
    /** Lists every role with its permissions, member count, and summary stats for the Roles screen. */
    public function index(): Response
    {
        Gate::authorize('roles.manage');

        $roles = Role::query()->with('permissions:id,name')->orderBy('name')->get();
        $systemRoleNames = UserRole::getValues();
        $permissions = Permission::query()->orderBy('name')->pluck('name');

        return Inertia::render('Roles/Index', [
            'roles' => $roles->map(fn (Role $role) => [
                'id' => $role->id,
                'name' => $role->name,
                'is_system_role' => in_array($role->name, $systemRoleNames, true),
                'user_count' => User::query()->where('role', $role->name)->count(),
                'permissions' => $role->permissions->pluck('name'),
            ]),
            'permissions' => $permissions,
            'stats' => [
                'total_roles' => $roles->count(),
                'system_roles' => $roles->filter(fn (Role $role) => in_array($role->name, $systemRoleNames, true))->count(),
                'custom_roles' => $roles->reject(fn (Role $role) => in_array($role->name, $systemRoleNames, true))->count(),
                'total_permissions' => $permissions->count(),
            ],
        ]);
    }

    public function store(StoreRoleRequest $request): RedirectResponse
    {
        Gate::authorize('roles.manage');

        $role = Role::create(['name' => $request->string('name')->toString(), 'guard_name' => 'web']);
        $role->syncPermissions($request->input('permissions', []));

        return back()->with('success', "Role {$role->name} created.");
    }

    public function update(UpdateRolePermissionsRequest $request, Role $role): RedirectResponse
    {
        Gate::authorize('roles.manage');

        $role->syncPermissions($request->input('permissions', []));

        return back()->with('success', "Permissions updated for {$role->name}.");
    }

    /** Only custom roles with no current members may be deleted — the seven built-in roles back every existing user's `role` column. */
    public function destroy(Role $role): RedirectResponse
    {
        Gate::authorize('roles.manage');

        if (in_array($role->name, UserRole::getValues(), true)) {
            throw ValidationException::withMessages(['role' => 'Built-in roles cannot be deleted.']);
        }

        if (User::query()->where('role', $role->name)->exists()) {
            throw ValidationException::withMessages(['role' => 'This role is still assigned to at least one user.']);
        }

        $role->delete();

        return back()->with('success', "Role {$role->name} deleted.");
    }
}
