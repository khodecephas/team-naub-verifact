<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'finding_number',
    'case_id',
    'evidence_id',
    'authored_by',
    'sequence_number',
    'title',
    'narrative',
    'attachment_disk',
    'attachment_path',
    'attachment_original_filename',
    'attachment_mime_type',
    'attachment_size_bytes',
    'attachment_sha256',
    'previous_finding_hash',
    'finding_hash',
    'hash_scheme_version',
    'occurred_at',
])]
class Finding extends Model
{
    use HasFactory;

    /** Prevent application code from rewriting or deleting recorded findings. */
    protected static function booted(): void
    {
        static::updating(fn () => throw new \LogicException('Findings are append-only.'));
        static::deleting(fn () => throw new \LogicException('Findings are append-only.'));
    }

    protected function casts(): array
    {
        return [
            'sequence_number' => 'integer',
            'attachment_size_bytes' => 'integer',
            'hash_scheme_version' => 'integer',
            'occurred_at' => 'datetime',
        ];
    }

    /**
     * Route model binding resolves on `finding_number` (e.g.
     * FINDING-2026-000001), not the internal numeric id.
     */
    public function getRouteKeyName(): string
    {
        return 'finding_number';
    }

    public function case(): BelongsTo
    {
        return $this->belongsTo(CaseFile::class, 'case_id');
    }

    /** The specific evidence item this finding is about, if any. */
    public function evidence(): BelongsTo
    {
        return $this->belongsTo(Evidence::class);
    }

    public function authoredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'authored_by');
    }
}
