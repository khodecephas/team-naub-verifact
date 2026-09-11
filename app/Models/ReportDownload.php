<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'report_id', 'downloaded_by', 'delivery_type', 'included_technical_appendix', 'downloaded_at',
])]
class ReportDownload extends Model
{
    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'included_technical_appendix' => 'boolean',
            'downloaded_at' => 'datetime',
        ];
    }

    /** Get the report delivered by this event. */
    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    /** Get the user who requested the report file. */
    public function downloadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'downloaded_by');
    }
}
