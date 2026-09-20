<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOfflineEvidenceRequest extends FormRequest
{
    /** Authorization is enforced in the controller via EvidencePolicy::create. */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * No case, physical source, title, or evidence type here — this
     * mirrors Quick Ingest: secure the file now, complete the rest later
     * from the evidence record's own page.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'offline_collection_id' => ['required', 'uuid'],
            'description' => ['nullable', 'string', 'max:5000'],
            'client_sha256' => ['required', 'string', 'regex:/^[a-f0-9]{64}$/i'],
            'collected_at' => ['required', 'date'],
            'collected_timezone' => ['nullable', 'string', 'max:64'],
            'file' => [
                'required',
                'file',
                'max:'.config('evidence.max_upload_size_kb'),
            ],
        ];
    }
}
