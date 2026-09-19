<?php

namespace App\Http\Requests;

use App\Enums\EvidenceType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOfflineEvidenceRequest extends FormRequest
{
    /** Authorization is enforced in the controller via EvidencePolicy::register. */
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'offline_collection_id' => ['required', 'uuid'],
            'physical_source_id' => [
                'nullable',
                'integer',
                Rule::exists('physical_sources', 'id')->where('case_id', $this->route('caseFile')->id),
            ],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'evidence_type' => ['required', 'string', Rule::in(EvidenceType::getValues())],
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
