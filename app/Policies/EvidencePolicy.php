<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\CaseFile;
use App\Models\Evidence;
use App\Models\User;

class EvidencePolicy
{
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
            return $user->can('records.view-any') || $user->id === $evidence->registered_by;
        }

        return $this->hasCaseAccess($user, $evidence->case);
    }

    /**
     * Coarse-grained check for whether this user's role can ever register
     * evidence at all, independent of any specific case. Which roles hold
     * the `evidence.register` permission is configured via Spatie.
     */
    public function create(User $user): bool
    {
        return $user->can('evidence.register');
    }

    /**
     * The actual enforcement point: can this user register evidence for
     * this specific case.
     */
    public function register(User $user, CaseFile $case): bool
    {
        return $user->can('evidence.register') && $this->hasCaseAccess($user, $case);
    }

    public function viewMaster(User $user, Evidence $evidence): bool
    {
        return $this->view($user, $evidence);
    }

    public function verify(User $user, Evidence $evidence): bool
    {
        return $this->hasOperationalAccess($user, $evidence, 'evidence.verify');
    }

    public function verifyAny(User $user): bool
    {
        return $user->can('evidence.verify');
    }

    public function issueWorkingCopy(User $user, Evidence $evidence): bool
    {
        return $this->hasOperationalAccess($user, $evidence, 'evidence.verify');
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
            || ($user->id === $evidence->registered_by && $user->can('evidence.register'));
    }

    /** Whether this user's role holds the given Spatie permission for this evidence's case (or its own registration, if unassigned). */
    private function hasOperationalAccess(User $user, Evidence $evidence, string $permission): bool
    {
        if (! $user->can($permission)) {
            return false;
        }

        return $evidence->case === null
            ? $user->id === $evidence->registered_by
            : $this->hasCaseAccess($user, $evidence->case);
    }

    /**
     * Administrators and auditors see every case (via `records.view-any`);
     * everyone else needs to be the creator, the case manager, or a
     * case_assignments member.
     */
    private function hasCaseAccess(User $user, CaseFile $case): bool
    {
        if ($user->can('records.view-any')) {
            return true;
        }

        return $user->id === $case->created_by
            || $user->id === $case->case_manager_id
            || $case->isAssignedTo($user);
    }
}
