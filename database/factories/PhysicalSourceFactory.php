<?php

namespace Database\Factories;

use App\Enums\PhysicalSourceType;
use App\Models\CaseFile;
use App\Models\PhysicalSource;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PhysicalSource>
 */
class PhysicalSourceFactory extends Factory
{
    protected $model = PhysicalSource::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'case_id' => CaseFile::factory(),
            'label' => strtoupper(fake()->bothify('??-###')),
            'source_type' => fake()->randomElement(PhysicalSourceType::getValues()),
            'description' => fake()->sentence(),
            'collected_by' => User::factory(),
            'collected_at' => now(),
        ];
    }
}
