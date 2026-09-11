<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'evidence_id',
    'baseline_sha256',
    'observed_sha256',
    'matches_baseline',
    'verification_method',
    'comparison_filename',
    'comparison_file_size_bytes',
    'verified_by',
    'verified_at',
])]
class EvidenceVerification extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'matches_baseline' => 'boolean',
            'comparison_file_size_bytes' => 'integer',
            'verified_at' => 'datetime',
        ];
    }

    public function evidence(): BelongsTo
    {
        return $this->belongsTo(Evidence::class);
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
