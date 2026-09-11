<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReviewCustodyRequest;
use App\Http\Requests\StoreCustodyRequest;
use App\Models\CustodyRequest;
use App\Models\Evidence;
use App\Services\CustodyRequestService;
use DomainException;
use Illuminate\Http\RedirectResponse;

class CustodyRequestController extends Controller
{
    /** Submit a request to the evidence's current custodian. */
    public function store(StoreCustodyRequest $request, Evidence $evidence): RedirectResponse
    {
        $this->authorize('requestCustody', $evidence);
        try {
            CustodyRequestService::create(
                $evidence,
                $request->user(),
                $request->string('purpose')->toString(),
                $request->string('requested_location')->toString() ?: null,
            );
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Custody request sent to the current custodian.');
    }

    /** Approve a request and atomically transfer custody. */
    public function approve(ReviewCustodyRequest $request, CustodyRequest $custodyRequest): RedirectResponse
    {
        $this->authorize('review', $custodyRequest);
        try {
            CustodyRequestService::approve(
                $custodyRequest,
                $request->user(),
                $request->string('review_notes')->toString() ?: null,
            );
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Custody request approved and custody transferred.');
    }

    /** Reject a request without changing custody. */
    public function reject(ReviewCustodyRequest $request, CustodyRequest $custodyRequest): RedirectResponse
    {
        $this->authorize('review', $custodyRequest);
        try {
            CustodyRequestService::reject(
                $custodyRequest,
                $request->user(),
                $request->string('review_notes')->toString() ?: null,
            );
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Custody request rejected.');
    }

    /** Cancel the authenticated user's own pending request. */
    public function cancel(CustodyRequest $custodyRequest): RedirectResponse
    {
        $this->authorize('cancel', $custodyRequest);
        try {
            CustodyRequestService::cancel($custodyRequest, request()->user());
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Custody request cancelled.');
    }
}
