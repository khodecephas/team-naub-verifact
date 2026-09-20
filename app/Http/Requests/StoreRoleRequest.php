<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class StoreRoleRequest extends FormRequest
{
    /** Authorization is enforced in the controller via the `roles.manage` Spatie permission. */
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'regex:/^[A-Z0-9_]+$/', Rule::unique(Role::class, 'name')],
            'permissions' => ['array'],
            'permissions.*' => [Rule::exists(Permission::class, 'name')],
        ];
    }

    public function messages(): array
    {
        return [
            'name.regex' => 'Use uppercase letters, numbers, and underscores only — e.g. FIELD_AGENT.',
        ];
    }
}
