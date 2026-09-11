<?php

namespace App\Services;

use App\Enums\IntegrityStatus;
use App\Models\Evidence;
use App\Models\EvidenceVerification;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class EvidenceVerificationService
{
    public static function verify(Evidence $evidence, User $verifiedBy): EvidenceVerification
    {
        $observedHash = EvidenceHashService::sha256($evidence->storage_disk, $evidence->storage_path);
        $matchesBaseline = hash_equals($evidence->sha256_baseline, $observedHash);

        return DB::transaction(function () use ($evidence, $verifiedBy, $observedHash, $matchesBaseline) {
            $verification = $evidence->verifications()->create([
                'baseline_sha256' => $evidence->sha256_baseline,
                'observed_sha256' => $observedHash,
                'matches_baseline' => $matchesBaseline,
                'verification_method' => 'MASTER_REHASH',
                'verified_by' => $verifiedBy->id,
                'verified_at' => now(),
            ]);

            $evidence->update([
                'integrity_status' => $matchesBaseline
                    ? IntegrityStatus::VERIFIED
                    : IntegrityStatus::INTEGRITY_FAILURE,
            ]);

            return $verification;
        });
    }
}
