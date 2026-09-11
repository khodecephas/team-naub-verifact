<?php

namespace App\Models;

use Database\Factories\EvidenceActivityEventFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

#[Fillable([
    'subject_type',
    'subject_id',
    'event_type',
    'actor_id',
    'payload',
    'hash_scheme_version',
    'previous_event_hash',
    'event_hash',
    'occurred_at',
])]
class EvidenceActivityEvent extends Model
{
    /** @use HasFactory<EvidenceActivityEventFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'hash_scheme_version' => 'integer',
            'occurred_at' => 'datetime',
        ];
    }

    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
