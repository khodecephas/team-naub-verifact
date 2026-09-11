<?php

namespace App\Http\Controllers;

use App\Enums\CaseStatus;
use App\Enums\IdentifierScope;
use App\Enums\IntegrityStatus;
use App\Http\Requests\CaseStoreRequest;
use App\Http\Resources\CaseSummaryResource;
use App\Http\Resources\EvidenceResource;
use App\Models\CaseFile;
use App\Models\Evidence;
use App\Models\PhysicalSource;
use App\Services\IdentifierService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

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
        $search = $request->string('search')->toString() ?: null;

        $visibleCaseIds = CaseFile::query()->visibleTo($user)->pluck('id');

        $cases = CaseFile::query()
            ->visibleTo($user)
            ->withCount('evidence')
            ->with('caseManager:id,name')
            ->when($status, fn ($query) => $query->where('status', $status))
            ->when($search, fn ($query) => $query->where(function ($query) use ($search) {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhere('case_number', 'like', "%{$search}%");
            }))
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
            'filters' => ['status' => $status, 'search' => $search],
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
    public function show(CaseFile $caseFile): Response
    {
        $this->authorize('view', $caseFile);

        $caseFile->load([
            'creator:id,name,role',
            'caseManager:id,name,role',
            'closer:id,name',
            'assignments.user:id,name,role',
            'assignments.assignedBy:id,name',
            'evidence' => fn ($query) => $query->with('registeredBy:id,name')->latest('registered_at'),
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
        ]);
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
}
