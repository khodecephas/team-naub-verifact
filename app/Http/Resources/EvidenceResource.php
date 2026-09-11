<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Deliberately omits storage_disk/storage_path — internal filesystem
 * details the frontend has no legitimate use for, even though that disk is
 * never publicly reachable anyway.
 */
class EvidenceResource extends JsonResource
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
            'evidence_number' => $this->evidence_number,
            'title' => $this->title,
            'description' => $this->description,
            'evidence_type' => $this->evidence_type,
            'original_filename' => $this->original_filename,
            'mime_type' => $this->mime_type,
            'file_extension' => $this->file_extension,
            'file_size_bytes' => $this->file_size_bytes,
            'sha256_baseline' => $this->sha256_baseline,
            'integrity_status' => $this->integrity_status,
            'registered_at' => $this->registered_at?->toIso8601String(),
            'case' => $this->whenLoaded('case', fn () => $this->case ? [
                'id' => $this->case->id,
                'case_number' => $this->case->case_number,
                'title' => $this->case->title,
            ] : null),
            'physical_source' => $this->whenLoaded(
                'physicalSource',
                fn () => $this->physicalSource ? [
                    'id' => $this->physicalSource->id,
                    'label' => $this->physicalSource->label,
                ] : null,
            ),
            'registered_by' => $this->whenLoaded('registeredBy', fn () => [
                'id' => $this->registeredBy->id,
                'name' => $this->registeredBy->name,
            ]),
            'current_custodian' => $this->whenLoaded(
                'currentCustodian',
                fn () => $this->currentCustodian ? [
                    'id' => $this->currentCustodian->id,
                    'name' => $this->currentCustodian->name,
                ] : null,
            ),
            'current_custody_location' => $this->current_custody_location,
        ];
    }
}
