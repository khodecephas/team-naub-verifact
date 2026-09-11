<?php

namespace Database\Factories;

use App\Models\EvidenceActivityEvent;
use App\Models\EvidenceDerivative;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EvidenceActivityEvent>
 */
class EvidenceActivityEventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'subject_type' => 'evidence_derivative',
            'subject_id' => EvidenceDerivative::factory(),
            'event_type' => 'WORKING_COPY_CREATED',
            'actor_id' => User::factory(),
            'payload' => [],
            'hash_scheme_version' => 1,
            'previous_event_hash' => null,
            'event_hash' => hash('sha256', fake()->uuid()),
            'occurred_at' => now(),
        ];
    }
}
