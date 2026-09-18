<?php

namespace App\Http\Controllers;

use App\Enums\CaseStatus;
use App\Enums\IdentifierScope;
use App\Enums\IntegrityStatus;
use App\Enums\ReportStatus;
use App\Http\Requests\CaseStoreRequest;
use App\Http\Resources\CaseSummaryResource;
use App\Http\Resources\EvidenceResource;
use App\Models\CaseFile;
use App\Models\Evidence;
use App\Models\EvidenceCustodyEvent;
use App\Models\PhysicalSource;
use App\Models\Report;
use App\Services\EvidenceCustodyService;
use App\Services\IdentifierService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CaseController extends Controller
{
    /**
     * List cases. Scoped the same way CaseFilePolicy::view() would gate an
     * individual case — administrators and auditors see everything, anyone
     * else only sees cases they created, manage, or are assigned to. Listing
     * would otherwise leak cases a user isn't allowed to open individually.
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', CaseFile::class);

        $user = $request->user();
        $status = $request->string('status')->toString() ?: null;

        $visibleCaseIds = CaseFile::query()->visibleTo($user)->pluck('id');

        $cases = $this->filteredCases($request)
            ->withCount('evidence')
            ->with('caseManager:id,name')
            ->latest('updated_at')
            ->paginate(15)
            ->withQueryString();

        // Status tab counts, scoped by the same visibility rule as the list
        // itself — never counting cases the user can't see.
        $statusCounts = CaseFile::query()
            ->visibleTo($user)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return Inertia::render('Cases/Index', [
            'cases' => CaseSummaryResource::collection($cases),
            'filters' => $request->only(['status', 'search', 'priority', 'category', 'lead', 'jurisdiction']),
            'filterOptions' => [
                'leads' => CaseFile::query()->visibleTo($user)
                    ->whereNotNull('case_manager_id')
                    ->with('caseManager:id,name')
                    ->get()
                    ->pluck('caseManager')
                    ->filter()
                    ->unique('id')
                    ->values(),
                'jurisdictions' => CaseFile::query()->visibleTo($user)
                    ->pluck('description')
                    ->map(fn (?string $description) => $this->descriptionValue($description, 'Issuing judicial authority'))
                    ->filter()
                    ->unique()
                    ->sort()
                    ->values(),
            ],
            'statusCounts' => [
                'OPEN' => $statusCounts[CaseStatus::OPEN] ?? 0,
                'IN_PROGRESS' => $statusCounts[CaseStatus::IN_PROGRESS] ?? 0,
                'CLOSED' => $statusCounts[CaseStatus::CLOSED] ?? 0,
                'ARCHIVED' => $statusCounts[CaseStatus::ARCHIVED] ?? 0,
            ],
            'stats' => [
                'total_cases' => $visibleCaseIds->count(),
                'evidence_total' => Evidence::whereIn('case_id', $visibleCaseIds)->count(),
                'physical_source_total' => PhysicalSource::whereIn('case_id', $visibleCaseIds)->count(),
                'archived_total' => $statusCounts[CaseStatus::ARCHIVED] ?? 0,
            ],
            'canCreate' => Gate::allows('create', CaseFile::class),
        ]);
    }

    /**
     * Stream the filtered case register as CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        $this->authorize('viewAny', CaseFile::class);
        $records = $this->filteredCases($request)
            ->with('caseManager:id,name')
            ->withCount('evidence')
            ->latest('updated_at')
            ->cursor();

        return response()->streamDownload(function () use ($records): void {
            $output = fopen('php://output', 'wb');
            fputcsv($output, ['Case ID', 'Title', 'Status', 'Case Manager', 'Evidence Items', 'Opened At', 'Updated At']);

            foreach ($records as $case) {
                fputcsv($output, [
                    $case->case_number,
                    $this->csvValue($case->title),
                    $case->status,
                    $this->csvValue($case->caseManager?->name ?? ''),
                    $case->evidence_count,
                    $case->opened_at?->toIso8601String(),
                    $case->updated_at?->toIso8601String(),
                ]);
            }

            fclose($output);
        }, 'case-register-'.now()->format('Ymd-His').'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    /**
     * Show the new-case intake form.
     */
    public function create(): Response
    {
        $this->authorize('create', CaseFile::class);

        return Inertia::render('Cases/Create');
    }

    /**
     * Open a new case. The case number is generated here, at creation —
     * never shown to the user beforehand, since IdentifierService only
     * assigns it atomically on insert (see Phase 2). The creating user
     * becomes both the case's creator and its manager; there's no
     * user-picker yet to assign someone else.
     */
    public function store(CaseStoreRequest $request): RedirectResponse
    {
        $this->authorize('create', CaseFile::class);

        $case = CaseFile::create([
            'case_number' => IdentifierService::next(IdentifierScope::CASE_FILE()),
            'title' => $request->validated('title'),
            'description' => $request->validated('description'),
            'status' => CaseStatus::OPEN,
            'case_manager_id' => $request->user()->id,
            'created_by' => $request->user()->id,
            'opened_at' => now(),
        ]);

        return redirect()
            ->route('dashboard')
            ->with('success', "Case {$case->case_number} created.");
    }

    /**
     * Show a case's real state: its own record, its registered evidence
     * (with real hashes and integrity status), its team, and a timeline
     * built only from timestamps that actually exist. Custody remains
     * attached to individual evidence records rather than to the case.
     */
    public function show(Request $request, CaseFile $caseFile): Response
    {
        $this->authorize('view', $caseFile);

        $caseFile->load([
            'creator:id,name,role',
            'caseManager:id,name,role',
            'closer:id,name',
            'assignments.user:id,name,role',
            'assignments.assignedBy:id,name',
            'evidence' => fn ($query) => $query
                ->with(['registeredBy:id,name', 'currentCustodian:id,name'])
                ->latest('registered_at'),
            'physicalSources:id,case_id,label,source_type',
        ]);

        $integrityCounts = $caseFile->evidence->countBy('integrity_status');

        return Inertia::render('Cases/Show', [
            'case' => [
                'id' => $caseFile->id,
                'case_number' => $caseFile->case_number,
                'title' => $caseFile->title,
                'description' => $caseFile->description,
                'status' => $caseFile->status,
                'opened_at' => $caseFile->opened_at?->toIso8601String(),
                'closed_at' => $caseFile->closed_at?->toIso8601String(),
                'creator' => $caseFile->creator?->name,
                'case_manager' => $caseFile->caseManager?->name,
                'closer' => $caseFile->closer?->name,
            ],
            'personnel' => $this->personnel($caseFile),
            'evidence' => EvidenceResource::collection($caseFile->evidence),
            'physicalSources' => $caseFile->physicalSources->map(fn ($source) => [
                'id' => $source->id,
                'label' => $source->label,
                'source_type' => $source->source_type,
            ]),
            'integrity' => [
                'baseline_established' => $integrityCounts[IntegrityStatus::BASELINE_ESTABLISHED] ?? 0,
                'verified' => $integrityCounts[IntegrityStatus::VERIFIED] ?? 0,
                'verification_required' => $integrityCounts[IntegrityStatus::VERIFICATION_REQUIRED] ?? 0,
                'integrity_failure' => $integrityCounts[IntegrityStatus::INTEGRITY_FAILURE] ?? 0,
            ],
            'timeline' => $this->timeline($caseFile),
            'canArchive' => $caseFile->status !== CaseStatus::ARCHIVED && Gate::allows('close', $caseFile),
            'canRegisterEvidence' => Gate::allows('register', [Evidence::class, $caseFile]),
            'custody' => $this->custody($caseFile),
            'reports' => $this->reports($caseFile),
            'canCreateReport' => Gate::allows('create', [Report::class, $caseFile]),
            'initialTab' => in_array($request->string('tab')->toString(), ['overview', 'evidence', 'custody', 'reports'], true)
                ? $request->string('tab')->toString()
                : 'overview',
        ]);
    }

    /**
     * Every report generated from this case, newest first, for the case
     * record's own Reports tab.
     *
     * @return array<int, array<string, mixed>>
     */
    private function reports(CaseFile $caseFile): array
    {
        return Report::query()
            ->where('case_id', $caseFile->id)
            ->with(['generatedBy:id,name'])
            ->withCount('downloads')
            ->latest()
            ->get()
            ->map(fn (Report $report) => [
                'report_number' => $report->report_number,
                'title' => $report->title,
                'generated_by' => $report->generatedBy->name,
                'generated_at' => $report->generated_at?->toIso8601String() ?? $report->created_at->toIso8601String(),
                'status' => $report->status,
                'content_verified' => $report->status === ReportStatus::DRAFT ? null : $report->hasValidContentHash(),
                'downloads_count' => $report->downloads_count,
            ])
            ->all();
    }

    /**
     * Current holdings and the full recorded transfer history for every
     * evidence item in this case, for the case record's own custody tab.
     *
     * @return array{holdings: array<int, array<string, mixed>>, history: array<int, array<string, mixed>>}
     */
    private function custody(CaseFile $caseFile): array
    {
        $history = EvidenceCustodyEvent::query()
            ->whereIn('evidence_id', $caseFile->evidence->pluck('id'))
            ->with(['evidence:id,evidence_number,title', 'fromCustodian:id,name', 'toCustodian:id,name', 'transferredBy:id,name'])
            ->latest('occurred_at')
            ->get();

        return [
            'holdings' => $caseFile->evidence->map(fn (Evidence $evidence) => [
                'evidence_number' => $evidence->evidence_number,
                'title' => $evidence->title,
                'custodian' => $evidence->currentCustodian?->name,
                'location' => $evidence->current_custody_location,
                'chain_verified' => EvidenceCustodyService::verifyChain($evidence),
            ])->all(),
            'history' => $history->map(fn (EvidenceCustodyEvent $event) => [
                'id' => $event->id,
                'evidence_number' => $event->evidence->evidence_number,
                'evidence_title' => $event->evidence->title,
                'from_custodian' => $event->fromCustodian?->name,
                'to_custodian' => $event->toCustodian->name,
                'performed_by' => $event->transferredBy->name,
                'purpose' => $event->purpose,
                'from_location' => $event->from_location,
                'to_location' => $event->to_location,
                'method' => $event->transfer_method,
                'occurred_at' => $event->occurred_at->toIso8601String(),
            ])->all(),
        ];
    }

    /**
     * Archive a case. Reuses the "close" policy ability from Phase 2
     * (administrator or the case's own manager) rather than inventing a
     * separate one — archiving is this app's only lifecycle transition
     * today.
     */
    public function archive(CaseFile $caseFile): RedirectResponse
    {
        $this->authorize('close', $caseFile);

        $caseFile->update([
            'status' => CaseStatus::ARCHIVED,
            'closed_at' => now(),
            'closed_by' => request()->user()->id,
        ]);

        return redirect()
            ->route('cases.show', $caseFile)
            ->with('success', "Case {$caseFile->case_number} archived.");
    }

    /**
     * Real team roster: the case manager plus anyone in case_assignments,
     * deduplicated. No badge numbers or "key authenticated" claims — we
     * don't have hardware-token integration.
     *
     * @return array<int, array{id: int, name: string, system_role: string, case_role: string, assigned_at: ?string, assigned_by: ?string}>
     */
    private function personnel(CaseFile $caseFile): array
    {
        $people = collect();

        if ($caseFile->caseManager) {
            $people->push([
                'id' => $caseFile->caseManager->id,
                'name' => $caseFile->caseManager->name,
                'system_role' => ucwords(strtolower(str_replace('_', ' ', $caseFile->caseManager->role))),
                'case_role' => 'Case Manager',
                'assigned_at' => $caseFile->opened_at?->toIso8601String(),
                'assigned_by' => $caseFile->creator?->name,
            ]);
        }

        foreach ($caseFile->assignments as $assignment) {
            if (! $assignment->user) {
                continue;
            }

            $people->push([
                'id' => $assignment->user->id,
                'name' => $assignment->user->name,
                'system_role' => ucwords(strtolower(str_replace('_', ' ', $assignment->user->role))),
                'case_role' => ucwords(strtolower(str_replace('_', ' ', $assignment->role_on_case))),
                'assigned_at' => $assignment->assigned_at?->toIso8601String(),
                'assigned_by' => $assignment->assignedBy?->name,
            ]);
        }

        return $people->unique('id')->values()->all();
    }

    /**
     * Real timeline entries only: case opened, each evidence registration,
     * and case closed if applicable. No fabricated future milestones.
     *
     * @return array<int, array{label: string, at: string, detail: ?string}>
     */
    private function timeline(CaseFile $caseFile): array
    {
        $entries = collect();

        if ($caseFile->opened_at) {
            $entries->push([
                'label' => 'Case opened',
                'at' => $caseFile->opened_at->toIso8601String(),
                'detail' => $caseFile->caseManager ? "Lead: {$caseFile->caseManager->name}" : null,
            ]);
        }

        foreach ($caseFile->evidence as $item) {
            $entries->push([
                'label' => "Evidence registered — {$item->evidence_number}",
                'at' => $item->registered_at->toIso8601String(),
                'detail' => $item->registeredBy ? "{$item->title} · {$item->registeredBy->name}" : $item->title,
            ]);
        }

        if ($caseFile->closed_at) {
            $entries->push([
                'label' => $caseFile->status === CaseStatus::ARCHIVED ? 'Case archived' : 'Case closed',
                'at' => $caseFile->closed_at->toIso8601String(),
                'detail' => $caseFile->closer?->name,
            ]);
        }

        return $entries->sortBy('at')->values()->all();
    }

    /**
     * Build the authorized case query shared by the register and export.
     */
    private function filteredCases(Request $request): Builder
    {
        $status = $request->string('status')->toString();
        $search = trim($request->string('search')->toString());
        $priority = $request->string('priority')->toString();
        $category = $request->string('category')->toString();
        $jurisdiction = $request->string('jurisdiction')->toString();
        $lead = $request->integer('lead');
        $caseNumbers = array_values(array_filter(explode(',', $request->string('case_numbers')->toString())));

        return CaseFile::query()
            ->visibleTo($request->user())
            ->when(in_array($status, CaseStatus::getValues(), true), fn (Builder $query) => $query->where('status', $status))
            ->when($search !== '', fn (Builder $query) => $query->where(function (Builder $query) use ($search) {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhere('case_number', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            }))
            ->when($priority !== '', fn (Builder $query) => $query->where('description', 'like', "%Priority: {$priority}%"))
            ->when($category !== '', fn (Builder $query) => $query->where('description', 'like', "%Matter category: {$category}%"))
            ->when($jurisdiction !== '', fn (Builder $query) => $query->where('description', 'like', "%Issuing judicial authority: {$jurisdiction}%"))
            ->when($lead > 0, fn (Builder $query) => $query->where('case_manager_id', $lead))
            ->when($caseNumbers !== [], fn (Builder $query) => $query->whereIn('case_number', $caseNumbers));
    }

    /**
     * Prevent spreadsheet software from interpreting exported text as formulas.
     */
    private function csvValue(string $value): string
    {
        return preg_match('/^[=+\-@]/', $value) === 1 ? "'{$value}" : $value;
    }

    /**
     * Read one intake metadata line from a case description.
     */
    private function descriptionValue(?string $description, string $label): ?string
    {
        foreach (preg_split('/\R/', $description ?? '') ?: [] as $line) {
            if (str_starts_with($line, "{$label}: ")) {
                return trim(substr($line, strlen($label) + 2));
            }
        }

        return null;
    }
}
