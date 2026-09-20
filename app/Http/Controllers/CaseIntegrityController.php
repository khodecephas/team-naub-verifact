<?php

namespace App\Http\Controllers;

use App\Models\CaseFile;
use App\Services\CaseIntegrityCheckService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The "open a case" integrity sweep, triggered automatically by the case
 * page. Plain JSON, not an Inertia response — it's fired from a
 * useEffect, not a navigation, and the result is shown in a dialog rather
 * than replacing the page.
 */
class CaseIntegrityController extends Controller
{
    public function verify(Request $request, CaseFile $caseFile): JsonResponse
    {
        $this->authorize('view', $caseFile);

        return response()->json(CaseIntegrityCheckService::run($caseFile, $request->user()));
    }
}
