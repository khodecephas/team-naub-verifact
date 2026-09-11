<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * The authoritative master digital evidence record. `sha256_baseline` is set
 * once at registration and never overwritten. Every later verification
 * compares against it and creates a separate history record.
 */
#[Fillable([
    'evidence_number',
    'case_id',
    'physical_source_id',
    'title',
    'description',
    'evidence_type',
    'storage_disk',
    'storage_path',
    'original_filename',
    'mime_type',
    'file_extension',
    'file_size_bytes',
    'sha256_baseline',
    'integrity_status',
    'registered_by',
    'current_custodian_id',
    'current_custody_location',
    'registered_at',
])]
class Evidence extends Model
{
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'file_size_bytes' => 'integer',
            'registered_at' => 'datetime',
        ];
    }

    /**
     * Route model binding resolves on `evidence_number` (e.g.
     * EV-2026-000001), not the internal numeric id — keeps that id out of
     * URLs entirely rather than adding a redundant third identifier.
     */
    public function getRouteKeyName(): string
    {
        return 'evidence_number';
    }

    /**
     * The case this evidence was registered under.
     */
    public function case(): BelongsTo
    {
        return $this->belongsTo(CaseFile::class, 'case_id');
    }

    /**
     * The optional physical exhibit this digital evidence was captured from.
     */
    public function physicalSource(): BelongsTo
    {
        return $this->belongsTo(PhysicalSource::class, 'physical_source_id');
    }

    /**
     * The user who registered this evidence into the system.
     */
    public function registeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by');
    }

    public function currentCustodian(): BelongsTo
    {
        return $this->belongsTo(User::class, 'current_custodian_id');
    }

    public function verifications(): HasMany
    {
        return $this->hasMany(EvidenceVerification::class);
    }

    public function custodyEvents(): HasMany
    {
        return $this->hasMany(EvidenceCustodyEvent::class);
    }

    /** Custody requests made for this evidence item. */
    public function custodyRequests(): HasMany
    {
        return $this->hasMany(CustodyRequest::class);
    }

    public function workingCopies(): HasMany
    {
        return $this->hasMany(EvidenceWorkingCopy::class);
    }

    public function derivatives(): HasMany
    {
        return $this->hasMany(EvidenceDerivative::class);
    }
}
