<?php

namespace App\Http\Requests;

use App\Enums\EvidenceType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EvidenceStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * Authorization is enforced by EvidencePolicy in the controller, not
     * here — this mirrors how the rest of the app's Form Requests defer to
     * Gate/Policy checks rather than duplicating the rule.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * The uploaded file is intentionally not restricted by MIME type or
     * extension — forensic evidence can legitimately be an unusual file
     * type, and an overly narrow whitelist would block real evidence. Size
     * is still bounded, via config so the limit lives in one place.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'physical_source_id' => [
                'nullable',
                'integer',
                Rule::exists('physical_sources', 'id')->where('case_id', $this->route('caseFile')->id),
            ],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'evidence_type' => ['required', 'string', Rule::in(EvidenceType::getValues())],
            'file' => [
                'required',
                'file',
                'max:'.config('evidence.max_upload_size_kb'),
            ],
        ];
    }
}
