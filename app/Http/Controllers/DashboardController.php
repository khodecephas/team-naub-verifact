<?php

namespace App\Http\Controllers;

use App\Enums\CaseStatus;
use App\Enums\IntegrityStatus;
use App\Http\Resources\CaseSummaryResource;
use App\Models\CaseFile;
use App\Models\Evidence;
use App\Models\PhysicalSource;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Show the authenticated user's dashboard overview: real case, evidence,
     * and integrity-status counts. There is no custody, verification-history,
     * or notifications data yet, so the page does not attempt to show any.
     */
    public function index(): Response
    {
        $integrityCounts = Evidence::query()
            ->selectRaw('integrity_status, count(*) as total')
            ->groupBy('integrity_status')
            ->pluck('total', 'integrity_status');

        $recentCases = CaseFile::query()
            ->withCount('evidence')
            ->with('caseManager:id,name')
            ->latest('updated_at')
            ->limit(5)
            ->get(['id', 'case_number', 'title', 'case_manager_id', 'status', 'updated_at']);

        $recentEvidence = Evidence::query()
            ->with('registeredBy:id,name')
            ->latest('registered_at')
            ->limit(5)
            ->get(['id', 'evidence_number', 'title', 'registered_by', 'registered_at']);

        return Inertia::render('Dashboard', [
            'stats' => [
                'active_cases' => CaseFile::whereIn('status', [CaseStatus::OPEN, CaseStatus::IN_PROGRESS])->count(),
                'total_cases' => CaseFile::count(),
                'evidence_total' => Evidence::count(),
                'physical_source_total' => PhysicalSource::count(),
                'integrity' => [
                    'baseline_established' => $integrityCounts[IntegrityStatus::BASELINE_ESTABLISHED] ?? 0,
                    'verified' => $integrityCounts[IntegrityStatus::VERIFIED] ?? 0,
                    'verification_required' => $integrityCounts[IntegrityStatus::VERIFICATION_REQUIRED] ?? 0,
                    'integrity_failure' => $integrityCounts[IntegrityStatus::INTEGRITY_FAILURE] ?? 0,
                ],
            ],
            'recentCases' => CaseSummaryResource::collection($recentCases),
            'recentEvidence' => $recentEvidence->map(fn (Evidence $item) => [
                'id' => $item->id,
                'evidence_number' => $item->evidence_number,
                'title' => $item->title,
                'registered_by' => $item->registeredBy?->name,
                'registered_at' => $item->registered_at->toIso8601String(),
            ]),
        ]);
    }
}
