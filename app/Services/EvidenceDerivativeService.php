<?php

namespace App\Services;

use App\Enums\EvidenceActivityType;
use App\Enums\EvidenceDerivativeStatus;
use App\Enums\EvidenceDerivativeType;
use App\Enums\IdentifierScope;
use App\Models\Evidence;
use App\Models\EvidenceDerivative;
use App\Models\User;
use DomainException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class EvidenceDerivativeService
{
    public static function issueWorkingCopy(
        Evidence $evidence,
        User $createdBy,
        User $issuedTo,
        string $purpose,
        int $retentionMinutes,
    ): EvidenceDerivative {
        $verification = EvidenceVerificationService::verify($evidence, $createdBy);

        if (! $verification->matches_baseline) {
            throw new DomainException('Working-copy issuance was blocked because the protected master failed integrity verification.');
        }

        $derivativeNumber = IdentifierService::next(IdentifierScope::EVIDENCE_DERIVATIVE());
        $extension = $evidence->file_extension ? ".{$evidence->file_extension}" : '.bin';
        $caseDirectory = $evidence->case?->case_number ?? 'unassigned';
        $directory = "evidence/{$caseDirectory}/{$evidence->evidence_number}/derivatives/{$derivativeNumber}";
        $copyPath = "{$directory}/working-copy{$extension}";
        $disk = Storage::disk($evidence->storage_disk);

        if (! $disk->copy($evidence->storage_path, $copyPath)) {
            throw new RuntimeException("Failed to create derivative {$derivativeNumber}.");
        }

        try {
            $copyHash = EvidenceHashService::sha256($evidence->storage_disk, $copyPath);

            if (! hash_equals($evidence->sha256_baseline, $copyHash)) {
                throw new DomainException('The generated working copy does not match the protected master baseline.');
            }

            return DB::transaction(function () use (
                $evidence,
                $createdBy,
                $issuedTo,
                $purpose,
                $retentionMinutes,
                $derivativeNumber,
                $copyPath,
                $copyHash,
            ) {
                Evidence::query()->whereKey($evidence->id)->lockForUpdate()->firstOrFail();
                $issuedAt = now();
                $derivative = EvidenceDerivative::create([
                    'derivative_number' => $derivativeNumber,
                    'evidence_id' => $evidence->id,
                    'derivative_type' => EvidenceDerivativeType::WORKING_COPY,
                    'storage_disk' => $evidence->storage_disk,
                    'storage_path' => $copyPath,
                    'original_filename' => $evidence->original_filename,
                    'mime_type' => $evidence->mime_type,
                    'file_size_bytes' => Storage::disk($evidence->storage_disk)->size($copyPath),
                    'sha256' => $copyHash,
                    'status' => EvidenceDerivativeStatus::AVAILABLE,
                    'created_by' => $createdBy->id,
                    'issued_to' => $issuedTo->id,
                    'purpose' => $purpose,
                    'issued_at' => $issuedAt,
                    'expires_at' => $issuedAt->copy()->addMinutes($retentionMinutes),
                ]);

                $basePayload = self::eventPayload($derivative);
                EvidenceActivityEventService::append(
                    $derivative,
                    EvidenceActivityType::WORKING_COPY_CREATED,
                    $createdBy,
                    [...$basePayload, 'from_status' => null, 'to_status' => EvidenceDerivativeStatus::AVAILABLE->value],
                    $issuedAt,
                );
                EvidenceActivityEventService::append(
                    $derivative,
                    EvidenceActivityType::WORKING_COPY_ISSUED,
                    $createdBy,
                    [...$basePayload, 'from_status' => EvidenceDerivativeStatus::AVAILABLE->value, 'to_status' => EvidenceDerivativeStatus::AVAILABLE->value],
                    $issuedAt,
                );

                return $derivative;
            });
        } catch (Throwable $exception) {
            $disk->delete($copyPath);

            throw $exception;
        }
    }

    public static function markDownloaded(EvidenceDerivative $derivative, User $actor): void
    {
        DB::transaction(function () use ($derivative, $actor) {
            $locked = EvidenceDerivative::query()->whereKey($derivative->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== EvidenceDerivativeStatus::AVAILABLE) {
                return;
            }

            $locked->update([
                'status' => EvidenceDerivativeStatus::DOWNLOADED,
                'downloaded_at' => now(),
            ]);

            EvidenceActivityEventService::append(
                $locked,
                EvidenceActivityType::WORKING_COPY_DOWNLOADED,
                $actor,
                [...self::eventPayload($locked), 'from_status' => EvidenceDerivativeStatus::AVAILABLE->value, 'to_status' => EvidenceDerivativeStatus::DOWNLOADED->value],
            );
        });

        // The application can remove only its private temporary binary. It
        // cannot remove a file already delivered to another device.
        Storage::disk($derivative->storage_disk)->delete($derivative->storage_path);
    }

    public static function expire(EvidenceDerivative $derivative): void
    {
        self::finishAvailability(
            $derivative,
            EvidenceDerivativeStatus::EXPIRED,
            EvidenceActivityType::WORKING_COPY_EXPIRED,
            null,
        );
    }

    public static function revoke(EvidenceDerivative $derivative, User $actor): void
    {
        self::finishAvailability(
            $derivative,
            EvidenceDerivativeStatus::REVOKED,
            EvidenceActivityType::WORKING_COPY_REVOKED,
            $actor,
        );
    }

    public static function expireDue(): int
    {
        $expired = 0;

        EvidenceDerivative::query()
            ->where('status', EvidenceDerivativeStatus::AVAILABLE->value)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->eachById(function (EvidenceDerivative $derivative) use (&$expired) {
                self::expire($derivative);
                $expired++;
            });

        return $expired;
    }

    private static function finishAvailability(
        EvidenceDerivative $derivative,
        EvidenceDerivativeStatus $status,
        EvidenceActivityType $eventType,
        ?User $actor,
    ): void {
        DB::transaction(function () use ($derivative, $status, $eventType, $actor) {
            $locked = EvidenceDerivative::query()->whereKey($derivative->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== EvidenceDerivativeStatus::AVAILABLE) {
                return;
            }

            $locked->update([
                'status' => $status,
                'revoked_at' => $status === EvidenceDerivativeStatus::REVOKED ? now() : null,
            ]);

            EvidenceActivityEventService::append(
                $locked,
                $eventType,
                $actor,
                [...self::eventPayload($locked), 'from_status' => EvidenceDerivativeStatus::AVAILABLE->value, 'to_status' => $status->value],
            );
        });

        Storage::disk($derivative->storage_disk)->delete($derivative->storage_path);
    }

    /** @return array<string, int|string|null> */
    private static function eventPayload(EvidenceDerivative $derivative): array
    {
        return [
            'derivative_number' => $derivative->derivative_number,
            'evidence_id' => $derivative->evidence_id,
            'file_sha256' => $derivative->sha256,
            'issued_to' => $derivative->issued_to,
            'purpose' => $derivative->purpose,
        ];
    }
}
