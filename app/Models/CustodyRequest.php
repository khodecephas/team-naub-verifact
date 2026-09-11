<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'evidence_id', 'requested_by', 'current_custodian_id', 'requested_location', 'purpose',
    'status', 'reviewed_by', 'reviewed_at', 'review_notes',
])]
class CustodyRequest extends Model
{
    use HasFactory;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['reviewed_at' => 'datetime'];
    }

    public function evidence(): BelongsTo
    {
        return $this->belongsTo(Evidence::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function currentCustodian(): BelongsTo
    {
        return $this->belongsTo(User::class, 'current_custodian_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
