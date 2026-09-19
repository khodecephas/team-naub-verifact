<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\CaseFile;
use App\Models\Finding;
use App\Models\User;

class FindingPolicy
{
    private const AUTHOR_ROLES = [
        UserRole::CASE_MANAGER, UserRole::INVESTIGATOR,
        UserRole::FORENSIC_EXAMINER, UserRole::ANALYST,
    ];

    /** A finding (and its attached document) follows the same visibility as its case. */
    public function view(User $user, Finding $finding): bool
    {
        return (new CaseFilePolicy)->view($user, $finding->case);
    }

    /** Recording a finding requires an analytical role and access to the case. */
    public function record(User $user, CaseFile $case): bool
    {
        if ($user->role === UserRole::ADMINISTRATOR) {
            return true;
        }

        if (! in_array($user->role, self::AUTHOR_ROLES, true)) {
            return false;
        }

        return (new CaseFilePolicy)->view($user, $case);
    }
}
