<?php

namespace App\Http\Controllers;

use App\Enums\CustodyRequestStatus;
use App\Enums\UserRole;
use App\Models\CustodyRequest;
use App\Models\Evidence;
use App\Models\EvidenceCustodyEvent;
use App\Services\EvidenceCustodyService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustodyController extends Controller
{
    /** Show current holdings, actionable requests, and visible custody history. */
    public function index(Request $request): Response
    {
        $visibleEvidence = Evidence::query()->where(function (Builder $query) use ($request) {
            $query->whereHas('case', fn (Builder $caseQuery) => $caseQuery->visibleTo($request->user()))
                ->orWhere(function (Builder $unassigned) use ($request) {
                    $unassigned->whereNull('case_id');
                    if (! in_array($request->user()->role, [UserRole::ADMINISTRATOR, UserRole::AUDITOR], true)) {
                        $unassigned->where('registered_by', $request->user()->id);
                    }
                });
        })->when($request->filled('case'), fn (Builder $query) => $query
            ->whereHas('case', fn (Builder $caseQuery) => $caseQuery
                ->where('case_number', $request->string('case')->toString())));
        $visibleIds = (clone $visibleEvidence)->pluck('id');

        $holdings = (clone $visibleEvidence)
            ->where('current_custodian_id', $request->user()->id)
            ->with(['case:id,case_number,title', 'currentCustodian:id,name'])
            ->latest('registered_at')->get();

        $requests = CustodyRequest::query()
            ->whereIn('evidence_id', $visibleIds)
            ->where(function (Builder $query) use ($request) {
                $query->where('requested_by', $request->user()->id)
                    ->orWhere('current_custodian_id', $request->user()->id);
                if ($request->user()->role === UserRole::ADMINISTRATOR) {
                    $query->orWhereNotNull('id');
                }
            })
            ->with(['evidence:id,evidence_number,title,current_custodian_id', 'requester:id,name', 'currentCustodian:id,name', 'reviewer:id,name'])
            ->latest()->get();

        $history = EvidenceCustodyEvent::query()
            ->whereIn('evidence_id', $visibleIds)
            ->with(['evidence:id,evidence_number,title', 'fromCustodian:id,name', 'toCustodian:id,name', 'transferredBy:id,name'])
            ->latest('occurred_at')->limit(100)->get();

        return Inertia::render('Custody/Index', [
            'holdings' => $holdings->map(fn (Evidence $evidence) => [
                'evidence_number' => $evidence->evidence_number,
                'title' => $evidence->title,
                'case_number' => $evidence->case?->case_number,
                'location' => $evidence->current_custody_location,
                'since' => $evidence->custodyEvents()->latest('occurred_at')->first()?->occurred_at?->toIso8601String()
                    ?? $evidence->registered_at->toIso8601String(),
                'chain_verified' => EvidenceCustodyService::verifyChain($evidence),
            ]),
            'requests' => $requests->map(fn (CustodyRequest $item) => [
                'id' => $item->id,
                'evidence_number' => $item->evidence->evidence_number,
                'evidence_title' => $item->evidence->title,
                'requester' => $item->requester->name,
                'current_custodian' => $item->currentCustodian->name,
                'purpose' => $item->purpose,
                'requested_location' => $item->requested_location,
                'status' => $item->status,
                'reviewer' => $item->reviewer?->name,
                'review_notes' => $item->review_notes,
                'created_at' => $item->created_at->toIso8601String(),
                'can_review' => $item->status === CustodyRequestStatus::PENDING
                    && ($request->user()->role === UserRole::ADMINISTRATOR || $item->current_custodian_id === $request->user()->id),
                'can_cancel' => $item->status === CustodyRequestStatus::PENDING && $item->requested_by === $request->user()->id,
            ]),
            'history' => $history->map(fn (EvidenceCustodyEvent $event) => [
                'id' => $event->id,
                'evidence_number' => $event->evidence->evidence_number,
                'evidence_title' => $event->evidence->title,
                'from_custodian' => $event->fromCustodian?->name,
                'to_custodian' => $event->toCustodian->name,
                'performed_by' => $event->transferredBy->name,
                'purpose' => $event->purpose,
                'from_location' => $event->from_location,
                'to_location' => $event->to_location,
                'method' => $event->transfer_method,
                'occurred_at' => $event->occurred_at->toIso8601String(),
            ]),
            'caseFilter' => $request->string('case')->toString() ?: null,
        ]);
    }
}
