<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReviewCustodyRequest extends FormRequest
{
    /** Authorization is enforced against the bound custody request in the controller. */
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return ['review_notes' => ['nullable', 'string', 'max:2000']];
    }
}
