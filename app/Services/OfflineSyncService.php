<?php

namespace App\Services;

use App\Enums\CollectionSource;
use App\Enums\OfflineSyncOutcome;
use App\Models\CaseFile;
use App\Models\Evidence;
use App\Models\OfflineSyncAttempt;
use App\Models\PhysicalSource;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\UploadedFile;

/**
 * Synchronizes a device's offline collection queue. Reuses
 * EvidenceRegistrationService/EvidenceHashService untouched — this class
 * only adds the idempotency check, the independent server-side hash
 * comparison against the client's claimed hash, and the offline provenance
 * fields, before handing off to the normal registration path.
 */
class OfflineSyncService
{
    /**
     * Create (or return the already-synced) physical source for an offline
     * collection id. Idempotent: retried syncs of the same local record
     * never create a second row.
     *
     * @param  array{label: string, source_type: string, description?: string|null, collection_location?: string|null}  $data
     */
    public static function syncPhysicalSource(CaseFile $case, string $offlineCollectionId, array $data): PhysicalSource
    {
        $existing = PhysicalSource::query()->where('offline_collection_id', $offlineCollectionId)->first();

        if ($existing !== null) {
            return $existing;
        }

        try {
            return PhysicalSource::create([
                'case_id' => $case->id,
                'offline_collection_id' => $offlineCollectionId,
                'label' => $data['label'],
                'source_type' => $data['source_type'],
                'description' => $data['description'] ?? null,
                'collection_location' => $data['collection_location'] ?? null,
            ]);
        } catch (QueryException $exception) {
            // Another sync of the same record won the race (or the case's
            // pre-existing (case_id, label) uniqueness collided) — recover
            // idempotently rather than surfacing a duplicate error.
            $existing = PhysicalSource::query()->where('offline_collection_id', $offlineCollectionId)->first();

            if ($existing !== null) {
                return $existing;
            }

            throw $exception;
        }
    }

    /**
     * Synchronize one offline-collected evidence item.
     *
     * @param  array{
     *     offline_collection_id: string,
     *     physical_source_id?: int|null,
     *     title: string,
     *     description?: string|null,
     *     evidence_type: string,
     *     client_sha256: string,
     *     collected_at: string,
     *     collected_timezone?: string|null,
     * }  $data
     * @return array{outcome: string, evidence: ?Evidence, server_sha256: ?string}
     */
    public static function syncEvidence(CaseFile $case, User $user, array $data, UploadedFile $file): array
    {
        $existing = Evidence::query()->where('offline_collection_id', $data['offline_collection_id'])->first();

        if ($existing !== null) {
            return ['outcome' => OfflineSyncOutcome::SUCCESS, 'evidence' => $existing, 'server_sha256' => $existing->sha256_baseline];
        }

        $sourcePath = $file->getRealPath();

        if ($sourcePath === false) {
            throw new \RuntimeException('Uploaded evidence file is no longer available for synchronization.');
        }

        $serverHash = EvidenceHashService::sha256Path($sourcePath);
        $clientHash = strtolower($data['client_sha256']);

        if (! hash_equals($serverHash, $clientHash)) {
            self::logAttempt($case, $user, $data, OfflineSyncOutcome::HASH_MISMATCH, $clientHash, $serverHash);

            return ['outcome' => OfflineSyncOutcome::HASH_MISMATCH, 'evidence' => null, 'server_sha256' => $serverHash];
        }

        try {
            $evidence = EvidenceRegistrationService::register($case, $user, [
                'physical_source_id' => $data['physical_source_id'] ?? null,
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'evidence_type' => $data['evidence_type'],
            ], $file);
        } catch (QueryException $exception) {
            // A concurrent retry of this same offline record won the race.
            $existing = Evidence::query()->where('offline_collection_id', $data['offline_collection_id'])->first();

            if ($existing !== null) {
                return ['outcome' => OfflineSyncOutcome::SUCCESS, 'evidence' => $existing, 'server_sha256' => $existing->sha256_baseline];
            }

            self::logAttempt($case, $user, $data, OfflineSyncOutcome::ERROR, $clientHash, $serverHash, $exception->getMessage());

            throw $exception;
        }

        $evidence->update([
            'collection_source' => CollectionSource::OFFLINE,
            'offline_collection_id' => $data['offline_collection_id'],
            'collected_at' => $data['collected_at'],
            'collected_timezone' => $data['collected_timezone'] ?? null,
            'client_sha256' => $clientHash,
        ]);

        self::logAttempt($case, $user, $data, OfflineSyncOutcome::SUCCESS, $clientHash, $serverHash, null, $evidence);

        return ['outcome' => OfflineSyncOutcome::SUCCESS, 'evidence' => $evidence->fresh(), 'server_sha256' => $serverHash];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private static function logAttempt(
        CaseFile $case,
        User $user,
        array $data,
        string $outcome,
        ?string $clientHash,
        ?string $serverHash,
        ?string $errorMessage = null,
        ?Evidence $evidence = null,
    ): void {
        OfflineSyncAttempt::create([
            'offline_collection_id' => $data['offline_collection_id'],
            'subject_type' => 'evidence',
            'case_id' => $case->id,
            'attempted_by' => $user->id,
            'outcome' => $outcome,
            'client_sha256' => $clientHash,
            'server_sha256' => $serverHash,
            'evidence_id' => $evidence?->id,
            'error_message' => $errorMessage,
            'attempted_at' => now(),
        ]);
    }
}
