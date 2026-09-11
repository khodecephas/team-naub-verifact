<?php

namespace Database\Factories;

use App\Models\Evidence;
use App\Models\EvidenceWorkingCopy;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EvidenceWorkingCopy>
 */
class EvidenceWorkingCopyFactory extends Factory
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
            'copy_reference' => fake()->uuid(),
            'storage_disk' => config('evidence.disk'),
            'storage_path' => 'evidence/fake/'.fake()->uuid().'/working/copy.bin',
            'sha256' => hash('sha256', fake()->uuid()),
            'issued_to' => User::factory(),
            'issued_by' => User::factory(),
            'issued_at' => now(),
            'downloaded_at' => null,
        ];
    }
}
