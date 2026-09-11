<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustodyRequest extends FormRequest
{
    /** Authorization is enforced against the bound evidence in the controller. */
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'purpose' => ['required', 'string', 'max:255'],
            'requested_location' => ['nullable', 'string', 'max:255'],
        ];
    }
}
