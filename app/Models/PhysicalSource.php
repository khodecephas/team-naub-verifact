<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'case_id',
    'offline_collection_id',
    'label',
    'source_type',
    'description',
    'manufacturer',
    'model',
    'serial_number',
    'capacity',
    'condition_notes',
    'collected_by',
    'collected_at',
    'collection_location',
    'current_location',
    'seal_number',
    'notes',
])]
class PhysicalSource extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'collected_at' => 'datetime',
        ];
    }

    /**
     * The case this physical exhibit was logged against.
     */
    public function case(): BelongsTo
    {
        return $this->belongsTo(CaseFile::class, 'case_id');
    }

    /**
     * The user who took custody of this exhibit at collection time.
     */
    public function collectedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'collected_by');
    }

    /**
     * Digital evidence captured from this physical exhibit.
     */
    public function evidence(): HasMany
    {
        return $this->hasMany(Evidence::class, 'physical_source_id');
    }
}
