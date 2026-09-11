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

    private const VERIFICATION_ROLES = [
        UserRole::CASE_MANAGER,
        UserRole::EVIDENCE_CUSTODIAN,
        UserRole::FORENSIC_EXAMINER,
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
        if ($evidence->case === null) {
            return in_array($user->role, [UserRole::ADMINISTRATOR, UserRole::AUDITOR], true)
                || $user->id === $evidence->registered_by;
        }

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

    public function viewMaster(User $user, Evidence $evidence): bool
    {
        return $this->view($user, $evidence);
    }

    public function verify(User $user, Evidence $evidence): bool
    {
        return $this->hasOperationalAccess($user, $evidence, self::VERIFICATION_ROLES);
    }

    public function verifyAny(User $user): bool
    {
        return $user->role === UserRole::ADMINISTRATOR
            || in_array($user->role, self::VERIFICATION_ROLES, true);
    }

    public function issueWorkingCopy(User $user, Evidence $evidence): bool
    {
        return $this->hasOperationalAccess($user, $evidence, self::VERIFICATION_ROLES);
    }

    /** Case members may request custody when someone else currently holds it. */
    public function requestCustody(User $user, Evidence $evidence): bool
    {
        if ($evidence->case === null || $evidence->current_custodian_id === $user->id) {
            return false;
        }

        return $user->role !== UserRole::AUDITOR && $this->hasCaseAccess($user, $evidence->case);
    }

    /** Current holders and administrators can review pending requests. */
    public function reviewCustodyRequests(User $user, Evidence $evidence): bool
    {
        return $user->role === UserRole::ADMINISTRATOR
            || ($evidence->current_custodian_id === $user->id && $this->view($user, $evidence));
    }

    /** Direct transfer is a privileged administrative exception. */
    public function directTransferCustody(User $user, Evidence $evidence): bool
    {
        if ($evidence->case === null) {
            return false;
        }

        return $user->role === UserRole::ADMINISTRATOR
            || ($user->role === UserRole::EVIDENCE_CUSTODIAN
                && $this->hasCaseAccess($user, $evidence->case));
    }

    /** Custody history follows evidence visibility. */
    public function viewCustodyHistory(User $user, Evidence $evidence): bool
    {
        return $this->view($user, $evidence);
    }

    public function completeIntake(User $user, Evidence $evidence): bool
    {
        if ($evidence->case_id !== null) {
            return false;
        }

        return $user->role === UserRole::ADMINISTRATOR
            || ($user->id === $evidence->registered_by
                && in_array($user->role, self::REGISTRANT_ROLES, true));
    }

    /**
     * @param  array<int, string>  $allowedRoles
     */
    private function hasOperationalAccess(User $user, Evidence $evidence, array $allowedRoles): bool
    {
        if ($user->role === UserRole::ADMINISTRATOR) {
            return true;
        }

        if (! in_array($user->role, $allowedRoles, true)) {
            return false;
        }

        return $evidence->case === null
            ? $user->id === $evidence->registered_by
            : $this->hasCaseAccess($user, $evidence->case);
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
