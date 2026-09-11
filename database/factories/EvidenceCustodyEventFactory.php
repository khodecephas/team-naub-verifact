<?php

namespace Database\Factories;

use App\Models\Evidence;
use App\Models\EvidenceCustodyEvent;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EvidenceCustodyEvent>
 */
class EvidenceCustodyEventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'evidence_id' => Evidence::factory(),
            'from_custodian_id' => User::factory(),
            'to_custodian_id' => User::factory(),
            'transferred_by' => User::factory(),
            'purpose' => fake()->sentence(4),
            'from_location' => fake()->word(),
            'to_location' => fake()->word(),
            'notes' => fake()->optional()->sentence(),
            'transferred_at' => now(),
        ];
    }
}
