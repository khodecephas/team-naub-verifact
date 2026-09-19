<?php

namespace App\Http\Requests;

use App\Support\UploadLimit;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFindingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'narrative' => ['required', 'string', 'max:8000'],
            'evidence_id' => ['nullable', 'integer', Rule::exists('evidence', 'id')],
            'attachment' => [
                'nullable', 'file', 'max:'.UploadLimit::findingAttachmentKilobytes(),
                'mimes:pdf,doc,docx,txt,csv,png,jpg,jpeg',
            ],
        ];
    }
}
