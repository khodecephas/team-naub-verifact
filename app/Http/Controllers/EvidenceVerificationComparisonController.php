<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\CompareEvidenceFileRequest;
use App\Models\Evidence;
use App\Models\EvidenceVerification;
use App\Services\EvidenceHashService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
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
            ->with(['case:id,case_number,title,case_manager_id,created_by', 'registeredBy:id,name'])
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
                'registered_by' => $item->registeredBy?->only(['id', 'name']),
                'case' => $item->case?->only(['id', 'case_number', 'title']),
            ]),
            'selectedEvidenceNumber' => $selectedEvidenceNumber,
            'verificationResult' => fn () => $request->session()->get('verification_result'),
            'maxUploadSizeKb' => (int) config('evidence.max_upload_size_kb'),
        ]);
    }

    /**
     * Store one private part of a comparison file.
     */
    public function uploadChunk(Request $request, Evidence $evidence): JsonResponse
    {
        $this->authorize('verify', $evidence);

        $chunkSizeKb = (int) config('evidence.comparison_chunk_size_kb');
        $maxUploadSizeKb = (int) config('evidence.max_upload_size_kb');
        $maximumChunks = (int) ceil($maxUploadSizeKb / $chunkSizeKb);
        $validated = $request->validate([
            'upload_id' => ['required', 'uuid'],
            'chunk' => ['required', 'file', "max:{$chunkSizeKb}"],
            'chunk_index' => ['required', 'integer', 'min:0'],
            'total_chunks' => ['required', 'integer', 'min:1', "max:{$maximumChunks}"],
            'total_size' => ['required', 'integer', 'min:1', 'max:'.($maxUploadSizeKb * 1024)],
            'filename' => ['required', 'string', 'max:255'],
        ]);

        if ($validated['chunk_index'] >= $validated['total_chunks']) {
            throw ValidationException::withMessages([
                'chunk' => 'The uploaded file part is outside the expected sequence.',
            ]);
        }

        $directory = $this->comparisonDirectory($request, $validated['upload_id']);
        $disk = Storage::disk(config('evidence.comparison_disk'));
        $metadataPath = "{$directory}/metadata.json";
        $metadata = [
            'evidence_id' => $evidence->id,
            'user_id' => $request->user()->id,
            'filename' => $this->sanitizeFilename($validated['filename']),
            'total_size' => $validated['total_size'],
            'total_chunks' => $validated['total_chunks'],
        ];

        if ($disk->exists($metadataPath)) {
            $storedMetadata = json_decode((string) $disk->get($metadataPath), true);

            if ($storedMetadata !== $metadata) {
                throw ValidationException::withMessages([
                    'file' => 'The comparison upload details changed. Select the file and try again.',
                ]);
            }
        } elseif (! $disk->put($metadataPath, json_encode($metadata, JSON_THROW_ON_ERROR))) {
            abort(503, 'The comparison file could not be staged for verification.');
        }

        $stored = $disk->putFileAs(
            $directory,
            $validated['chunk'],
            sprintf('%06d.part', $validated['chunk_index']),
        );

        abort_if($stored === false, 503, 'The comparison file part could not be stored.');

        return response()->json([
            'received' => $validated['chunk_index'] + 1,
            'total' => $validated['total_chunks'],
        ]);
    }

    /**
     * Hash all uploaded parts in order, record the result, and discard them.
     */
    public function completeChunkUpload(Request $request, Evidence $evidence): JsonResponse
    {
        $this->authorize('verify', $evidence);

        $validated = $request->validate([
            'upload_id' => ['required', 'uuid'],
        ]);
        $directory = $this->comparisonDirectory($request, $validated['upload_id']);

        return Cache::lock("evidence-comparison:{$request->user()->id}:{$validated['upload_id']}", 30)
            ->block(5, function () use ($directory, $evidence, $request): JsonResponse {
                $disk = Storage::disk(config('evidence.comparison_disk'));
                $metadataPath = "{$directory}/metadata.json";

                if (! $disk->exists($metadataPath)) {
                    throw ValidationException::withMessages([
                        'file' => 'The comparison upload is incomplete or has expired.',
                    ]);
                }

                $metadata = json_decode((string) $disk->get($metadataPath), true);
                $expectedMetadata = [
                    'evidence_id' => $evidence->id,
                    'user_id' => $request->user()->id,
                ];

                foreach ($expectedMetadata as $key => $value) {
                    if (($metadata[$key] ?? null) !== $value) {
                        throw ValidationException::withMessages([
                            'file' => 'The comparison upload does not belong to this evidence item.',
                        ]);
                    }
                }

                $hash = hash_init('sha256');
                $actualSize = 0;

                try {
                    for ($index = 0; $index < $metadata['total_chunks']; $index++) {
                        $chunkPath = sprintf('%s/%06d.part', $directory, $index);

                        if (! $disk->exists($chunkPath)) {
                            throw ValidationException::withMessages([
                                'file' => 'The comparison upload is incomplete. Select the file and try again.',
                            ]);
                        }

                        $stream = $disk->readStream($chunkPath);
                        abort_if($stream === false, 503, 'A comparison file part could not be read.');

                        try {
                            while (! feof($stream)) {
                                $buffer = fread($stream, 1024 * 1024);
                                abort_if($buffer === false, 503, 'A comparison file part could not be read.');
                                $actualSize += strlen($buffer);
                                hash_update($hash, $buffer);
                            }
                        } finally {
                            fclose($stream);
                        }
                    }

                    if ($actualSize !== $metadata['total_size']) {
                        throw ValidationException::withMessages([
                            'file' => 'The comparison file size changed during upload. Select the file and try again.',
                        ]);
                    }

                    $observedHash = hash_final($hash);
                    $matchesBaseline = hash_equals($evidence->sha256_baseline, $observedHash);
                    $verification = $evidence->verifications()->create([
                        'baseline_sha256' => $evidence->sha256_baseline,
                        'observed_sha256' => $observedHash,
                        'matches_baseline' => $matchesBaseline,
                        'verification_method' => 'UPLOADED_COMPARISON',
                        'comparison_filename' => $metadata['filename'],
                        'comparison_file_size_bytes' => $actualSize,
                        'verified_by' => $request->user()->id,
                        'verified_at' => now(),
                    ]);

                    return response()->json([
                        'result' => $this->verificationResult($verification, $evidence),
                    ]);
                } finally {
                    $disk->deleteDirectory($directory);
                }
            });
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
        $comparisonFilename = $this->sanitizeFilename($file->getClientOriginalName());

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

    /**
     * Build the private storage location for a user's temporary upload.
     */
    private function comparisonDirectory(Request $request, string $uploadId): string
    {
        return "comparison-uploads/{$request->user()->id}/{$uploadId}";
    }

    /**
     * Remove control characters from an uploaded display filename.
     */
    private function sanitizeFilename(string $filename): string
    {
        return mb_substr(trim(str_replace(["\0", "\r", "\n"], '', $filename)), 0, 255);
    }

    /**
     * Shape a completed verification for the comparison workspace.
     *
     * @return array<string, bool|int|string>
     */
    private function verificationResult(EvidenceVerification $verification, Evidence $evidence): array
    {
        return [
            'verification_id' => $verification->id,
            'matches' => $verification->matches_baseline,
            'evidence_number' => $evidence->evidence_number,
            'evidence_title' => $evidence->title,
            'baseline_sha256' => $verification->baseline_sha256,
            'observed_sha256' => $verification->observed_sha256,
            'comparison_filename' => $verification->comparison_filename,
            'comparison_file_size_bytes' => $verification->comparison_file_size_bytes,
            'verified_at' => $verification->verified_at->toIso8601String(),
        ];
    }
}
