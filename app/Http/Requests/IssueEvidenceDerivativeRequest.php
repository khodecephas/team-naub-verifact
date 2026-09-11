<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IssueEvidenceDerivativeRequest extends FormRequest
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
            'issued_to' => ['required', 'integer', Rule::exists('users', 'id')],
            'purpose' => ['required', 'string', 'max:1000'],
            'retention_minutes' => [
                'required',
                'integer',
                Rule::in(config('evidence.working_copy_retention_options')),
            ],
        ];
    }
}
