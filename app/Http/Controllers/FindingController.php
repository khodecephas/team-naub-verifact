<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreFindingRequest;
use App\Models\CaseFile;
use App\Models\Evidence;
use App\Models\Finding;
use App\Services\FindingService;
use App\Support\UploadLimit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FindingController extends Controller
{
    /** Show the standalone form for recording a finding against this case. */
    public function create(CaseFile $caseFile): Response
    {
        $this->authorize('record', [Finding::class, $caseFile]);

        return Inertia::render('Findings/Create', [
            'case' => $caseFile->only(['id', 'case_number', 'title']),
            'evidence' => $caseFile->evidence()->orderBy('evidence_number')->get(['id', 'evidence_number', 'title']),
            'maxUploadSizeKb' => UploadLimit::findingAttachmentKilobytes(),
        ]);
    }

    /** Append a finding to the case's hash-chained findings ledger. */
    public function store(StoreFindingRequest $request, CaseFile $caseFile): RedirectResponse
    {
        $this->authorize('record', [Finding::class, $caseFile]);

        $evidence = null;
        if ($request->filled('evidence_id')) {
            $evidence = Evidence::query()->where('case_id', $caseFile->id)->find($request->integer('evidence_id'));
            if ($evidence === null) {
                throw ValidationException::withMessages(['evidence_id' => 'The selected evidence item does not belong to this case.']);
            }
        }

        FindingService::record(
            $caseFile,
            $request->user(),
            $request->string('title')->toString(),
            $request->string('narrative')->toString(),
            $evidence,
            $request->file('attachment'),
        );

        return redirect()
            ->route('cases.show', ['caseFile' => $caseFile, 'tab' => 'findings'])
            ->with('success', 'Finding recorded.');
    }

    /** Stream a finding's attached document to an authorised viewer. */
    public function downloadAttachment(Finding $finding): StreamedResponse|RedirectResponse
    {
        $this->authorize('view', $finding);

        if ($finding->attachment_path === null) {
            return back()->with('error', 'This finding has no attached document.');
        }

        return Storage::disk($finding->attachment_disk)->response(
            $finding->attachment_path,
            $finding->attachment_original_filename ?? 'attachment',
            ['Cache-Control' => 'private, no-store'],
        );
    }
}
