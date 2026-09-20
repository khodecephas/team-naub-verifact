<?php

namespace App\Services;

use App\Enums\IntegrityStatus;
use App\Enums\ReportStatus;
use App\Models\CaseFile;
use App\Models\Evidence;
use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Runs the "open a case" integrity sweep: re-hashes every evidence master
 * the current user is authorised to verify (same single-file check the
 * Evidence page's own Verify action performs), and recomputes the cheap,
 * DB-only chain checks (custody per evidence, findings ledger, report
 * content hashes) that don't require reading any file from disk.
 *
 * Evidence the user isn't authorised to verify, or whose master file is
 * unavailable, is reported using its last recorded status rather than
 * skipped silently — visible, not hidden, just not freshly re-hashed.
 */
class CaseIntegrityCheckService
{
    /** @return array<string, mixed> */
    public static function run(CaseFile $case, User $user): array
    {
        $case->loadMissing(['evidence', 'reports']);

        return [
            'checked_at' => now()->toIso8601String(),
            'evidence' => $case->evidence->map(fn (Evidence $evidence) => self::checkEvidence($evidence, $user))->values(),
            'findings_chain_verified' => FindingService::verifyChain($case),
            'reports' => $case->reports
                ->where('status', '!=', ReportStatus::DRAFT)
                ->map(fn (Report $report) => [
                    'report_number' => $report->report_number,
                    'title' => $report->title,
                    'content_verified' => $report->hasValidContentHash(),
                ])
                ->values(),
        ];
    }

    /** @return array<string, mixed> */
    private static function checkEvidence(Evidence $evidence, User $user): array
    {
        $base = [
            'evidence_number' => $evidence->evidence_number,
            'title' => $evidence->title,
            'chain_verified' => EvidenceCustodyService::verifyChain($evidence),
        ];

        if (! Gate::forUser($user)->allows('verify', $evidence) || ! self::masterFileAvailable($evidence)) {
            return [
                ...$base,
                'checked' => false,
                'matches_baseline' => null,
                'integrity_status' => $evidence->integrity_status,
            ];
        }

        try {
            $verification = EvidenceVerificationService::verify($evidence, $user);

            return [
                ...$base,
                'checked' => true,
                'matches_baseline' => $verification->matches_baseline,
                'integrity_status' => $evidence->fresh()->integrity_status,
            ];
        } catch (Throwable $exception) {
            report($exception);
            $evidence->update(['integrity_status' => IntegrityStatus::VERIFICATION_REQUIRED]);

            return [
                ...$base,
                'checked' => false,
                'matches_baseline' => null,
                'integrity_status' => IntegrityStatus::VERIFICATION_REQUIRED,
            ];
        }
    }

    private static function masterFileAvailable(Evidence $evidence): bool
    {
        try {
            return Storage::disk($evidence->storage_disk)->exists($evidence->storage_path);
        } catch (Throwable $exception) {
            report($exception);

            return false;
        }
    }
}
