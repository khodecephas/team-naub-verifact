<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Append-only audit trail of offline-sync attempts — including the ones
 * that did not produce evidence, such as a hash mismatch or a case
 * authorization that changed while the collecting user was offline.
 */
#[Fillable([
    'offline_collection_id',
    'subject_type',
    'case_id',
    'attempted_by',
    'outcome',
    'client_sha256',
    'server_sha256',
    'evidence_id',
    'physical_source_id',
    'error_message',
    'attempted_at',
])]
class OfflineSyncAttempt extends Model
{
    protected function casts(): array
    {
        return ['attempted_at' => 'datetime'];
    }

    public function case(): BelongsTo
    {
        return $this->belongsTo(CaseFile::class, 'case_id');
    }

    public function attemptedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'attempted_by');
    }

    public function evidence(): BelongsTo
    {
        return $this->belongsTo(Evidence::class);
    }

    public function physicalSource(): BelongsTo
    {
        return $this->belongsTo(PhysicalSource::class);
    }
}
