<?php

namespace App\Services;

use App\Enums\CustodyRequestStatus;
use App\Enums\CustodyTransferMethod;
use App\Models\CustodyRequest;
use App\Models\Evidence;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CustodyRequestService
{
    /** Create a pending request against the current authoritative custodian. */
    public static function create(Evidence $evidence, User $requester, string $purpose, ?string $location): CustodyRequest
    {
        return DB::transaction(function () use ($evidence, $requester, $purpose, $location) {
            $locked = Evidence::query()->lockForUpdate()->findOrFail($evidence->id);

            if ($locked->current_custodian_id === $requester->id) {
                throw new \DomainException('You already hold custody of this evidence.');
            }
            if ($locked->current_custodian_id === null) {
                throw new \DomainException('This evidence does not have a current custodian.');
            }
            if ($locked->custodyRequests()->where('requested_by', $requester->id)
                ->where('status', CustodyRequestStatus::PENDING)->exists()) {
                throw new \DomainException('You already have a pending custody request for this evidence.');
            }

            return $locked->custodyRequests()->create([
                'requested_by' => $requester->id,
                'current_custodian_id' => $locked->current_custodian_id,
                'requested_location' => $location,
                'purpose' => $purpose,
                'status' => CustodyRequestStatus::PENDING,
            ]);
        });
    }

    /** Approve a request and change custody in one locked transaction. */
    public static function approve(CustodyRequest $request, User $reviewer, ?string $notes): CustodyRequest
    {
        return DB::transaction(function () use ($request, $reviewer, $notes) {
            $lockedRequest = CustodyRequest::query()->lockForUpdate()->findOrFail($request->id);
            $evidence = Evidence::query()->lockForUpdate()->findOrFail($lockedRequest->evidence_id);
            self::assertReviewable($lockedRequest, $evidence);
            $requester = User::findOrFail($lockedRequest->requested_by);
            self::assertEligibleRequester($evidence, $requester);

            EvidenceCustodyService::transferLocked(
                $evidence,
                $requester,
                $reviewer,
                ['purpose' => $lockedRequest->purpose, 'to_location' => $lockedRequest->requested_location, 'notes' => $notes],
                CustodyTransferMethod::REQUEST_APPROVED,
                $lockedRequest,
            );

            $lockedRequest->update([
                'status' => CustodyRequestStatus::APPROVED,
                'reviewed_by' => $reviewer->id,
                'reviewed_at' => now(),
                'review_notes' => $notes,
            ]);

            return $lockedRequest;
        });
    }

    /** Reject a pending request without changing evidence custody. */
    public static function reject(CustodyRequest $request, User $reviewer, ?string $notes): CustodyRequest
    {
        return DB::transaction(function () use ($request, $reviewer, $notes) {
            $lockedRequest = CustodyRequest::query()->lockForUpdate()->findOrFail($request->id);
            $evidence = Evidence::query()->lockForUpdate()->findOrFail($lockedRequest->evidence_id);
            self::assertReviewable($lockedRequest, $evidence);
            $lockedRequest->update([
                'status' => CustodyRequestStatus::REJECTED,
                'reviewed_by' => $reviewer->id,
                'reviewed_at' => now(),
                'review_notes' => $notes,
            ]);

            return $lockedRequest;
        });
    }

    /** Cancel a request that is still pending. */
    public static function cancel(CustodyRequest $request, User $requester): CustodyRequest
    {
        return DB::transaction(function () use ($request, $requester) {
            $locked = CustodyRequest::query()->lockForUpdate()->findOrFail($request->id);
            if ($locked->requested_by !== $requester->id || $locked->status !== CustodyRequestStatus::PENDING) {
                throw new \DomainException('Only your own pending request can be cancelled.');
            }
            $locked->update(['status' => CustodyRequestStatus::CANCELLED]);

            return $locked;
        });
    }

    /** Ensure the request still represents the current custody state. */
    private static function assertReviewable(CustodyRequest $request, Evidence $evidence): void
    {
        if ($request->status !== CustodyRequestStatus::PENDING) {
            throw new \DomainException('This custody request has already been reviewed.');
        }
        if ($evidence->current_custodian_id !== $request->current_custodian_id) {
            throw new \DomainException('Custody changed after this request was submitted. Submit a new request.');
        }
    }

    /** Ensure the requester still belongs to the evidence case at review time. */
    private static function assertEligibleRequester(Evidence $evidence, User $requester): void
    {
        $case = $evidence->case;
        $eligible = $case !== null && (
            $case->created_by === $requester->id
            || $case->case_manager_id === $requester->id
            || $case->assignments()->where('user_id', $requester->id)->exists()
        );

        if (! $eligible) {
            throw new \DomainException('The requester is no longer assigned to this evidence case.');
        }
    }
}
