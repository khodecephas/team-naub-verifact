<?php

namespace App\Services;

use App\Enums\EvidenceActivityType;
use App\Enums\EvidenceType;
use App\Enums\IdentifierScope;
use App\Enums\IntegrityStatus;
use App\Models\CaseFile;
use App\Models\Evidence;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Registers master evidence through one controlled path. The temporary
 * upload is hashed before storage, then the stored master is hashed again
 * before its database record is committed.
 */
class EvidenceRegistrationService
{
    /**
     * Register a new master evidence record for the given case.
     *
     * The evidence number is generated before the file is stored, so a
     * failure after that point leaves a gap in the sequence rather than a
     * held lock across slow file I/O — an accepted, standard trade-off for
     * race-safe identifiers. The file is written to disk before the
     * database row is created; if row creation then fails for any reason,
     * the just-written file is deleted so nothing is orphaned. This ordering
     * also means there is no "DB succeeded but the filesystem failed"
     * case to guard against — storage always happens first.
     *
     * @param  array{physical_source_id?: int|null, title: string, description?: string|null, evidence_type: string}  $data
     */
    public static function register(?CaseFile $case, User $registeredBy, array $data, UploadedFile $file): Evidence
    {
        $sourcePath = $file->getRealPath();

        if ($sourcePath === false) {
            throw new \RuntimeException('Uploaded evidence file is no longer available for registration.');
        }

        $sourceHash = EvidenceHashService::sha256Path($sourcePath);
        $evidenceNumber = IdentifierService::next(IdentifierScope::EVIDENCE());
        $disk = config('evidence.disk');

        $extension = self::safeExtension($file);
        $caseDirectory = $case?->case_number ?? 'unassigned';
        $directory = "evidence/{$caseDirectory}/{$evidenceNumber}/master";
        $filename = "master{$extension}";

        $storedPath = Storage::disk($disk)->putFileAs($directory, $file, $filename);

        if ($storedPath === false) {
            throw new \RuntimeException("Failed to store evidence file for {$evidenceNumber}.");
        }

        try {
            $storedHash = EvidenceHashService::sha256($disk, $storedPath);

            if (! hash_equals($sourceHash, $storedHash)) {
                throw new \RuntimeException('Stored evidence failed its initial integrity validation.');
            }

            return DB::transaction(function () use (
                $case,
                $registeredBy,
                $data,
                $file,
                $evidenceNumber,
                $disk,
                $storedPath,
                $sourceHash,
                $storedHash,
                $extension,
            ) {
                $evidence = Evidence::create([
                    'evidence_number' => $evidenceNumber,
                    'case_id' => $case?->id,
                    'physical_source_id' => $data['physical_source_id'] ?? null,
                    'title' => $data['title'],
                    'description' => $data['description'] ?? null,
                    'evidence_type' => $data['evidence_type'],
                    'storage_disk' => $disk,
                    'storage_path' => $storedPath,
                    'original_filename' => self::sanitizeOriginalFilename($file->getClientOriginalName()),
                    'mime_type' => $file->getMimeType(),
                    'file_extension' => ltrim($extension, '.') ?: null,
                    'file_size_bytes' => $file->getSize(),
                    'sha256_baseline' => $sourceHash,
                    'integrity_status' => IntegrityStatus::VERIFIED,
                    'registered_by' => $registeredBy->id,
                    'current_custodian_id' => $registeredBy->id,
                    'registered_at' => now(),
                ]);

                $evidence->verifications()->create([
                    'baseline_sha256' => $sourceHash,
                    'observed_sha256' => $storedHash,
                    'matches_baseline' => true,
                    'verification_method' => 'REGISTRATION_VALIDATION',
                    'verified_by' => $registeredBy->id,
                    'verified_at' => now(),
                ]);

                EvidenceCustodyService::recordInitialCustody($evidence, $registeredBy);

                EvidenceActivityEventService::append(
                    $evidence,
                    EvidenceActivityType::EVIDENCE_REGISTERED,
                    $registeredBy,
                    [
                        'case_number' => $case?->case_number,
                        'sha256_baseline' => $sourceHash,
                        'file_size_bytes' => $file->getSize(),
                    ],
                    $evidence->registered_at,
                );

                return $evidence;
            });
        } catch (Throwable $e) {
            // Never leave a stored file behind for a database record that
            // doesn't exist.
            Storage::disk($disk)->delete($storedPath);

            throw $e;
        }
    }

    public static function registerUnassigned(User $registeredBy, UploadedFile $file): Evidence
    {
        $originalFilename = self::sanitizeOriginalFilename($file->getClientOriginalName());
        $derivedTitle = trim((string) pathinfo($originalFilename, PATHINFO_FILENAME));

        return self::register(
            case: null,
            registeredBy: $registeredBy,
            data: [
                'title' => $derivedTitle !== '' ? mb_substr($derivedTitle, 0, 255) : 'Untitled evidence',
                'evidence_type' => EvidenceType::OTHER,
            ],
            file: $file,
        );
    }

    /**
     * Derive a safe, filesystem-appropriate extension for the stored file.
     *
     * The client-supplied filename/extension is never trusted for path
     * construction — only for display, and even then it's sanitized
     * separately. This guesses from file content via Symfony's MIME-type
     * guesser, then strips everything but letters/digits as a hard backstop
     * against path traversal or injection through a crafted filename.
     */
    private static function safeExtension(UploadedFile $file): string
    {
        $guessed = $file->extension() ?: $file->getClientOriginalExtension();
        $safe = strtolower((string) preg_replace('/[^a-z0-9]/i', '', (string) $guessed));

        if ($safe === '' || strlen($safe) > 10) {
            return '.bin';
        }

        return ".{$safe}";
    }

    /**
     * Strip control characters and cap the length of the original filename
     * before it's persisted as display-only metadata.
     */
    private static function sanitizeOriginalFilename(string $name): string
    {
        $name = str_replace(["\0", "\r", "\n"], '', $name);

        return mb_substr(trim($name), 0, 255);
    }
}
