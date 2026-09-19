<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'case_id' => ['required', 'integer', Rule::exists('cases', 'id')],
            'evidence_ids' => ['required', 'array', 'min:1'],
            'evidence_ids.*' => ['integer', 'distinct', Rule::exists('evidence', 'id')],
            'finding_ids' => ['nullable', 'array'],
            'finding_ids.*' => ['integer', 'distinct', Rule::exists('findings', 'id')],
            'title' => ['required', 'string', 'max:255'],
            'introduction' => ['nullable', 'string', 'max:3000'],
            'supersedes_report_id' => ['nullable', 'integer', Rule::exists('reports', 'id')],
        ];
    }
}
