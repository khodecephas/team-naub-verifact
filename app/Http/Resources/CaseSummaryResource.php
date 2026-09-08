<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The compact case shape used in lists (dashboard "Recent Cases", the
 * cases index) — shared so both controllers don't hand-roll the same map.
 */
class CaseSummaryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'case_number' => $this->case_number,
            'title' => $this->title,
            'status' => $this->status,
            'case_manager' => $this->whenLoaded('caseManager', fn () => $this->caseManager?->name),
            'evidence_count' => $this->when(isset($this->evidence_count), fn () => (int) $this->evidence_count),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
