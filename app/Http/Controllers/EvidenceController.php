<?php

namespace App\Http\Controllers;

use App\Enums\CustodyRequestStatus;
use App\Enums\EvidenceDerivativeStatus;
use App\Enums\EvidenceType;
use App\Enums\IntegrityStatus;
use App\Http\Requests\EvidenceCustodyTransferRequest;
use App\Http\Requests\EvidenceIntakeCompletionRequest;
use App\Http\Requests\EvidenceStoreRequest;
use App\Http\Requests\IssueEvidenceDerivativeRequest;
use App\Http\Requests\QuickEvidenceIngestRequest;
use App\Http\Requests\RevokeEvidenceDerivativeRequest;
use App\Http\Resources\EvidenceResource;
use App\Models\CaseFile;
use App\Models\Evidence;
use App\Models\EvidenceActivityEvent;
use App\Models\EvidenceDerivative;
use App\Models\User;
use App\Services\EvidenceCustodyService;
use App\Services\EvidenceDerivativeService;
use App\Services\EvidenceRegistrationService;
use App\Services\EvidenceVerificationService;
use App\Support\UploadLimit;
use DomainException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class EvidenceController extends Controller
{
    /**
     * List evidence the current user is authorized to see, newest first.
     * Optionally filtered by a search term against title, evidence number,
     * or the parent case's number.
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Evidence::class);

        $evidence = $this->filteredEvidence($request)
            ->with([
                'case:id,case_number,title',
                'physicalSource:id,label',
                'registeredBy:id,name',
                'currentCustodian:id,name',
            ])
            ->latest('registered_at')
            ->paginate(20)
            ->withQueryString();

        $visibleEvidence = Evidence::query()->visibleTo($request->user());
        $caseOptions = CaseFile::query()
            ->visibleTo($request->user())
            ->orderBy('case_number')
            ->get(['id', 'case_number', 'title']);
        $custodianOptions = User::query()
            ->whereIn('id', (clone $visibleEvidence)->whereNotNull('current_custodian_id')->pluck('current_custodian_id'))
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Evidence/Index', [
            'evidence' => EvidenceResource::collection($evidence),
            'filters' => $request->only(['search', 'integrity', 'type', 'case', 'custodian', 'registered']),
            'filterOptions' => [
                'integrity' => IntegrityStatus::getValues(),
                'types' => EvidenceType::getValues(),
                'cases' => $caseOptions,
                'custodians' => $custodianOptions,
            ],
            'canQuickIngest' => Gate::allows('create', Evidence::class),
        ]);
    }

    /**
     * Stream the currently filtered evidence register as CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        $this->authorize('viewAny', Evidence::class);

        $records = $this->filteredEvidence($request)
            ->with(['case:id,case_number,title', 'currentCustodian:id,name', 'registeredBy:id,name'])
            ->latest('registered_at')
            ->cursor();

        return response()->streamDownload(function () use ($records): void {
            $output = fopen('php://output', 'wb');
            fputcsv($output, [
                'Evidence ID', 'Title', 'Filename', 'Classification', 'Case',
                'Custodian', 'Integrity Status', 'SHA-256 Baseline', 'Registered At',
            ]);

            foreach ($records as $evidence) {
                fputcsv($output, [
                    $evidence->evidence_number,
                    $this->csvValue($evidence->title),
                    $this->csvValue($evidence->original_filename),
                    $evidence->evidence_type,
                    $evidence->case?->case_number,
                    $this->csvValue($evidence->currentCustodian?->name ?? $evidence->registeredBy?->name ?? ''),
                    $evidence->integrity_status,
                    $evidence->sha256_baseline,
                    $evidence->registered_at?->toIso8601String(),
                ]);
            }

            fclose($output);
        }, 'evidence-register-'.now()->format('Ymd-His').'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    /**
     * Re-hash selected protected masters and persist every result.
     */
    public function verifyBatch(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'evidence_numbers' => ['required', 'array', 'min:1', 'max:50'],
            'evidence_numbers.*' => ['required', 'string', 'distinct'],
        ]);
        $records = Evidence::query()
            ->visibleTo($request->user())
            ->whereIn('evidence_number', $validated['evidence_numbers'])
            ->get();

        abort_unless($records->count() === count($validated['evidence_numbers']), 404);

        $matches = 0;
        $failures = 0;

        foreach ($records as $evidence) {
            $this->authorize('verify', $evidence);

            try {
                $verification = EvidenceVerificationService::verify($evidence, $request->user());
                $verification->matches_baseline ? $matches++ : $failures++;
            } catch (Throwable $exception) {
                report($exception);
                $evidence->update(['integrity_status' => IntegrityStatus::VERIFICATION_REQUIRED]);
                $failures++;
            }
        }

        return back()->with(
            $failures > 0 ? 'error' : 'success',
            "Batch verification completed: {$matches} matched, {$failures} require review.",
        );
    }

    public function quickCreate(): Response
    {
        $this->authorize('create', Evidence::class);

        return Inertia::render('Evidence/QuickIngest', [
            'maxUploadSizeKb' => UploadLimit::evidenceKilobytes(),
        ]);
    }

    public function quickStore(QuickEvidenceIngestRequest $request): RedirectResponse
    {
        $this->authorize('create', Evidence::class);

        $evidence = EvidenceRegistrationService::registerUnassigned(
            $request->user(),
            $request->file('file'),
        );

        return redirect()
            ->route('evidence.show', $evidence)
            ->with('success', 'Evidence secured and verified. Complete its case assignment and details.');
    }

    /**
     * Show the evidence registration form for a specific case.
     */
    public function create(CaseFile $caseFile): Response
    {
        // Passing [Evidence::class, $caseFile] (rather than just $caseFile)
        // is required so Laravel resolves EvidencePolicy — passing the bare
        // CaseFile instance would resolve CaseFilePolicy instead, which has
        // no "register" ability.
        $this->authorize('register', [Evidence::class, $caseFile]);

        return Inertia::render('Evidence/Create', [
            'case' => $caseFile->only(['id', 'case_number', 'title']),
            'physicalSources' => $caseFile->physicalSources()->get(['id', 'label']),
            'evidenceTypes' => EvidenceType::getValues(),
            'maxUploadSizeKb' => UploadLimit::evidenceKilobytes(),
        ]);
    }

    /**
     * Register a new master evidence record for a case. All storage,
     * hashing, and identifier logic lives in EvidenceRegistrationService —
     * this method only validates, authorizes, and orchestrates.
     */
    public function store(EvidenceStoreRequest $request, CaseFile $caseFile): RedirectResponse
    {
        $this->authorize('register', [Evidence::class, $caseFile]);

        $evidence = EvidenceRegistrationService::register(
            case: $caseFile,
            registeredBy: $request->user(),
            data: $request->safe()->only(['physical_source_id', 'title', 'description', 'evidence_type']),
            file: $request->file('file'),
        );

        return redirect()
            ->route('evidence.show', $evidence)
            ->with('success', 'Evidence registered successfully.');
    }

    /**
     * Show a single evidence record's registration and baseline details.
     */
    public function show(Evidence $evidence): Response
    {
        $this->authorize('view', $evidence);

        $evidence->load([
            'case.creator:id,name,role',
            'case.caseManager:id,name,role',
            'case.assignments.user:id,name,role',
            'physicalSource:id,label',
            'registeredBy:id,name',
            'currentCustodian:id,name',
            'verifications' => fn ($query) => $query->with('verifiedBy:id,name')->latest('verified_at'),
            'custodyEvents' => fn ($query) => $query
                ->with(['fromCustodian:id,name', 'toCustodian:id,name', 'transferredBy:id,name'])
                ->latest('occurred_at'),
            'custodyRequests' => fn ($query) => $query
                ->with(['requester:id,name', 'currentCustodian:id,name', 'reviewer:id,name'])
                ->latest(),
            'derivatives' => fn ($query) => $query
                ->with([
                    'createdBy:id,name',
                    'issuedTo:id,name',
                    'events' => fn ($eventQuery) => $eventQuery->with('actor:id,name')->oldest('id'),
                ])
                ->latest('issued_at'),
        ]);

        $activityEvents = EvidenceActivityEvent::query()
            ->whereMorphedTo('subject', $evidence)
            ->with('actor:id,name')
            ->oldest('occurred_at')
            ->get();

        $fileAvailable = $this->masterFileAvailable($evidence);
        $canCompleteIntake = Gate::allows('completeIntake', $evidence);
        $intakeCases = $canCompleteIntake
            ? CaseFile::query()
                ->visibleTo(request()->user())
                ->with('physicalSources:id,case_id,label')
                ->orderByDesc('opened_at')
                ->get(['id', 'case_number', 'title'])
            : collect();

        return Inertia::render('Evidence/Show', [
            'evidence' => new EvidenceResource($evidence),
            'verifications' => $evidence->verifications->map(fn ($verification) => [
                'id' => $verification->id,
                'baseline_sha256' => $verification->baseline_sha256,
                'observed_sha256' => $verification->observed_sha256,
                'matches_baseline' => $verification->matches_baseline,
                'verified_at' => $verification->verified_at->toIso8601String(),
                'verified_by' => $verification->verifiedBy->name,
            ]),
            'custodyEvents' => $evidence->custodyEvents->map(fn ($event) => [
                'id' => $event->id,
                'from_custodian' => $event->fromCustodian?->name,
                'to_custodian' => $event->toCustodian->name,
                'transferred_by' => $event->transferredBy->name,
                'purpose' => $event->purpose,
                'from_location' => $event->from_location,
                'to_location' => $event->to_location,
                'notes' => $event->notes,
                'action' => $event->action,
                'transfer_method' => $event->transfer_method,
                'sequence_number' => $event->sequence_number,
                'occurred_at' => ($event->occurred_at ?? $event->transferred_at)->toIso8601String(),
            ]),
            'custodyRequests' => $evidence->custodyRequests->map(fn ($item) => [
                'id' => $item->id,
                'requester' => $item->requester->name,
                'current_custodian' => $item->currentCustodian->name,
                'requested_location' => $item->requested_location,
                'purpose' => $item->purpose,
                'status' => $item->status,
                'reviewer' => $item->reviewer?->name,
                'review_notes' => $item->review_notes,
                'created_at' => $item->created_at->toIso8601String(),
                'can_review' => $item->status === CustodyRequestStatus::PENDING
                    && Gate::allows('reviewCustodyRequests', $evidence),
                'can_cancel' => $item->status === CustodyRequestStatus::PENDING
                    && $item->requested_by === request()->user()->id,
            ]),
            'custodyChainVerified' => EvidenceCustodyService::verifyChain($evidence),
            'activityEvents' => $activityEvents->map(fn (EvidenceActivityEvent $event) => [
                'id' => $event->id,
                'event_type' => $event->event_type,
                'actor' => $event->actor?->name ?? 'System',
                'payload' => $event->payload,
                'occurred_at' => $event->occurred_at->toIso8601String(),
            ]),
            'derivatives' => $evidence->derivatives->map(fn ($derivative) => [
                'derivative_number' => $derivative->derivative_number,
                'derivative_type' => $derivative->derivative_type->value,
                'original_filename' => $derivative->original_filename,
                'mime_type' => $derivative->mime_type,
                'file_size_bytes' => $derivative->file_size_bytes,
                'sha256' => $derivative->sha256,
                'status' => $derivative->status->value,
                'created_by' => $derivative->createdBy->name,
                'issued_to' => $derivative->issuedTo?->name,
                'purpose' => $derivative->purpose,
                'created_at' => $derivative->created_at->toIso8601String(),
                'issued_at' => $derivative->issued_at?->toIso8601String(),
                'downloaded_at' => $derivative->downloaded_at?->toIso8601String(),
                'expires_at' => $derivative->expires_at?->toIso8601String(),
                'revoked_at' => $derivative->revoked_at?->toIso8601String(),
                'can_download' => Gate::allows('download', $derivative),
                'can_revoke' => Gate::allows('revoke', $derivative),
                'events' => $derivative->events->map(fn ($event) => [
                    'event_type' => $event->event_type,
                    'actor' => $event->actor?->name ?? 'System',
                    'occurred_at' => $event->occurred_at->toIso8601String(),
                    'event_hash' => $event->event_hash,
                    'previous_event_hash' => $event->previous_event_hash,
                ]),
            ]),
            'eligibleCustodians' => $this->eligibleCustodians($evidence),
            'eligibleDerivativeRecipients' => $this->eligibleDerivativeRecipients($evidence),
            'workingCopyRetention' => [
                'default' => (int) config('evidence.working_copy_retention_minutes'),
                'options' => config('evidence.working_copy_retention_options'),
            ],
            'fileAvailable' => $fileAvailable,
            'intakeOptions' => [
                'cases' => $intakeCases->map(fn ($case) => [
                    'id' => $case->id,
                    'case_number' => $case->case_number,
                    'title' => $case->title,
                    'physical_sources' => $case->physicalSources->map(fn ($source) => [
                        'id' => $source->id,
                        'label' => $source->label,
                    ]),
                ]),
                'evidenceTypes' => EvidenceType::getValues(),
            ],
            'permissions' => [
                'viewFile' => $fileAvailable && Gate::allows('viewMaster', $evidence),
                'verify' => $fileAvailable && Gate::allows('verify', $evidence),
                'issueWorkingCopy' => $fileAvailable && Gate::allows('issueWorkingCopy', $evidence),
                'requestCustody' => Gate::allows('requestCustody', $evidence),
                'reviewCustodyRequests' => Gate::allows('reviewCustodyRequests', $evidence),
                'directTransferCustody' => Gate::allows('directTransferCustody', $evidence),
                'isCurrentCustodian' => $evidence->current_custodian_id === request()->user()->id,
                'completeIntake' => $canCompleteIntake,
            ],
        ]);
    }

    public function completeIntake(
        EvidenceIntakeCompletionRequest $request,
        Evidence $evidence,
    ): RedirectResponse {
        $this->authorize('completeIntake', $evidence);

        if ($evidence->case_id !== null) {
            throw ValidationException::withMessages([
                'case_id' => 'This evidence is already assigned to a case.',
            ]);
        }

        $case = CaseFile::findOrFail($request->integer('case_id'));
        $this->authorize('register', [Evidence::class, $case]);

        $evidence->update([
            'case_id' => $case->id,
            ...$request->safe()->only(['physical_source_id', 'evidence_type', 'description']),
        ]);

        return back()->with('success', 'Evidence details completed and attached to the case.');
    }

    public function viewFile(Evidence $evidence): StreamedResponse|RedirectResponse
    {
        $this->authorize('viewMaster', $evidence);

        if (! $this->masterFileAvailable($evidence)) {
            return back()->with('error', 'The master evidence file is unavailable in controlled storage.');
        }

        return Storage::disk($evidence->storage_disk)->response(
            $evidence->storage_path,
            $evidence->original_filename,
            ['Cache-Control' => 'private, no-store'],
        );
    }

    public function verify(Request $request, Evidence $evidence): RedirectResponse
    {
        $this->authorize('verify', $evidence);

        try {
            $verification = EvidenceVerificationService::verify($evidence, $request->user());
        } catch (Throwable $exception) {
            report($exception);
            $evidence->update(['integrity_status' => IntegrityStatus::VERIFICATION_REQUIRED]);

            return back()->with(
                'error',
                'Integrity verification could not run because the master evidence file is unavailable.',
            );
        }

        return back()->with(
            'success',
            $verification->matches_baseline
                ? 'Integrity verified. The stored file matches its registration baseline.'
                : 'Integrity failure detected. The stored file does not match its registration baseline.',
        );
    }

    public function issueWorkingCopy(
        IssueEvidenceDerivativeRequest $request,
        Evidence $evidence,
    ): RedirectResponse {
        $this->authorize('issueWorkingCopy', $evidence);

        $eligibleRecipientIds = $this->eligibleDerivativeRecipients($evidence)->pluck('id');

        if (! $eligibleRecipientIds->contains($request->integer('issued_to'))) {
            throw ValidationException::withMessages([
                'issued_to' => 'The selected recipient is not assigned to this evidence case.',
            ]);
        }

        $issuedTo = User::findOrFail($request->integer('issued_to'));

        try {
            EvidenceDerivativeService::issueWorkingCopy(
                $evidence,
                $request->user(),
                $issuedTo,
                $request->string('purpose')->toString(),
                $request->integer('retention_minutes'),
            );
        } catch (Throwable $exception) {
            report($exception);

            return back()->with(
                'error',
                $exception instanceof DomainException
                    ? $exception->getMessage()
                    : 'A working copy could not be issued because the protected master is unavailable.',
            );
        }

        return back()->with('success', 'A verified, temporary working copy was issued successfully.');
    }

    public function downloadDerivative(
        Evidence $evidence,
        EvidenceDerivative $derivative,
    ): StreamedResponse|RedirectResponse {
        $this->authorize('view', $derivative);
        abort_unless($derivative->evidence_id === $evidence->id, 404);

        if ($derivative->status === EvidenceDerivativeStatus::AVAILABLE
            && $derivative->expires_at?->isPast()) {
            EvidenceDerivativeService::expire($derivative);

            return back()->with('error', 'This working copy has expired and is no longer available.');
        }

        if ($derivative->status !== EvidenceDerivativeStatus::AVAILABLE) {
            return back()->with('error', 'This working copy is no longer available for download.');
        }

        $this->authorize('download', $derivative);
        try {
            $stream = Storage::disk($derivative->storage_disk)->readStream($derivative->storage_path);
        } catch (Throwable $exception) {
            report($exception);
            $stream = null;
        }

        if (! is_resource($stream)) {
            EvidenceDerivativeService::expire($derivative);

            return back()->with('error', 'The temporary working-copy file is no longer available.');
        }

        $filename = "{$derivative->derivative_number}-{$derivative->original_filename}";
        $downloadingUser = request()->user();

        return response()->streamDownload(function () use ($stream, $derivative, $downloadingUser) {
            try {
                while (! feof($stream)) {
                    $chunk = fread($stream, 1024 * 1024);

                    if ($chunk === false) {
                        throw new \RuntimeException('Failed while streaming the working copy.');
                    }

                    echo $chunk;
                }
            } finally {
                fclose($stream);
            }

            EvidenceDerivativeService::markDownloaded($derivative, $downloadingUser);
        }, $filename, ['Cache-Control' => 'private, no-store']);
    }

    public function revokeDerivative(
        RevokeEvidenceDerivativeRequest $request,
        Evidence $evidence,
        EvidenceDerivative $derivative,
    ): RedirectResponse {
        abort_unless($derivative->evidence_id === $evidence->id, 404);
        $this->authorize('revoke', $derivative);

        EvidenceDerivativeService::revoke($derivative, $request->user());

        return back()->with('success', 'Working-copy access was revoked and its temporary server file removed.');
    }

    public function transferCustody(
        EvidenceCustodyTransferRequest $request,
        Evidence $evidence,
    ): RedirectResponse {
        $this->authorize('directTransferCustody', $evidence);

        $eligibleCustodianIds = $this->eligibleCustodians($evidence)->pluck('id');

        if (! $eligibleCustodianIds->contains($request->integer('to_custodian_id'))) {
            throw ValidationException::withMessages([
                'to_custodian_id' => 'The selected custodian is not assigned to this case.',
            ]);
        }

        $custodian = User::findOrFail($request->integer('to_custodian_id'));

        try {
            EvidenceCustodyService::transfer(
                $evidence,
                $custodian,
                $request->user(),
                $request->safe()->only(['purpose', 'to_location', 'notes']),
            );
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Evidence custody transferred successfully.');
    }

    /**
     * @return Collection<int, User>
     */
    private function eligibleCustodians(Evidence $evidence): Collection
    {
        if ($evidence->case === null) {
            return collect();
        }

        $evidence->loadMissing([
            'case.creator:id,name,role',
            'case.caseManager:id,name,role',
            'case.assignments.user:id,name,role',
        ]);

        return collect([$evidence->case->creator, $evidence->case->caseManager])
            ->merge($evidence->case->assignments->pluck('user'))
            ->filter()
            ->unique('id')
            ->reject(fn (User $user) => $user->id === $evidence->current_custodian_id)
            ->values();
    }

    /** @return Collection<int, User> */
    private function eligibleDerivativeRecipients(Evidence $evidence): Collection
    {
        if ($evidence->case === null) {
            return collect([$evidence->registeredBy])->filter()->values();
        }

        $evidence->loadMissing([
            'case.creator:id,name,role',
            'case.caseManager:id,name,role',
            'case.assignments.user:id,name,role',
        ]);

        return collect([$evidence->case->creator, $evidence->case->caseManager])
            ->merge($evidence->case->assignments->pluck('user'))
            ->filter()
            ->unique('id')
            ->values();
    }

    /**
     * Build the authorized evidence query shared by the register and export.
     */
    private function filteredEvidence(Request $request): Builder
    {
        $search = trim($request->string('search')->toString());
        $integrity = $request->string('integrity')->toString();
        $type = $request->string('type')->toString();
        $case = $request->string('case')->toString();
        $custodian = $request->integer('custodian');
        $registered = $request->string('registered')->toString();
        $evidenceNumbers = array_values(array_filter(explode(',', $request->string('evidence_numbers')->toString())));

        return Evidence::query()
            ->visibleTo($request->user())
            ->when($search !== '', fn (Builder $query) => $query->where(function (Builder $query) use ($search) {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhere('original_filename', 'like', "%{$search}%")
                    ->orWhere('evidence_number', 'like', "%{$search}%")
                    ->orWhereHas('case', fn (Builder $caseQuery) => $caseQuery->where('case_number', 'like', "%{$search}%"));
            }))
            ->when(in_array($integrity, IntegrityStatus::getValues(), true), fn (Builder $query) => $query->where('integrity_status', $integrity))
            ->when(in_array($type, EvidenceType::getValues(), true), fn (Builder $query) => $query->where('evidence_type', $type))
            ->when($case === 'unassigned', fn (Builder $query) => $query->whereNull('case_id'))
            ->when($case !== '' && $case !== 'unassigned', fn (Builder $query) => $query->whereHas('case', fn (Builder $caseQuery) => $caseQuery->where('case_number', $case)))
            ->when($custodian > 0, fn (Builder $query) => $query->where('current_custodian_id', $custodian))
            ->when($registered === 'today', fn (Builder $query) => $query->whereDate('registered_at', today()))
            ->when($registered === 'week', fn (Builder $query) => $query->where('registered_at', '>=', now()->subDays(7)))
            ->when($registered === 'month', fn (Builder $query) => $query->where('registered_at', '>=', now()->subDays(30)))
            ->when($evidenceNumbers !== [], fn (Builder $query) => $query->whereIn('evidence_number', $evidenceNumbers));
    }

    /**
     * Prevent spreadsheet software from interpreting exported text as formulas.
     */
    private function csvValue(string $value): string
    {
        return preg_match('/^[=+\-@]/', $value) === 1 ? "'{$value}" : $value;
    }

    private function masterFileAvailable(Evidence $evidence): bool
    {
        try {
            return Storage::disk($evidence->storage_disk)->exists($evidence->storage_path);
        } catch (Throwable $exception) {
            report($exception);

            return false;
        }
    }
}
