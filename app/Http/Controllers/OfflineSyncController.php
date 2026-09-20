<?php

namespace App\Http\Controllers;

use App\Enums\EvidenceType;
use App\Enums\OfflineSyncOutcome;
use App\Enums\PhysicalSourceType;
use App\Http\Requests\StoreOfflineEvidenceRequest;
use App\Models\CaseFile;
use App\Models\Evidence;
use App\Services\OfflineSyncService;
use App\Support\UploadLimit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Dedicated JSON endpoints for the offline-collection queue. These are
 * plain JSON, not Inertia responses — the PWA calls them directly with
 * fetch() using the same authenticated Laravel session and CSRF token as
 * every other request, so server authorization/session rules apply exactly
 * as they do online. Nothing here bypasses EvidencePolicy or invents a
 * separate auth mechanism.
 */
class OfflineSyncController extends Controller
{
    /**
     * Confirm the Laravel session is still valid. Reaching this action at
     * all means the `auth` middleware accepted the session; an expired or
     * missing session never gets here and instead renders a JSON 401
     * (because the request declares `Accept: application/json`), which the
     * client treats as "log in again before syncing."
     */
    public function session(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'authenticated' => true,
            'user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'role' => $user->role],
        ]);
    }

    /**
     * Minimal reference data cached for offline use — this device's user
     * identity (so the lock screen can offer an offline unlock) and the
     * user's assigned cases for situational awareness. Evidence capture
     * itself never requires a case: it follows Quick Ingest's "secure now,
     * complete details later" path, so a case created after this device
     * last had connectivity is never a blocker. Master evidence content is
     * never included here.
     */
    public function bootstrap(Request $request): JsonResponse
    {
        $user = $request->user();

        $cases = CaseFile::query()
            ->visibleTo($user)
            ->get(['id', 'case_number', 'title', 'status']);

        return response()->json([
            'user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'role' => $user->role],
            'cases' => $cases->map(fn (CaseFile $case) => [
                'id' => $case->id,
                'case_number' => $case->case_number,
                'title' => $case->title,
                'status' => $case->status,
            ]),
            'evidenceTypes' => EvidenceType::getValues(),
            'physicalSourceTypes' => PhysicalSourceType::getValues(),
            'maxUploadSizeKb' => UploadLimit::evidenceKilobytes(),
            'cachedAt' => now()->toIso8601String(),
        ]);
    }

    /**
     * Synchronize one offline-collected evidence item as an unassigned
     * master record — the same authorization Quick Ingest uses (any
     * registrant role, no case access check, because there is no case
     * yet). The server independently hashes the received file and compares
     * it against the client's claimed hash before any evidence is
     * registered — the client hash is never trusted as the baseline. Case
     * assignment, physical source, evidence type, and full description are
     * completed afterward from the evidence record's own page.
     */
    public function syncEvidence(StoreOfflineEvidenceRequest $request): JsonResponse
    {
        Gate::authorize('create', Evidence::class);

        $result = OfflineSyncService::syncEvidence(
            $request->user(),
            $request->safe()->only(['offline_collection_id', 'description', 'client_sha256', 'collected_at', 'collected_timezone']),
            $request->file('file'),
        );

        if ($result['outcome'] === OfflineSyncOutcome::HASH_MISMATCH) {
            return response()->json([
                'outcome' => OfflineSyncOutcome::HASH_MISMATCH,
                'message' => 'The file received by the server does not match the hash calculated on this device. This record has not been registered and requires manual review.',
                'server_sha256' => $result['server_sha256'],
            ], 422);
        }

        $evidence = $result['evidence'];

        return response()->json([
            'outcome' => OfflineSyncOutcome::SUCCESS,
            'evidence_number' => $evidence->evidence_number,
            'server_sha256' => $evidence->sha256_baseline,
            'registered_at' => $evidence->registered_at->toIso8601String(),
            'collected_at' => $evidence->collected_at?->toIso8601String(),
        ]);
    }

    /**
     * Whether each given evidence number has since been assigned to a case
     * — lets the offline queue disable "Assign case" once intake has
     * already been completed for a synced record, without caching case
     * assignment itself locally.
     */
    public function evidenceStatus(Request $request): JsonResponse
    {
        $numbers = $request->array('evidence_numbers');

        $evidence = Evidence::query()
            ->visibleTo($request->user())
            ->whereIn('evidence_number', $numbers)
            ->get(['evidence_number', 'case_id']);

        return response()->json([
            'assignments' => $evidence->mapWithKeys(fn (Evidence $item) => [
                $item->evidence_number => $item->case_id !== null,
            ]),
        ]);
    }
}
