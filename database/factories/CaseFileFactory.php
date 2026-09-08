<?php

namespace Database\Factories;

use App\Enums\CaseStatus;
use App\Enums\IdentifierScope;
use App\Models\CaseFile;
use App\Models\User;
use App\Services\IdentifierService;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CaseFile>
 */
class CaseFileFactory extends Factory
{
    protected $model = CaseFile::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'case_number' => IdentifierService::next(IdentifierScope::CASE_FILE()),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'status' => CaseStatus::OPEN,
            'case_manager_id' => User::factory(),
            'created_by' => User::factory(),
            'opened_at' => now(),
        ];
    }

    public function closed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => CaseStatus::CLOSED,
            'closed_at' => now(),
            'closed_by' => User::factory(),
            'closure_notes' => fake()->sentence(),
        ]);
    }
}
