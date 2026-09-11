<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

#[Fillable([
    'evidence_id',
    'custodial_subject_type',
    'custodial_subject_id',
    'sequence_number',
    'action',
    'transfer_method',
    'custody_request_id',
    'from_custodian_id',
    'to_custodian_id',
    'transferred_by',
    'purpose',
    'from_location',
    'to_location',
    'notes',
    'previous_event_hash',
    'event_hash',
    'hash_scheme_version',
    'occurred_at',
    'transferred_at',
])]
class EvidenceCustodyEvent extends Model
{
    use HasFactory;

    /** Prevent application code from rewriting or deleting custody history. */
    protected static function booted(): void
    {
        static::updating(fn () => throw new \LogicException('Custody events are append-only.'));
        static::deleting(fn () => throw new \LogicException('Custody events are append-only.'));
    }

    protected function casts(): array
    {
        return ['sequence_number' => 'integer', 'hash_scheme_version' => 'integer', 'occurred_at' => 'datetime', 'transferred_at' => 'datetime'];
    }

    /** The evidence or physical source whose custody changed. */
    public function custodialSubject(): MorphTo
    {
        return $this->morphTo();
    }

    public function evidence(): BelongsTo
    {
        return $this->belongsTo(Evidence::class);
    }

    public function fromCustodian(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_custodian_id');
    }

    public function toCustodian(): BelongsTo
    {
        return $this->belongsTo(User::class, 'to_custodian_id');
    }

    public function transferredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'transferred_by');
    }

    public function custodyRequest(): BelongsTo
    {
        return $this->belongsTo(CustodyRequest::class);
    }
}
