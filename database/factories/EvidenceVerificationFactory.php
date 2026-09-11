<?php

namespace Database\Factories;

use App\Models\Evidence;
use App\Models\EvidenceVerification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EvidenceVerification>
 */
class EvidenceVerificationFactory extends Factory
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
            'baseline_sha256' => fn (array $attributes) => Evidence::find($attributes['evidence_id'])->sha256_baseline,
            'observed_sha256' => fn (array $attributes) => Evidence::find($attributes['evidence_id'])->sha256_baseline,
            'matches_baseline' => true,
            'verified_by' => User::factory(),
            'verified_at' => now(),
        ];
    }
}
