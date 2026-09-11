<?php

namespace App\Models;

use App\Enums\EvidenceDerivativeStatus;
use App\Enums\EvidenceDerivativeType;
use Database\Factories\EvidenceDerivativeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

#[Fillable([
    'derivative_number',
    'evidence_id',
    'derivative_type',
    'storage_disk',
    'storage_path',
    'original_filename',
    'mime_type',
    'file_size_bytes',
    'sha256',
    'status',
    'created_by',
    'issued_to',
    'purpose',
    'issued_at',
    'downloaded_at',
    'expires_at',
    'revoked_at',
])]
class EvidenceDerivative extends Model
{
    /** @use HasFactory<EvidenceDerivativeFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'derivative_type' => EvidenceDerivativeType::class,
            'status' => EvidenceDerivativeStatus::class,
            'file_size_bytes' => 'integer',
            'issued_at' => 'datetime',
            'downloaded_at' => 'datetime',
            'expires_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'derivative_number';
    }

    public function evidence(): BelongsTo
    {
        return $this->belongsTo(Evidence::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function issuedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_to');
    }

    public function events(): MorphMany
    {
        return $this->morphMany(EvidenceActivityEvent::class, 'subject');
    }
}
