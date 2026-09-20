<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\Models\Role;

class UpdateUserRequest extends FormRequest
{
    /** Authorization is enforced in the controller via the `users.manage` Spatie permission. */
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class)->ignore($this->route('user'))],
            'role' => ['required', 'string', Rule::in(Role::query()->pluck('name'))],
            'password' => ['nullable', 'confirmed', Password::defaults()],
        ];
    }
}
