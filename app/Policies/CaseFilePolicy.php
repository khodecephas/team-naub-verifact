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
     * Administrators and auditors see every case; everyone else needs to be
     * the creator, the case manager, or a case_assignments member.
     */
    public function view(User $user, CaseFile $case): bool
    {
        if (in_array($user->role, [UserRole::ADMINISTRATOR, UserRole::AUDITOR], true)) {
            return true;
        }

        return $user->id === $case->created_by
            || $user->id === $case->case_manager_id
            || $case->isAssignedTo($user);
    }

    /**
     * Only administrators and case managers may open new cases.
     */
    public function create(User $user): bool
    {
        return in_array($user->role, [UserRole::ADMINISTRATOR, UserRole::CASE_MANAGER], true);
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
