<?php

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    /**
     * Seeds the Spatie roles/permissions that back every policy's
     * role-list check (EvidencePolicy::REGISTRANT_ROLES,
     * ::VERIFICATION_ROLES, FindingPolicy::AUTHOR_ROLES,
     * ReportPolicy::CREATOR_ROLES, and the "administrators and auditors
     * see everything" bypass) plus the two new administrative
     * permissions. Runs as part of `migrate` (not a separate `db:seed`
     * step) so a fresh database — including every test run under
     * RefreshDatabase — always has this reference data, and every
     * existing user's `role` column is synced into it immediately.
     */
    public function up(): void
    {
        $permissions = [
            'records.view-any',
            'evidence.register',
            'evidence.verify',
            'findings.record',
            'reports.create',
            'cases.create',
            'users.manage',
            'roles.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $rolePermissions = [
            UserRole::ADMINISTRATOR => $permissions,
            UserRole::CASE_MANAGER => ['cases.create', 'evidence.register', 'evidence.verify', 'findings.record', 'reports.create'],
            UserRole::INVESTIGATOR => ['evidence.register', 'findings.record', 'reports.create'],
            UserRole::EVIDENCE_CUSTODIAN => ['evidence.register', 'evidence.verify', 'reports.create'],
            UserRole::FORENSIC_EXAMINER => ['evidence.verify', 'findings.record', 'reports.create'],
            UserRole::ANALYST => ['findings.record'],
            UserRole::AUDITOR => ['records.view-any'],
        ];

        foreach ($rolePermissions as $roleName => $rolePermissionNames) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $role->syncPermissions($rolePermissionNames);
        }

        // Bring every already-existing user's Spatie role in line with
        // their `role` column, so nothing loses access the moment this
        // migration runs.
        User::query()->whereIn('role', array_keys($rolePermissions))->each(
            fn (User $user) => $user->syncRoles([$user->role]),
        );
    }

    public function down(): void
    {
        Role::query()->whereIn('name', UserRole::getValues())->delete();
        Permission::query()->whereIn('name', [
            'records.view-any', 'evidence.register', 'evidence.verify', 'findings.record',
            'reports.create', 'cases.create', 'users.manage', 'roles.manage',
        ])->delete();
    }
};
