<?php

namespace App\Services;

use App\Enums\IdentifierScope;
use App\Enums\IntegrityStatus;
use App\Enums\ReportStatus;
use App\Models\CaseFile;
use App\Models\Evidence;
use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReportGenerationService
{
    /**
     * Validate selections, create a report number, and persist a reviewable draft snapshot.
     *
     * @param  array<int, int>  $evidenceIds
     * @param  array<int, int>  $findingIds
     */
    public static function createDraft(
        CaseFile $case,
        User $author,
        string $title,
        ?string $introduction,
        array $evidenceIds,
        array $findingIds = [],
        ?Report $supersedes = null,
    ): Report {
        $evidence = self::selectedEvidence($case, $evidenceIds);
        if ($supersedes !== null && ($supersedes->case_id !== $case->id || $supersedes->status !== ReportStatus::FINAL)) {
            throw ValidationException::withMessages(['supersedes_report_id' => 'Only a final report from this case can be superseded.']);
        }

        return DB::transaction(function () use ($case, $author, $title, $introduction, $evidence, $findingIds, $supersedes) {
            $reportNumber = IdentifierService::next(IdentifierScope::REPORT());
            [$snapshot, $technical] = self::buildSnapshots($case, $author, $reportNumber, $title, $introduction, $evidence);

            return Report::create([
                'report_number' => $reportNumber,
                'case_id' => $case->id,
                'title' => $title,
                'introduction' => $introduction,
                'status' => ReportStatus::DRAFT,
                'evidence_ids' => $evidence->pluck('id')->all(),
                'finding_ids' => $findingIds,
                'snapshot' => $snapshot,
                'technical_details' => $technical,
                'generated_by' => $author->id,
                'supersedes_report_id' => $supersedes?->id,
            ]);
        });
    }

    /** Refresh source records and freeze a draft as a hash-protected final snapshot. */
    public static function finalize(Report $report, User $actor): Report
    {
        return DB::transaction(function () use ($report, $actor) {
            $locked = Report::query()->lockForUpdate()->findOrFail($report->id);
            if ($locked->status !== ReportStatus::DRAFT) {
                throw new \DomainException('Only a draft report can be finalized.');
            }

            $case = CaseFile::findOrFail($locked->case_id);
            $evidence = self::selectedEvidence($case, $locked->evidence_ids);
            [$snapshot, $technical] = self::buildSnapshots(
                $case, $actor, $locked->report_number, $locked->title, $locked->introduction, $evidence,
            );
            $finalizedAt = now();
            $snapshot['report']['status'] = ReportStatus::FINAL;
            $snapshot['report']['generated_at'] = $finalizedAt->toIso8601String();

            $locked->update([
                'status' => ReportStatus::FINAL,
                'snapshot' => $snapshot,
                'technical_details' => $technical,
                'report_sha256' => self::hashSnapshot($snapshot),
                'generated_at' => $finalizedAt,
                'finalized_at' => $finalizedAt,
            ]);

            if ($locked->supersedes_report_id !== null) {
                Report::query()->whereKey($locked->supersedes_report_id)->update([
                    'status' => ReportStatus::SUPERSEDED,
                    'superseded_by' => $locked->id,
                ]);
            }

            return $locked->refresh();
        });
    }

    /** Produce a deterministic digest for later modification detection. */
    public static function hashSnapshot(array $snapshot): string
    {
        return hash('sha256', json_encode(self::canonicalize($snapshot), JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES));
    }

    /** @param array<int, int> $evidenceIds @return Collection<int, Evidence> */
    private static function selectedEvidence(CaseFile $case, array $evidenceIds): Collection
    {
        $ids = collect($evidenceIds)->map(fn ($id) => (int) $id)->unique()->values();
        if ($ids->isEmpty()) {
            throw ValidationException::withMessages(['evidence_ids' => 'Select at least one evidence item.']);
        }

        $evidence = Evidence::query()
            ->where('case_id', $case->id)
            ->whereIn('id', $ids)
            ->with([
                'registeredBy:id,name', 'currentCustodian:id,name', 'physicalSource:id,label',
                'verifications' => fn ($query) => $query->with('verifiedBy:id,name')->latest('verified_at'),
                'custodyEvents' => fn ($query) => $query->with(['fromCustodian:id,name', 'toCustodian:id,name', 'transferredBy:id,name'])->oldest('sequence_number'),
                'derivatives' => fn ($query) => $query->with('issuedTo:id,name')->oldest('issued_at'),
            ])->get();

        if ($evidence->count() !== $ids->count()) {
            throw ValidationException::withMessages(['evidence_ids' => 'Every selected evidence item must belong to the selected case.']);
        }

        return $evidence->sortBy(fn (Evidence $item) => $ids->search($item->id))->values();
    }

    /** @return array{array<string, mixed>, array<string, mixed>} */
    private static function buildSnapshots(CaseFile $case, User $author, string $number, string $title, ?string $introduction, Collection $evidence): array
    {
        $hasProblem = false;
        $primaryEvidence = [];
        $technicalEvidence = [];

        foreach ($evidence as $item) {
            $latest = $item->verifications->first();
            $chainValid = EvidenceCustodyService::verifyChain($item);
            $integrityFailure = $item->integrity_status === IntegrityStatus::INTEGRITY_FAILURE
                || ($latest !== null && ! $latest->matches_baseline);
            $hasProblem = $hasProblem || $integrityFailure || ! $chainValid;

            $primaryEvidence[] = [
                'evidence_number' => $item->evidence_number,
                'title' => $item->title,
                'type' => ucwords(strtolower(str_replace('_', ' ', $item->evidence_type))),
                'registered_by' => $item->registeredBy?->name,
                'registered_at' => $item->registered_at->toIso8601String(),
                'physical_source' => $item->physicalSource?->label,
                'current_custodian' => $item->currentCustodian?->name,
                'integrity_status' => $item->integrity_status,
                'integrity_warning' => $integrityFailure,
                'custody_warning' => ! $chainValid,
                'chain_statement' => $chainValid
                    ? 'Recorded custody history verified.'
                    : 'A break was detected in the recorded custody history. This requires review before relying on the custody record.',
                'verification' => [
                    'last_verified_at' => $latest?->verified_at?->toIso8601String(),
                    'result' => $latest === null ? 'NOT_CHECKED' : ($latest->matches_baseline ? 'MATCHED' : 'MISMATCH'),
                    'statement' => self::verificationStatement($item->integrity_status, $latest?->matches_baseline),
                ],
                'custody' => $item->custodyEvents->map(fn ($event) => [
                    'occurred_at' => ($event->occurred_at ?? $event->transferred_at)->toIso8601String(),
                    'from' => $event->fromCustodian?->name,
                    'to' => $event->toCustodian?->name,
                    'performed_by' => $event->transferredBy?->name,
                    'purpose' => $event->purpose,
                    'from_location' => $event->from_location,
                    'to_location' => $event->to_location,
                ])->all(),
                'working_copies' => $item->derivatives->map(fn ($copy) => [
                    'copy_id' => $copy->derivative_number,
                    'issued_to' => $copy->issuedTo?->name,
                    'purpose' => $copy->purpose,
                    'issued_at' => $copy->issued_at?->toIso8601String(),
                    'status' => is_object($copy->status) ? $copy->status->value : $copy->status,
                ])->all(),
            ];
            $technicalEvidence[] = [
                'evidence_number' => $item->evidence_number,
                'baseline_sha256' => $item->sha256_baseline,
                'latest_observed_sha256' => $latest?->observed_sha256,
                'verification_history' => $item->verifications->map(fn ($verification) => [
                    'observed_sha256' => $verification->observed_sha256,
                    'matches_baseline' => $verification->matches_baseline,
                    'verified_at' => $verification->verified_at->toIso8601String(),
                ])->all(),
                'custody_events' => $item->custodyEvents->map(fn ($event) => [
                    'sequence_number' => $event->sequence_number,
                    'event_hash' => $event->event_hash,
                    'previous_event_hash' => $event->previous_event_hash,
                    'hash_scheme_version' => $event->hash_scheme_version,
                ])->all(),
                'derivatives' => $item->derivatives->map(fn ($copy) => [
                    'copy_id' => $copy->derivative_number,
                    'sha256' => $copy->sha256,
                ])->all(),
            ];
        }

        $snapshot = [
            'report' => ['report_number' => $number, 'title' => $title, 'introduction' => $introduction, 'status' => ReportStatus::DRAFT, 'generated_by' => $author->name, 'generated_at' => null],
            'case' => ['case_number' => $case->case_number, 'title' => $case->title, 'summary' => $case->description],
            'integrity_explanation' => 'H1 recorded a digital fingerprint when each evidence file entered the controlled evidence system. Later checks compare the file against that recorded fingerprint. A match means no later change was detected in the registered evidence. It does not establish what happened before registration.',
            'working_copy_explanation' => 'Working copies were issued for analysis while the protected master remained in the controlled evidence store.',
            'evidence' => $primaryEvidence,
            'findings' => [],
            'findings_note' => 'No findings module is currently available in this deployment.',
            'conclusion' => $hasProblem
                ? 'One or more integrity or custody issues were detected and are identified in this report. The affected evidence should not be presented as unchanged without further review.'
                : 'Based on the records available in H1, the evidence listed in this report matches the versions registered when they entered the controlled evidence system, where later verification was recorded. No break in the recorded custody history was detected.',
        ];

        return [$snapshot, ['evidence' => $technicalEvidence]];
    }

    /** Return careful plain-language integrity wording for the primary report. */
    private static function verificationStatement(string $status, ?bool $matches): string
    {
        if ($status === IntegrityStatus::INTEGRITY_FAILURE || $matches === false) {
            return 'Integrity mismatch detected. The checked file did not match the version registered in H1.';
        }
        if ($matches === true) {
            return 'Integrity verified. The checked file matched the version registered in H1. No later change was detected.';
        }

        return 'A digital fingerprint was established when this evidence was registered. No later verification has yet been recorded.';
    }

    /** Recursively sort object keys while retaining intentional list order. */
    private static function canonicalize(mixed $value): mixed
    {
        if (! is_array($value)) {
            return $value;
        }
        if (array_is_list($value)) {
            return array_map(self::canonicalize(...), $value);
        }
        ksort($value);
        foreach ($value as $key => $item) {
            $value[$key] = self::canonicalize($item);
        }

        return $value;
    }
}
