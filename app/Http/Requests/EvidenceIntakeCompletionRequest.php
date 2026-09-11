<?php

namespace App\Http\Requests;

use App\Enums\EvidenceType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EvidenceIntakeCompletionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'case_id' => ['required', 'integer', Rule::exists('cases', 'id')],
            'physical_source_id' => [
                'nullable',
                'integer',
                Rule::exists('physical_sources', 'id')->where('case_id', $this->integer('case_id')),
            ],
            'evidence_type' => ['required', 'string', Rule::in(EvidenceType::getValues())],
            'description' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
