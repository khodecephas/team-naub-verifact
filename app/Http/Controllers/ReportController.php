<?php

namespace App\Http\Controllers;

use App\Enums\ReportStatus;
use App\Http\Requests\StoreReportRequest;
use App\Models\CaseFile;
use App\Models\Report;
use App\Models\ReportDownload;
use App\Services\ReportGenerationService;
use DomainException;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /** List reports from cases visible to the current user. */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Report::class);
        $status = $request->string('status')->toString();
        $downloaded = $request->string('downloaded')->toString();
        $reports = Report::query()
            ->whereHas('case', fn (Builder $query) => $query->visibleTo($request->user()))
            ->when($request->filled('search'), function (Builder $query) use ($request) {
                $search = '%'.$request->string('search')->toString().'%';
                $query->where(function (Builder $query) use ($search) {
                    $query->where('report_number', 'like', $search)
                        ->orWhere('title', 'like', $search)
                        ->orWhereHas('case', fn (Builder $case) => $case
                            ->where('case_number', 'like', $search)
                            ->orWhere('title', 'like', $search))
                        ->orWhereHas('generatedBy', fn (Builder $user) => $user->where('name', 'like', $search));
                });
            })
            ->when(in_array($status, ReportStatus::getValues(), true), fn (Builder $query) => $query->where('status', $status))
            ->when($request->filled('case'), fn (Builder $query) => $query->whereHas('case', fn (Builder $case) => $case->where('case_number', $request->string('case')->toString())))
            ->when($downloaded === 'yes', fn (Builder $query) => $query->whereHas('downloads'))
            ->when($downloaded === 'no', fn (Builder $query) => $query->whereDoesntHave('downloads'))
            ->with([
                'case:id,case_number,title',
                'generatedBy:id,name',
                'downloads' => fn ($query) => $query->with('downloadedBy:id,name')->latest('downloaded_at')->limit(1),
            ])
            ->withCount('downloads')
            ->latest()->paginate(20)->withQueryString();

        $visibleCases = CaseFile::query()->visibleTo($request->user())
            ->orderBy('case_number')->get(['id', 'case_number', 'title']);

        return Inertia::render('Reports/Index', [
            'reports' => $reports->through(fn (Report $report) => [
                'report_number' => $report->report_number,
                'title' => $report->title,
                'case_number' => $report->case->case_number,
                'case_title' => $report->case->title,
                'generated_by' => $report->generatedBy->name,
                'generated_at' => $report->generated_at?->toIso8601String() ?? $report->created_at->toIso8601String(),
                'status' => $report->status,
                'content_verified' => $report->status === ReportStatus::DRAFT ? null : $report->hasValidContentHash(),
                'downloads_count' => $report->downloads_count,
                'last_download' => $report->downloads->first() ? [
                    'downloaded_at' => $report->downloads->first()->downloaded_at->toIso8601String(),
                    'downloaded_by' => $report->downloads->first()->downloadedBy->name,
                    'delivery_type' => $report->downloads->first()->delivery_type,
                ] : null,
            ]),
            'filters' => $request->only(['search', 'status', 'case', 'downloaded']),
            'caseOptions' => $visibleCases,
            'canCreate' => CaseFile::query()->visibleTo($request->user())->get()
                ->contains(fn (CaseFile $case) => Gate::allows('create', [Report::class, $case])),
        ]);
    }

    /** Show the case and evidence selection workflow. */
    public function create(Request $request): Response
    {
        $cases = CaseFile::query()->visibleTo($request->user())
            ->with(['evidence' => fn ($query) => $query->orderBy('evidence_number')])
            ->latest('opened_at')->get();
        $cases = $cases->filter(fn (CaseFile $case) => Gate::allows('create', [Report::class, $case]));

        return Inertia::render('Reports/Create', [
            'cases' => $cases->map(fn (CaseFile $case) => [
                'id' => $case->id,
                'case_number' => $case->case_number,
                'title' => $case->title,
                'description' => $case->description,
                'evidence' => $case->evidence->map(fn ($item) => [
                    'id' => $item->id,
                    'evidence_number' => $item->evidence_number,
                    'title' => $item->title,
                    'type' => $item->evidence_type,
                    'integrity_status' => $item->integrity_status,
                    'registered_at' => $item->registered_at->toIso8601String(),
                ]),
            ])->values(),
            'finalReports' => Report::query()->whereIn('case_id', $cases->pluck('id'))
                ->where('status', ReportStatus::FINAL)->get(['id', 'report_number', 'case_id', 'title']),
            'selectedCaseNumber' => $request->string('case')->toString() ?: null,
        ]);
    }

    /** Generate a report draft from validated selections. */
    public function store(StoreReportRequest $request): RedirectResponse
    {
        $case = CaseFile::findOrFail($request->integer('case_id'));
        $this->authorize('create', [Report::class, $case]);
        $supersedes = $request->integer('supersedes_report_id')
            ? Report::findOrFail($request->integer('supersedes_report_id'))
            : null;
        $report = ReportGenerationService::createDraft(
            $case, $request->user(), $request->string('title')->toString(),
            $request->string('introduction')->toString() ?: null,
            $request->input('evidence_ids', []), [], $supersedes,
        );

        return redirect()->route('reports.show', $report)->with('success', 'Report draft generated.');
    }

    /** Preview the frozen or draft document; technical details are opt-in. */
    public function show(Request $request, Report $report): Response
    {
        $this->authorize('view', $report);

        return Inertia::render('Reports/Show', [
            'report' => [
                'report_number' => $report->report_number,
                'title' => $report->title,
                'status' => $report->status,
                'snapshot' => $report->snapshot,
                'technical_details' => $request->boolean('appendix') ? $report->technical_details : null,
                'report_sha256' => $report->report_sha256,
                'content_verified' => $report->status === ReportStatus::DRAFT ? null : $report->hasValidContentHash(),
                'finalized_at' => $report->finalized_at?->toIso8601String(),
                'downloads_count' => $report->downloads()->count(),
                'last_downloaded_at' => $report->downloads()->latest('downloaded_at')->value('downloaded_at'),
            ],
            'showAppendix' => $request->boolean('appendix'),
            'canFinalize' => Gate::allows('finalize', $report),
        ]);
    }

    /** Download the finalized report snapshot as a PDF document. */
    public function download(Request $request, Report $report): StreamedResponse|RedirectResponse
    {
        $this->authorize('download', $report);

        if (! $report->hasValidContentHash()) {
            return redirect()->route('reports.show', $report)->with(
                'error',
                'Download blocked: this finalized report no longer matches the fingerprint recorded when it was finalized.',
            );
        }

        $options = new Options;
        $options->set('isRemoteEnabled', false);
        $options->set('isHtml5ParserEnabled', true);

        $pdf = new Dompdf($options);
        $deliveryType = $request->string('mode')->toString() === 'print' ? 'PRINT' : 'DOWNLOAD';
        $downloadedAt = now();
        $includeAppendix = $request->boolean('appendix');
        $pdf->loadHtml(view('reports.pdf', [
            'report' => $report,
            'snapshot' => $report->snapshot,
            'technicalDetails' => $includeAppendix ? $report->technical_details : null,
            'deliveredBy' => $request->user()->name,
            'deliveredAt' => $downloadedAt,
            'deliveryType' => $deliveryType,
        ])->render());
        $pdf->setPaper('a4', 'portrait');
        $pdf->render();

        ReportDownload::create([
            'report_id' => $report->id,
            'downloaded_by' => $request->user()->id,
            'delivery_type' => $deliveryType,
            'included_technical_appendix' => $includeAppendix,
            'downloaded_at' => $downloadedAt,
        ]);

        $contents = $pdf->output();

        if ($deliveryType === 'PRINT') {
            return response()->stream(static function () use ($contents): void {
                echo $contents;
            }, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => sprintf('inline; filename="%s-print.pdf"', $report->report_number),
                'Cache-Control' => 'private, no-store, max-age=0',
            ]);
        }

        return response()->streamDownload(static function () use ($contents): void {
            echo $contents;
        }, $report->report_number.'.pdf', [
            'Content-Type' => 'application/pdf',
            'Cache-Control' => 'private, no-store, max-age=0',
        ]);
    }

    /** Finalize and freeze the report snapshot. */
    public function finalize(Report $report): RedirectResponse
    {
        $this->authorize('finalize', $report);
        try {
            ReportGenerationService::finalize($report, request()->user());
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Report finalized and its contents sealed.');
    }
}
