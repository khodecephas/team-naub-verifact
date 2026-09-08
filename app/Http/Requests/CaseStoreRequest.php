<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CaseStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * Authorization is enforced by CaseFilePolicy in the controller, not
     * here — matches the rest of the app's Form Requests.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * `description` is generous in length — the frontend folds several
     * metadata fields with no dedicated column yet (priority, matter
     * category, docket ref, ...) into this single field.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:8000'],
        ];
    }
}
