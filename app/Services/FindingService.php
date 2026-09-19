<?php

namespace App\Services;

use App\Enums\IdentifierScope;
use App\Models\CaseFile;
use App\Models\Evidence;
use App\Models\Finding;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Records analyst findings as a hash-chained, append-only ledger per case —
 * the same tamper-evident approach EvidenceCustodyService uses for custody
 * events, so a recorded finding's content (and any attached document) can't
 * be silently altered later.
 */
class FindingService
{
    /**
     * Append a new finding to the case's chain. The optional attachment is
     * stored and hashed before the database row is written — mirroring
     * EvidenceRegistrationService's ordering — so a failure never leaves a
     * finding row pointing at a file that was never actually saved.
     */
    public static function record(
        CaseFile $case,
        User $author,
        string $title,
        string $narrative,
        ?Evidence $evidence = null,
        ?UploadedFile $attachment = null,
    ): Finding {
        $findingNumber = IdentifierService::next(IdentifierScope::FINDING());
        $attachmentMeta = $attachment !== null
            ? self::storeAttachment($case, $findingNumber, $attachment)
            : [];

        return DB::transaction(function () use ($case, $author, $title, $narrative, $evidence, $findingNumber, $attachmentMeta) {
            $previous = Finding::query()
                ->where('case_id', $case->id)
                ->lockForUpdate()
                ->latest('sequence_number')
                ->first();

            $occurredAt = now();
            $attributes = array_merge([
                'finding_number' => $findingNumber,
                'case_id' => $case->id,
                'evidence_id' => $evidence?->id,
                'authored_by' => $author->id,
                'sequence_number' => ($previous?->sequence_number ?? 0) + 1,
                'title' => $title,
                'narrative' => $narrative,
                'attachment_disk' => null,
                'attachment_path' => null,
                'attachment_original_filename' => null,
                'attachment_mime_type' => null,
                'attachment_size_bytes' => null,
                'attachment_sha256' => null,
                'previous_finding_hash' => $previous?->finding_hash,
                'hash_scheme_version' => 1,
                'occurred_at' => $occurredAt,
            ], $attachmentMeta);
            $attributes['finding_hash'] = self::findingHash($attributes);

            return Finding::create($attributes);
        });
    }

    /** Verify sequence order, chain links, and canonical hashes for a case's findings. */
    public static function verifyChain(CaseFile $case): bool
    {
        $previous = null;
        $sequence = 1;

        foreach (Finding::query()->where('case_id', $case->id)->oldest('sequence_number')->get() as $finding) {
            if ($finding->sequence_number !== $sequence || $finding->previous_finding_hash !== $previous) {
                return false;
            }
            if (! hash_equals($finding->finding_hash, self::findingHash($finding->getAttributes()))) {
                return false;
            }
            $previous = $finding->finding_hash;
            $sequence++;
        }

        return true;
    }

    /**
     * Store the uploaded document under the same controlled disk evidence
     * uses, hash it, and validate the stored copy matches the upload before
     * any database row can reference it.
     *
     * @return array<string, mixed>
     */
    private static function storeAttachment(CaseFile $case, string $findingNumber, UploadedFile $attachment): array
    {
        $sourcePath = $attachment->getRealPath();

        if ($sourcePath === false) {
            throw new \RuntimeException('Uploaded finding attachment is no longer available.');
        }

        $sourceHash = EvidenceHashService::sha256Path($sourcePath);
        $disk = config('evidence.disk');
        $extension = self::safeExtension($attachment);
        $directory = "findings/{$case->case_number}/{$findingNumber}";
        $filename = "attachment{$extension}";

        $storedPath = Storage::disk($disk)->putFileAs($directory, $attachment, $filename);

        if ($storedPath === false) {
            throw new \RuntimeException("Failed to store finding attachment for {$findingNumber}.");
        }

        $storedHash = EvidenceHashService::sha256($disk, $storedPath);

        if (! hash_equals($sourceHash, $storedHash)) {
            throw new \RuntimeException('Stored finding attachment failed its integrity validation.');
        }

        return [
            'attachment_disk' => $disk,
            'attachment_path' => $storedPath,
            'attachment_original_filename' => self::sanitizeOriginalFilename($attachment->getClientOriginalName()),
            'attachment_mime_type' => $attachment->getMimeType(),
            'attachment_size_bytes' => $attachment->getSize(),
            'attachment_sha256' => $storedHash,
        ];
    }

    /** Derive a safe, filesystem-appropriate extension for the stored attachment. */
    private static function safeExtension(UploadedFile $file): string
    {
        $guessed = $file->extension() ?: $file->getClientOriginalExtension();
        $safe = strtolower((string) preg_replace('/[^a-z0-9]/i', '', (string) $guessed));

        if ($safe === '' || strlen($safe) > 10) {
            return '.bin';
        }

        return ".{$safe}";
    }

    /** Strip control characters and cap the length of the original filename before it's persisted. */
    private static function sanitizeOriginalFilename(string $name): string
    {
        $name = str_replace(["\0", "\r", "\n"], '', $name);

        return mb_substr(trim($name), 0, 255);
    }

    /** Build a deterministic digest from stable IDs and recorded finding values. */
    private static function findingHash(array $finding): string
    {
        $occurredAt = $finding['occurred_at'] instanceof \DateTimeInterface
            ? $finding['occurred_at']->format('Y-m-d H:i:s')
            : (string) $finding['occurred_at'];

        return hash('sha256', implode('|', [
            $finding['hash_scheme_version'], $finding['case_id'], $finding['evidence_id'] ?? '',
            $finding['sequence_number'], $finding['authored_by'], $finding['title'],
            $finding['narrative'], $occurredAt, $finding['previous_finding_hash'] ?? '',
            $finding['attachment_sha256'] ?? '',
        ]));
    }
}
