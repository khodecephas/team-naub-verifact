<?php

namespace App\Http\Controllers;

use App\Enums\EvidenceType;
use App\Http\Requests\EvidenceStoreRequest;
use App\Http\Resources\EvidenceResource;
use App\Models\CaseFile;
use App\Models\Evidence;
use App\Services\EvidenceRegistrationService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class EvidenceController extends Controller
{
    /**
     * List evidence the current user is authorized to see, newest first.
     */
    public function index(): Response
    {
        $this->authorize('viewAny', Evidence::class);

        $evidence = Evidence::query()
            ->with(['case:id,case_number,title', 'physicalSource:id,label', 'registeredBy:id,name'])
            ->latest('registered_at')
            ->paginate(20);

        return Inertia::render('Evidence/Index', [
            'evidence' => EvidenceResource::collection($evidence),
        ]);
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
            'maxUploadSizeKb' => (int) config('evidence.max_upload_size_kb'),
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

        $evidence->load(['case:id,case_number,title', 'physicalSource:id,label', 'registeredBy:id,name']);

        return Inertia::render('Evidence/Show', [
            'evidence' => new EvidenceResource($evidence),
        ]);
    }
}
