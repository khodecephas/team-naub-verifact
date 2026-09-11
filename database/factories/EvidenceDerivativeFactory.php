<?php

namespace Database\Factories;

use App\Enums\EvidenceDerivativeStatus;
use App\Enums\EvidenceDerivativeType;
use App\Models\Evidence;
use App\Models\EvidenceDerivative;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EvidenceDerivative>
 */
class EvidenceDerivativeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'derivative_number' => 'DER-'.now()->year.'-'.fake()->unique()->numerify('######'),
            'evidence_id' => Evidence::factory(),
            'derivative_type' => EvidenceDerivativeType::WORKING_COPY,
            'storage_disk' => config('evidence.disk'),
            'storage_path' => 'evidence/fake/derivatives/'.fake()->uuid().'/working-copy.bin',
            'original_filename' => 'evidence.bin',
            'mime_type' => 'application/octet-stream',
            'file_size_bytes' => 16,
            'sha256' => hash('sha256', fake()->uuid()),
            'status' => EvidenceDerivativeStatus::AVAILABLE,
            'created_by' => User::factory(),
            'issued_to' => User::factory(),
            'purpose' => fake()->sentence(),
            'issued_at' => now(),
            'expires_at' => now()->addHour(),
        ];
    }
}
