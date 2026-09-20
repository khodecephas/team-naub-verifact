<?php

namespace App\Http\Requests;

use App\Enums\CaseAssignmentRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCaseMemberRequest extends FormRequest
{
    /** Authorization is enforced in the controller via CaseFilePolicy::assignUsers. */
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', Rule::exists('users', 'id')],
            'role_on_case' => ['required', 'string', Rule::in(CaseAssignmentRole::getValues())],
        ];
    }
}
