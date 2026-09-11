<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\CompareEvidenceFileRequest;
use App\Models\Evidence;
use App\Services\EvidenceHashService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class EvidenceVerificationComparisonController extends Controller
{
    /**
     * Display evidence records the current user may use as comparison baselines.
     */
    public function index(Request $request): Response
    {
        $this->authorize('verifyAny', Evidence::class);

        $canViewAllUnassigned = $request->user()->role === UserRole::ADMINISTRATOR;
        $evidence = Evidence::query()
            ->where(function ($query) use ($request, $canViewAllUnassigned) {
                $query->whereHas('case', fn ($caseQuery) => $caseQuery->visibleTo($request->user()))
                    ->orWhere(function ($unassignedQuery) use ($request, $canViewAllUnassigned) {
                        $unassignedQuery->whereNull('case_id');

                        if (! $canViewAllUnassigned) {
                            $unassignedQuery->where('registered_by', $request->user()->id);
                        }
                    });
            })
            ->with('case:id,case_number,title,case_manager_id,created_by')
            ->latest('registered_at')
            ->get([
                'id',
                'evidence_number',
                'case_id',
                'title',
                'evidence_type',
                'original_filename',
                'file_size_bytes',
                'sha256_baseline',
                'integrity_status',
                'registered_by',
                'registered_at',
            ])
            ->filter(fn (Evidence $item) => Gate::allows('verify', $item))
            ->values();

        $requestedEvidenceNumber = (string) $request->query('evidence', '');
        $selectedEvidenceNumber = $requestedEvidenceNumber !== ''
            ? $requestedEvidenceNumber
            : null;

        return Inertia::render('Evidence/Verify', [
            'cases' => $evidence
                ->pluck('case')
                ->filter()
                ->unique('id')
                ->values()
                ->map(fn ($case) => $case->only(['id', 'case_number', 'title'])),
            'evidenceOptions' => $evidence->map(fn (Evidence $item) => [
                'id' => $item->id,
                'evidence_number' => $item->evidence_number,
                'title' => $item->title,
                'evidence_type' => $item->evidence_type,
                'original_filename' => $item->original_filename,
                'file_size_bytes' => $item->file_size_bytes,
                'sha256_baseline' => $item->sha256_baseline,
                'integrity_status' => $item->integrity_status,
                'registered_at' => $item->registered_at->toIso8601String(),
                'case' => $item->case?->only(['id', 'case_number', 'title']),
            ]),
            'selectedEvidenceNumber' => $selectedEvidenceNumber,
            'verificationResult' => fn () => $request->session()->get('verification_result'),
            'maxUploadSizeKb' => (int) config('evidence.max_upload_size_kb'),
        ]);
    }

    /**
     * Hash an uploaded comparison payload and record its result against the baseline.
     */
    public function store(CompareEvidenceFileRequest $request, Evidence $evidence): RedirectResponse
    {
        $this->authorize('verify', $evidence);

        $file = $request->file('file');
        $temporaryPath = $file->getRealPath();

        if ($temporaryPath === false) {
            return back()->with('error', 'The selected comparison file is no longer available.');
        }

        $observedHash = EvidenceHashService::sha256Path($temporaryPath);
        $matchesBaseline = hash_equals($evidence->sha256_baseline, $observedHash);
        $comparisonFilename = mb_substr(
            trim(str_replace(["\0", "\r", "\n"], '', $file->getClientOriginalName())),
            0,
            255,
        );

        $verification = $evidence->verifications()->create([
            'baseline_sha256' => $evidence->sha256_baseline,
            'observed_sha256' => $observedHash,
            'matches_baseline' => $matchesBaseline,
            'verification_method' => 'UPLOADED_COMPARISON',
            'comparison_filename' => $comparisonFilename,
            'comparison_file_size_bytes' => $file->getSize(),
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
        ]);

        return redirect()
            ->route('verification.index', ['evidence' => $evidence->evidence_number])
            ->with('verification_result', [
                'verification_id' => $verification->id,
                'matches' => $matchesBaseline,
                'evidence_number' => $evidence->evidence_number,
                'evidence_title' => $evidence->title,
                'baseline_sha256' => $evidence->sha256_baseline,
                'observed_sha256' => $observedHash,
                'comparison_filename' => $comparisonFilename,
                'comparison_file_size_bytes' => $file->getSize(),
                'verified_at' => $verification->verified_at->toIso8601String(),
            ]);
    }
}
