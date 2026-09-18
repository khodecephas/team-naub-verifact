<?php

namespace App\Http\Controllers;

use App\Models\CaseFile;
use App\Models\Evidence;
use App\Models\Report;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SearchController extends Controller
{
    /**
     * Search every register while preserving the current user's visibility.
     */
    public function index(Request $request): Response
    {
        $query = trim($request->string('q')->toString());
        $term = "%{$query}%";

        $cases = CaseFile::query()
            ->visibleTo($request->user())
            ->when($query !== '', fn (Builder $builder) => $builder
                ->where(fn (Builder $builder) => $builder
                    ->where('case_number', 'like', $term)
                    ->orWhere('title', 'like', $term)))
            ->latest('updated_at')
            ->limit(10)
            ->get(['case_number', 'title', 'status', 'updated_at']);

        $evidence = Evidence::query()
            ->visibleTo($request->user())
            ->when($query !== '', fn (Builder $builder) => $builder
                ->where(fn (Builder $builder) => $builder
                    ->where('evidence_number', 'like', $term)
                    ->orWhere('title', 'like', $term)
                    ->orWhere('original_filename', 'like', $term)
                    ->orWhere('sha256_baseline', 'like', $term)))
            ->latest('registered_at')
            ->limit(10)
            ->get(['evidence_number', 'title', 'original_filename', 'integrity_status', 'registered_at']);

        $reports = Report::query()
            ->whereHas('case', fn (Builder $builder) => $builder->visibleTo($request->user()))
            ->when($query !== '', fn (Builder $builder) => $builder
                ->where(fn (Builder $builder) => $builder
                    ->where('report_number', 'like', $term)
                    ->orWhere('title', 'like', $term)))
            ->latest()
            ->limit(10)
            ->get(['report_number', 'title', 'status', 'created_at']);

        return Inertia::render('Search/Index', [
            'query' => $query,
            'cases' => $cases,
            'evidence' => $evidence,
            'reports' => $reports,
        ]);
    }
}
