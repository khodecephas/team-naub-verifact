<?php

namespace App\Http\Controllers;

use App\Enums\EvidenceType;
use App\Enums\OfflineSyncOutcome;
use App\Enums\PhysicalSourceType;
use App\Http\Requests\StoreOfflineEvidenceRequest;
use App\Http\Requests\StoreOfflinePhysicalSourceRequest;
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
     * Minimal, field-collection-only data cached for offline use: the
     * user's assigned cases they may register evidence into, each case's
     * already-known physical sources, and the option lists the offline
     * capture form needs. Master evidence content is never included here.
     */
    public function bootstrap(Request $request): JsonResponse
    {
        $user = $request->user();

        $cases = CaseFile::query()
            ->visibleTo($user)
            ->with(['physicalSources:id,case_id,label,source_type'])
            ->get(['id', 'case_number', 'title', 'status'])
            ->filter(fn (CaseFile $case) => Gate::allows('register', [Evidence::class, $case]))
            ->values();

        return response()->json([
            'user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'role' => $user->role],
            'cases' => $cases->map(fn (CaseFile $case) => [
                'id' => $case->id,
                'case_number' => $case->case_number,
                'title' => $case->title,
                'status' => $case->status,
                'physical_sources' => $case->physicalSources->map(fn ($source) => [
                    'id' => $source->id,
                    'label' => $source->label,
                    'source_type' => $source->source_type,
                ])->all(),
            ]),
            'evidenceTypes' => EvidenceType::getValues(),
            'physicalSourceTypes' => PhysicalSourceType::getValues(),
            'maxUploadSizeKb' => UploadLimit::evidenceKilobytes(),
            'cachedAt' => now()->toIso8601String(),
        ]);
    }

    /** Synchronize one offline-registered physical source. Idempotent by offline_collection_id. */
    public function syncPhysicalSource(StoreOfflinePhysicalSourceRequest $request, CaseFile $caseFile): JsonResponse
    {
        Gate::authorize('register', [Evidence::class, $caseFile]);

        $physicalSource = OfflineSyncService::syncPhysicalSource(
            $caseFile,
            $request->string('offline_collection_id')->toString(),
            $request->safe()->only(['label', 'source_type', 'description', 'collection_location']),
        );

        return response()->json([
            'id' => $physicalSource->id,
            'label' => $physicalSource->label,
            'source_type' => $physicalSource->source_type,
            'offline_collection_id' => $physicalSource->offline_collection_id,
        ]);
    }

    /**
     * Synchronize one offline-collected evidence item. The server
     * independently hashes the received file and compares it against the
     * client's claimed hash before any evidence is registered — the client
     * hash is never trusted as the baseline.
     */
    public function syncEvidence(StoreOfflineEvidenceRequest $request, CaseFile $caseFile): JsonResponse
    {
        Gate::authorize('register', [Evidence::class, $caseFile]);

        $result = OfflineSyncService::syncEvidence(
            $caseFile,
            $request->user(),
            $request->safe()->only([
                'offline_collection_id', 'physical_source_id', 'title', 'description',
                'evidence_type', 'client_sha256', 'collected_at', 'collected_timezone',
            ]),
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
}
