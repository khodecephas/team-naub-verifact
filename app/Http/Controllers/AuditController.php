<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Evidence;
use App\Models\EvidenceActivityEvent;
use App\Models\EvidenceVerification;
use App\Models\OfflineSyncAttempt;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A read-only audit surface for the automated checks this system runs on
 * its own — evidence verification (both the manual button and the
 * automatic re-check on every evidence/case open), offline-sync attempts
 * including the ones that never produced evidence, and the hash-chained
 * activity ledger. Nothing here is actionable; it exists so these
 * already-recorded events aren't only visible one evidence record at a
 * time.
 */
class AuditController extends Controller
{
    /** Recent history is capped, the same way the custody register caps its own history — this is a review surface, not a full export. */
    private const HISTORY_LIMIT = 200;

    public function index(Request $request): Response
    {
        $user = $request->user();
        $isPrivileged = in_array($user->role, [UserRole::ADMINISTRATOR, UserRole::AUDITOR], true);
        $visibleEvidenceIds = Evidence::query()->visibleTo($user)->pluck('id');

        $verifications = EvidenceVerification::query()
            ->whereIn('evidence_id', $visibleEvidenceIds)
            ->with(['evidence:id,evidence_number,title', 'verifiedBy:id,name'])
            ->latest('verified_at')
            ->limit(self::HISTORY_LIMIT)
            ->get();

        $syncAttempts = OfflineSyncAttempt::query()
            ->when(! $isPrivileged, fn ($query) => $query->where('attempted_by', $user->id))
            ->with(['attemptedBy:id,name', 'evidence:id,evidence_number,title'])
            ->latest('attempted_at')
            ->limit(self::HISTORY_LIMIT)
            ->get();

        $activityEvents = EvidenceActivityEvent::query()
            ->where('subject_type', 'evidence')
            ->whereIn('subject_id', $visibleEvidenceIds)
            ->with(['actor:id,name', 'subject:id,evidence_number,title'])
            ->latest('occurred_at')
            ->limit(self::HISTORY_LIMIT)
            ->get();

        return Inertia::render('Audit/Index', [
            'verifications' => $verifications->map(fn (EvidenceVerification $verification) => [
                'id' => $verification->id,
                'evidence_number' => $verification->evidence?->evidence_number,
                'evidence_title' => $verification->evidence?->title,
                'method' => $verification->verification_method,
                'matches_baseline' => $verification->matches_baseline,
                'verified_by' => $verification->verifiedBy?->name ?? 'System',
                'verified_at' => $verification->verified_at->toIso8601String(),
            ]),
            'syncAttempts' => $syncAttempts->map(fn (OfflineSyncAttempt $attempt) => [
                'id' => $attempt->id,
                'offline_collection_id' => $attempt->offline_collection_id,
                'outcome' => $attempt->outcome,
                'evidence_number' => $attempt->evidence?->evidence_number,
                'evidence_title' => $attempt->evidence?->title,
                'attempted_by' => $attempt->attemptedBy?->name ?? 'Unknown',
                'error_message' => $attempt->error_message,
                'attempted_at' => $attempt->attempted_at->toIso8601String(),
            ]),
            'activityEvents' => $activityEvents->map(fn (EvidenceActivityEvent $event) => [
                'id' => $event->id,
                'event_type' => $event->event_type,
                'evidence_number' => $event->subject?->evidence_number,
                'evidence_title' => $event->subject?->title,
                'actor' => $event->actor?->name ?? 'System',
                'occurred_at' => $event->occurred_at->toIso8601String(),
            ]),
            'historyLimit' => self::HISTORY_LIMIT,
        ]);
    }
}
