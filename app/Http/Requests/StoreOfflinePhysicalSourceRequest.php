<?php

namespace App\Http\Requests;

use App\Enums\PhysicalSourceType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOfflinePhysicalSourceRequest extends FormRequest
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
            'label' => ['required', 'string', 'max:255'],
            'source_type' => ['required', 'string', Rule::in(PhysicalSourceType::getValues())],
            'description' => ['nullable', 'string', 'max:5000'],
            'collection_location' => ['nullable', 'string', 'max:255'],
        ];
    }
}
