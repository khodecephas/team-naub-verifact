<?php

namespace App\Policies;

use App\Enums\ReportStatus;
use App\Enums\UserRole;
use App\Models\CaseFile;
use App\Models\Report;
use App\Models\User;

class ReportPolicy
{
    private const CREATOR_ROLES = [
        UserRole::CASE_MANAGER, UserRole::INVESTIGATOR,
        UserRole::EVIDENCE_CUSTODIAN, UserRole::FORENSIC_EXAMINER,
    ];

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Report $report): bool
    {
        return (new CaseFilePolicy)->view($user, $report->case);
    }

    public function create(User $user, ?CaseFile $case = null): bool
    {
        if ($user->role === UserRole::ADMINISTRATOR) {
            return true;
        }
        if (! in_array($user->role, self::CREATOR_ROLES, true) || $case === null) {
            return false;
        }

        return (new CaseFilePolicy)->view($user, $case);
    }

    public function finalize(User $user, Report $report): bool
    {
        return $report->status === ReportStatus::DRAFT
            && ($user->role === UserRole::ADMINISTRATOR || $report->case->case_manager_id === $user->id);
    }

    public function download(User $user, Report $report): bool
    {
        return $report->status !== ReportStatus::DRAFT && $this->view($user, $report);
    }
}
