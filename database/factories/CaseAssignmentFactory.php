<?php

namespace Database\Factories;

use App\Enums\CaseAssignmentRole;
use App\Models\CaseAssignment;
use App\Models\CaseFile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CaseAssignment>
 */
class CaseAssignmentFactory extends Factory
{
    protected $model = CaseAssignment::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'case_id' => CaseFile::factory(),
            'user_id' => User::factory(),
            'role_on_case' => fake()->randomElement(CaseAssignmentRole::getValues()),
            'assigned_by' => User::factory(),
            'assigned_at' => now(),
        ];
    }
}
