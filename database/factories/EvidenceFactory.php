<?php

namespace Database\Factories;

use App\Enums\EvidenceType;
use App\Enums\IdentifierScope;
use App\Enums\IntegrityStatus;
use App\Models\CaseFile;
use App\Models\Evidence;
use App\Models\User;
use App\Services\IdentifierService;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Evidence>
 */
class EvidenceFactory extends Factory
{
    protected $model = Evidence::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'evidence_number' => IdentifierService::next(IdentifierScope::EVIDENCE()),
            'case_id' => CaseFile::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'evidence_type' => fake()->randomElement(EvidenceType::getValues()),
            'storage_disk' => config('evidence.disk'),
            'storage_path' => 'evidence/fake/'.fake()->uuid().'/master/master.bin',
            'original_filename' => fake()->word().'.bin',
            'mime_type' => 'application/octet-stream',
            'file_extension' => 'bin',
            'file_size_bytes' => fake()->numberBetween(1024, 10_000_000),
            'sha256_baseline' => hash('sha256', fake()->uuid()),
            'integrity_status' => IntegrityStatus::BASELINE_ESTABLISHED,
            'registered_by' => User::factory(),
            'registered_at' => now(),
        ];
    }
}
