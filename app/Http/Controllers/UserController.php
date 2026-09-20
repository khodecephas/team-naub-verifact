<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

/**
 * User provisioning. This system is admin-provisioned only — the public
 * self-registration route has been removed — so this is the sole way a
 * new account is created. Every action requires the `users.manage`
 * Spatie permission, which is only assigned to the Administrator role by
 * default (see the seed_roles_and_permissions migration) but is itself
 * configurable from the Roles screen.
 */
class UserController extends Controller
{
    /** Lists every account with summary stats for the Users screen. */
    public function index(): Response
    {
        Gate::authorize('users.manage');

        $users = User::query()->orderBy('name')->get(['id', 'name', 'email', 'role', 'created_at']);

        return Inertia::render('Users/Index', [
            'users' => $users->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'created_at' => $user->created_at->toIso8601String(),
            ]),
            'stats' => [
                'total' => $users->count(),
                'administrators' => $users->where('role', UserRole::ADMINISTRATOR)->count(),
                'roles_in_use' => $users->pluck('role')->unique()->count(),
                'added_last_30_days' => $users->filter(fn (User $user) => $user->created_at->greaterThanOrEqualTo(now()->subDays(30)))->count(),
            ],
        ]);
    }

    /** Shows the account-creation form, with each role's current permissions for the live preview panel. */
    public function create(): Response
    {
        Gate::authorize('users.manage');

        return Inertia::render('Users/Create', [
            'roles' => Role::query()->orderBy('name')->pluck('name'),
            'rolePermissions' => $this->rolePermissionMap(),
        ]);
    }

    /** Provisions a new account with the requested role. */
    public function store(StoreUserRequest $request): RedirectResponse
    {
        Gate::authorize('users.manage');

        User::create([
            'name' => $request->string('name')->toString(),
            'email' => $request->string('email')->toString(),
            'password' => Hash::make($request->string('password')->toString()),
            'role' => $request->string('role')->toString(),
        ]);

        return redirect()->route('users.index')->with('success', 'User created.');
    }

    /** Shows the edit form for an existing account, with each role's current permissions for the live preview panel. */
    public function edit(User $user): Response
    {
        Gate::authorize('users.manage');

        return Inertia::render('Users/Edit', [
            'user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'role' => $user->role],
            'roles' => Role::query()->orderBy('name')->pluck('name'),
            'rolePermissions' => $this->rolePermissionMap(),
        ]);
    }

    /** Role name => the permissions it currently grants, used to preview a role's access before assigning it. */
    private function rolePermissionMap(): array
    {
        return Role::query()->with('permissions:name')->orderBy('name')->get()
            ->mapWithKeys(fn (Role $role) => [$role->name => $role->permissions->pluck('name')])
            ->all();
    }

    /** Updates an existing account's details, role, and optionally its password. */
    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        Gate::authorize('users.manage');

        $user->update([
            'name' => $request->string('name')->toString(),
            'email' => $request->string('email')->toString(),
            'role' => $request->string('role')->toString(),
            ...$request->filled('password') ? ['password' => Hash::make($request->string('password')->toString())] : [],
        ]);

        return redirect()->route('users.index')->with('success', 'User updated.');
    }
}
