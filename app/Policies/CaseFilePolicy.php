<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\CaseFile;
use App\Models\User;

class CaseFilePolicy
{
    /**
     * Every role can list cases — results are scoped elsewhere by what the
     * user can actually see.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Administrators and auditors see every case (via the `records.view-any`
     * Spatie permission — see database/migrations/..._seed_roles_and_permissions.php);
     * everyone else needs to be the creator, the case manager, or a
     * case_assignments member.
     */
    public function view(User $user, CaseFile $case): bool
    {
        if ($user->can('records.view-any')) {
            return true;
        }

        return $user->id === $case->created_by
            || $user->id === $case->case_manager_id
            || $case->isAssignedTo($user);
    }

    /**
     * Which roles may open new cases is configured via the `cases.create`
     * Spatie permission.
     */
    public function create(User $user): bool
    {
        return $user->can('cases.create');
    }

    /**
     * Administrators and the case's own manager may update it.
     */
    public function update(User $user, CaseFile $case): bool
    {
        return $user->role === UserRole::ADMINISTRATOR
            || $user->id === $case->case_manager_id;
    }

    /**
     * Closing a case follows the same rule as updating it.
     */
    public function close(User $user, CaseFile $case): bool
    {
        return $this->update($user, $case);
    }

    /**
     * Assigning team members follows the same rule as updating the case.
     */
    public function assignUsers(User $user, CaseFile $case): bool
    {
        return $this->update($user, $case);
    }

    /**
     * Only administrators may delete a case.
     */
    public function delete(User $user, CaseFile $case): bool
    {
        return $user->role === UserRole::ADMINISTRATOR;
    }
}
