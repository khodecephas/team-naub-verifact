<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Permission;

class UpdateRolePermissionsRequest extends FormRequest
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
            'permissions' => ['array'],
            'permissions.*' => [Rule::exists(Permission::class, 'name')],
        ];
    }
}
