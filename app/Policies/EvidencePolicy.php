<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\CaseFile;
use App\Models\Evidence;
use App\Models\User;

class EvidencePolicy
{
    /**
     * Roles allowed to register evidence, subject to case access below.
     */
    private const REGISTRANT_ROLES = [
        UserRole::CASE_MANAGER,
        UserRole::INVESTIGATOR,
        UserRole::EVIDENCE_CUSTODIAN,
    ];

    /**
     * Every role can list evidence — results are scoped elsewhere by what
     * cases the user can actually see.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * A user may view evidence if they have access to its case.
     */
    public function view(User $user, Evidence $evidence): bool
    {
        return $this->hasCaseAccess($user, $evidence->case);
    }

    /**
     * Coarse-grained check for whether this user's role can ever register
     * evidence at all, independent of any specific case.
     */
    public function create(User $user): bool
    {
        return $user->role === UserRole::ADMINISTRATOR
            || in_array($user->role, self::REGISTRANT_ROLES, true);
    }

    /**
     * The actual enforcement point: can this user register evidence for
     * this specific case.
     */
    public function register(User $user, CaseFile $case): bool
    {
        if ($user->role === UserRole::ADMINISTRATOR) {
            return true;
        }

        if (! in_array($user->role, self::REGISTRANT_ROLES, true)) {
            return false;
        }

        return $this->hasCaseAccess($user, $case);
    }

    /**
     * Download follows the same access rule as viewing, for now. The
     * download endpoint itself is not implemented until a later phase.
     */
    public function download(User $user, Evidence $evidence): bool
    {
        return $this->view($user, $evidence);
    }

    /**
     * Administrators and auditors see every case; everyone else needs to be
     * the creator, the case manager, or a case_assignments member.
     */
    private function hasCaseAccess(User $user, CaseFile $case): bool
    {
        if (in_array($user->role, [UserRole::ADMINISTRATOR, UserRole::AUDITOR], true)) {
            return true;
        }

        return $user->id === $case->created_by
            || $user->id === $case->case_manager_id
            || $case->isAssignedTo($user);
    }
}
