<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\CustodyRequest;
use App\Models\User;

class CustodyRequestPolicy
{
    /** The current holder or an administrator may approve or reject. */
    public function review(User $user, CustodyRequest $request): bool
    {
        return $user->role === UserRole::ADMINISTRATOR
            || ($request->current_custodian_id === $user->id
                && $request->evidence->current_custodian_id === $user->id);
    }

    /** Requesters may cancel only their own pending requests; state is checked by the service. */
    public function cancel(User $user, CustodyRequest $request): bool
    {
        return $request->requested_by === $user->id;
    }
}
