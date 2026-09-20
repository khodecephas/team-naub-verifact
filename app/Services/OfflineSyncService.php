<?php

namespace App\Services;

use App\Enums\CollectionSource;
use App\Enums\EvidenceActivityType;
use App\Enums\OfflineSyncOutcome;
use App\Models\Evidence;
use App\Models\OfflineSyncAttempt;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\UploadedFile;

/**
 * Synchronizes a device's offline collection queue. Reuses
 * EvidenceRegistrationService::registerUnassigned()/EvidenceHashService
 * untouched — the same "secure now, complete details later" path Quick
 * Ingest already uses, so an officer under pressure never has to pick a
 * case (or wait for one that was created after this device last had
 * connectivity) before securing a file. Case assignment, physical source,
 * evidence type, and full description are completed afterward from the
 * evidence record's own page, exactly like Quick Ingest.
 */
class OfflineSyncService
{
    /**
     * Synchronize one offline-collected evidence item as an unassigned
     * master record.
     *
     * @param  array{
     *     offline_collection_id: string,
     *     description?: string|null,
     *     client_sha256: string,
     *     collected_at: string,
     *     collected_timezone?: string|null,
     * }  $data
     * @return array{outcome: string, evidence: ?Evidence, server_sha256: ?string}
     */
    public static function syncEvidence(User $user, array $data, UploadedFile $file): array
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
            self::logAttempt($user, $data, OfflineSyncOutcome::HASH_MISMATCH, $clientHash, $serverHash);

            return ['outcome' => OfflineSyncOutcome::HASH_MISMATCH, 'evidence' => null, 'server_sha256' => $serverHash];
        }

        try {
            $evidence = EvidenceRegistrationService::registerUnassigned($user, $file);
        } catch (QueryException $exception) {
            // A concurrent retry of this same offline record won the race.
            $existing = Evidence::query()->where('offline_collection_id', $data['offline_collection_id'])->first();

            if ($existing !== null) {
                return ['outcome' => OfflineSyncOutcome::SUCCESS, 'evidence' => $existing, 'server_sha256' => $existing->sha256_baseline];
            }

            self::logAttempt($user, $data, OfflineSyncOutcome::ERROR, $clientHash, $serverHash, $exception->getMessage());

            throw $exception;
        }

        $evidence->update([
            'description' => $data['description'] ?? null,
            'collection_source' => CollectionSource::OFFLINE,
            'offline_collection_id' => $data['offline_collection_id'],
            'collected_at' => $data['collected_at'],
            'collected_timezone' => $data['collected_timezone'] ?? null,
            'client_sha256' => $clientHash,
        ]);

        $evidence = $evidence->fresh();

        EvidenceActivityEventService::append(
            $evidence,
            EvidenceActivityType::OFFLINE_SYNC_COMPLETED,
            $user,
            [
                'offline_collection_id' => $data['offline_collection_id'],
                'collected_at' => $evidence->collected_at?->toIso8601String(),
                'collected_timezone' => $evidence->collected_timezone,
                'client_sha256' => $clientHash,
                'server_sha256' => $serverHash,
                'hashes_matched' => true,
            ],
        );

        self::logAttempt($user, $data, OfflineSyncOutcome::SUCCESS, $clientHash, $serverHash, null, $evidence);

        return ['outcome' => OfflineSyncOutcome::SUCCESS, 'evidence' => $evidence, 'server_sha256' => $serverHash];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private static function logAttempt(
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
            'case_id' => null,
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
