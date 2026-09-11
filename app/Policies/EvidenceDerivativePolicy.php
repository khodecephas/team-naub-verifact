<?php

namespace App\Policies;

use App\Enums\EvidenceDerivativeStatus;
use App\Enums\UserRole;
use App\Models\EvidenceDerivative;
use App\Models\User;

class EvidenceDerivativePolicy
{
    public function view(User $user, EvidenceDerivative $derivative): bool
    {
        return $user->can('view', $derivative->evidence);
    }

    public function download(User $user, EvidenceDerivative $derivative): bool
    {
        if ($derivative->status !== EvidenceDerivativeStatus::AVAILABLE) {
            return false;
        }

        return $user->role === UserRole::ADMINISTRATOR
            || $user->id === $derivative->issued_to;
    }

    public function revoke(User $user, EvidenceDerivative $derivative): bool
    {
        if ($derivative->status !== EvidenceDerivativeStatus::AVAILABLE) {
            return false;
        }

        return $user->role === UserRole::ADMINISTRATOR
            || $user->id === $derivative->created_by;
    }
}
