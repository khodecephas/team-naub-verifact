<?php

namespace App\Services;

use App\Enums\EvidenceActivityType;
use App\Models\EvidenceActivityEvent;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class EvidenceActivityEventService
{
    private const HASH_SCHEME_VERSION = 1;

    /**
     * Append a deterministic, hash-chained event to a subject's history.
     * Callers should already hold a transaction lock on the subject when
     * several actors could append events concurrently.
     *
     * @param  array<string, mixed>  $payload
     */
    public static function append(
        Model $subject,
        EvidenceActivityType $eventType,
        ?User $actor,
        array $payload,
        ?Carbon $occurredAt = null,
    ): EvidenceActivityEvent {
        return DB::transaction(function () use ($subject, $eventType, $actor, $payload, $occurredAt) {
            $occurredAt = ($occurredAt ?? now())->copy()->setMicrosecond(0);
            $previousHash = EvidenceActivityEvent::query()
                ->whereMorphedTo('subject', $subject)
                ->latest('id')
                ->lockForUpdate()
                ->value('event_hash');

            $canonicalPayload = self::canonicalize($payload);
            $eventHash = hash('sha256', self::canonicalJson([
                'actor_id' => $actor?->id,
                'event_type' => $eventType->value,
                'hash_scheme_version' => self::HASH_SCHEME_VERSION,
                'occurred_at' => $occurredAt->toISOString(),
                'payload' => $canonicalPayload,
                'previous_event_hash' => $previousHash,
                'subject_id' => $subject->getKey(),
                'subject_type' => $subject->getMorphClass(),
            ]));

            return EvidenceActivityEvent::create([
                'subject_type' => $subject->getMorphClass(),
                'subject_id' => $subject->getKey(),
                'event_type' => $eventType->value,
                'actor_id' => $actor?->id,
                'payload' => $canonicalPayload,
                'hash_scheme_version' => self::HASH_SCHEME_VERSION,
                'previous_event_hash' => $previousHash,
                'event_hash' => $eventHash,
                'occurred_at' => $occurredAt,
            ]);
        });
    }

    public static function verifyChain(Model $subject): bool
    {
        $previousHash = null;

        foreach (EvidenceActivityEvent::query()->whereMorphedTo('subject', $subject)->oldest('id')->get() as $event) {
            if (! hash_equals((string) $previousHash, (string) $event->previous_event_hash)) {
                return false;
            }

            $expectedHash = hash('sha256', self::canonicalJson([
                'actor_id' => $event->actor_id,
                'event_type' => $event->event_type,
                'hash_scheme_version' => $event->hash_scheme_version,
                'occurred_at' => $event->occurred_at->toISOString(),
                'payload' => self::canonicalize($event->payload),
                'previous_event_hash' => $event->previous_event_hash,
                'subject_id' => $event->subject_id,
                'subject_type' => $event->subject_type,
            ]));

            if (! hash_equals($expectedHash, $event->event_hash)) {
                return false;
            }

            $previousHash = $event->event_hash;
        }

        return true;
    }

    /**
     * @return array<string, mixed>|list<mixed>|mixed
     */
    private static function canonicalize(mixed $value): mixed
    {
        if (! is_array($value)) {
            return $value;
        }

        if (array_is_list($value)) {
            return array_map(self::canonicalize(...), $value);
        }

        ksort($value, SORT_STRING);

        foreach ($value as $key => $item) {
            $value[$key] = self::canonicalize($item);
        }

        return $value;
    }

    /**
     * @param  array<string, mixed>  $value
     */
    private static function canonicalJson(array $value): string
    {
        $json = json_encode(self::canonicalize($value), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        if ($json === false) {
            throw new RuntimeException('Failed to encode the canonical evidence event payload.');
        }

        return $json;
    }
}
