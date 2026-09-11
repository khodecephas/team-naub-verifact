<?php

namespace App\Services;

use App\Enums\CustodyEventAction;
use App\Enums\CustodyTransferMethod;
use App\Models\CustodyRequest;
use App\Models\Evidence;
use App\Models\EvidenceCustodyEvent;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class EvidenceCustodyService
{
    /** Record the first holder without changing the evidence master or its file hash. */
    public static function recordInitialCustody(Evidence $evidence, User $custodian): EvidenceCustodyEvent
    {
        $occurredAt = $evidence->registered_at ?? now();
        $attributes = [
            'evidence_id' => $evidence->id,
            'custodial_subject_type' => 'evidence',
            'custodial_subject_id' => $evidence->id,
            'sequence_number' => 1,
            'action' => CustodyEventAction::INITIAL_CUSTODY,
            'transfer_method' => CustodyTransferMethod::REGISTRATION,
            'from_custodian_id' => null,
            'to_custodian_id' => $custodian->id,
            'transferred_by' => $custodian->id,
            'purpose' => 'Initial evidence registration',
            'from_location' => null,
            'to_location' => $evidence->current_custody_location,
            'notes' => null,
            'previous_event_hash' => null,
            'hash_scheme_version' => 1,
            'occurred_at' => $occurredAt,
            'transferred_at' => $occurredAt,
        ];
        $attributes['event_hash'] = self::eventHash($attributes);

        return EvidenceCustodyEvent::create($attributes);
    }

    /**
     * Transfer authoritative custody and append its cryptographically chained event.
     *
     * @param  array{purpose: string, to_location?: string|null, notes?: string|null}  $data
     */
    public static function transfer(
        Evidence $evidence,
        User $toCustodian,
        User $transferredBy,
        array $data,
        string $method = CustodyTransferMethod::DIRECT_ADMINISTRATIVE,
        ?CustodyRequest $custodyRequest = null,
    ): EvidenceCustodyEvent {
        return DB::transaction(function () use ($evidence, $toCustodian, $transferredBy, $data, $method, $custodyRequest) {
            $lockedEvidence = Evidence::query()->lockForUpdate()->findOrFail($evidence->id);

            return self::transferLocked($lockedEvidence, $toCustodian, $transferredBy, $data, $method, $custodyRequest);
        });
    }

    /**
     * Append a transfer while the evidence row is already locked.
     *
     * @param  array{purpose: string, to_location?: string|null, notes?: string|null}  $data
     */
    public static function transferLocked(
        Evidence $evidence,
        User $toCustodian,
        User $transferredBy,
        array $data,
        string $method,
        ?CustodyRequest $custodyRequest = null,
    ): EvidenceCustodyEvent {
        if ($evidence->current_custodian_id === $toCustodian->id) {
            throw new \DomainException('This person already holds custody of the evidence.');
        }
        if ($evidence->case === null || ! (
            $evidence->case->created_by === $toCustodian->id
            || $evidence->case->case_manager_id === $toCustodian->id
            || $evidence->case->assignments()->where('user_id', $toCustodian->id)->exists()
        )) {
            throw new \DomainException('The selected custodian is not assigned to this evidence case.');
        }

        $previous = EvidenceCustodyEvent::query()
            ->where('custodial_subject_type', 'evidence')
            ->where('custodial_subject_id', $evidence->id)
            ->lockForUpdate()
            ->latest('sequence_number')
            ->first();
        $occurredAt = now();
        $attributes = [
            'evidence_id' => $evidence->id,
            'custodial_subject_type' => 'evidence',
            'custodial_subject_id' => $evidence->id,
            'sequence_number' => ($previous?->sequence_number ?? 0) + 1,
            'action' => CustodyEventAction::TRANSFER,
            'transfer_method' => $method,
            'custody_request_id' => $custodyRequest?->id,
            'from_custodian_id' => $evidence->current_custodian_id,
            'to_custodian_id' => $toCustodian->id,
            'transferred_by' => $transferredBy->id,
            'purpose' => $data['purpose'],
            'from_location' => $evidence->current_custody_location,
            'to_location' => $data['to_location'] ?? null,
            'notes' => $data['notes'] ?? null,
            'previous_event_hash' => $previous?->event_hash,
            'hash_scheme_version' => 1,
            'occurred_at' => $occurredAt,
            'transferred_at' => $occurredAt,
        ];
        $attributes['event_hash'] = self::eventHash($attributes);
        $event = EvidenceCustodyEvent::create($attributes);

        $evidence->update([
            'current_custodian_id' => $toCustodian->id,
            'current_custody_location' => $data['to_location'] ?? null,
        ]);

        return $event;
    }

    /** Verify event order, links, and canonical hashes for an evidence item. */
    public static function verifyChain(Evidence $evidence): bool
    {
        $previous = null;
        $sequence = 1;

        foreach ($evidence->custodyEvents()->oldest('sequence_number')->get() as $event) {
            if ($event->sequence_number !== $sequence || $event->previous_event_hash !== $previous) {
                return false;
            }
            if (! hash_equals($event->event_hash, self::eventHash($event->getAttributes()))) {
                return false;
            }
            $previous = $event->event_hash;
            $sequence++;
        }

        return true;
    }

    /** Build a deterministic digest from stable IDs and recorded event values. */
    private static function eventHash(array $event): string
    {
        $occurredAt = $event['occurred_at'] instanceof \DateTimeInterface
            ? $event['occurred_at']->format('Y-m-d H:i:s')
            : (string) $event['occurred_at'];

        return hash('sha256', implode('|', [
            $event['hash_scheme_version'], $event['custodial_subject_type'], $event['custodial_subject_id'],
            $event['sequence_number'], $event['action'], $event['from_custodian_id'] ?? '',
            $event['to_custodian_id'], $event['transferred_by'], $event['purpose'],
            $event['from_location'] ?? '', $event['to_location'] ?? '', $occurredAt,
            $event['transfer_method'], $event['previous_event_hash'] ?? '',
        ]));
    }
}
