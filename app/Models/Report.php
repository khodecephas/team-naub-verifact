<?php

namespace App\Models;

use App\Enums\ReportStatus;
use App\Services\ReportGenerationService;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use LogicException;

#[Fillable([
    'report_number', 'case_id', 'title', 'introduction', 'status', 'evidence_ids',
    'finding_ids', 'snapshot', 'technical_details', 'report_sha256', 'generated_by',
    'generated_at', 'finalized_at', 'supersedes_report_id', 'superseded_by',
])]
class Report extends Model
{
    use HasFactory;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'evidence_ids' => 'array',
            'finding_ids' => 'array',
            'snapshot' => 'array',
            'technical_details' => 'array',
            'generated_at' => 'datetime',
            'finalized_at' => 'datetime',
        ];
    }

    /** Prevent changes to finalized report content. */
    protected static function booted(): void
    {
        static::updating(function (Report $report) {
            if ($report->getOriginal('status') === ReportStatus::FINAL
                && $report->isDirty(['title', 'introduction', 'snapshot', 'technical_details', 'report_sha256'])) {
                throw new LogicException('Finalized report contents cannot be edited.');
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'report_number';
    }

    public function case(): BelongsTo
    {
        return $this->belongsTo(CaseFile::class, 'case_id');
    }

    public function generatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    public function supersedes(): BelongsTo
    {
        return $this->belongsTo(self::class, 'supersedes_report_id');
    }

    public function supersededBy(): BelongsTo
    {
        return $this->belongsTo(self::class, 'superseded_by');
    }

    public function revisions(): HasMany
    {
        return $this->hasMany(self::class, 'supersedes_report_id');
    }

    /** Get the immutable delivery history for this report. */
    public function downloads(): HasMany
    {
        return $this->hasMany(ReportDownload::class);
    }

    /** Confirm the stored final hash still matches the immutable snapshot. */
    public function hasValidContentHash(): bool
    {
        return $this->report_sha256 !== null
            && hash_equals($this->report_sha256, ReportGenerationService::hashSnapshot($this->snapshot));
    }
}
