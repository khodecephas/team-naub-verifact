<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** Create an initial custody ledger entry for pre-existing evidence records. */
    public function up(): void
    {
        DB::table('evidence')
            ->whereNotNull('current_custodian_id')
            ->whereNotExists(function ($query) {
                $query->selectRaw('1')
                    ->from('evidence_custody_events')
                    ->whereColumn('evidence_custody_events.evidence_id', 'evidence.id');
            })
            ->orderBy('id')
            ->get()
            ->each(function ($evidence) {
                $occurredAt = (string) ($evidence->registered_at ?? $evidence->created_at);
                $payload = implode('|', [
                    1, 'evidence', $evidence->id, 1, 'INITIAL_CUSTODY', '',
                    $evidence->current_custodian_id, $evidence->registered_by,
                    'Initial evidence registration', '', $evidence->current_custody_location ?? '',
                    $occurredAt, 'REGISTRATION', '',
                ]);

                DB::table('evidence_custody_events')->insert([
                    'evidence_id' => $evidence->id,
                    'custodial_subject_type' => 'evidence',
                    'custodial_subject_id' => $evidence->id,
                    'sequence_number' => 1,
                    'action' => 'INITIAL_CUSTODY',
                    'transfer_method' => 'REGISTRATION',
                    'from_custodian_id' => null,
                    'to_custodian_id' => $evidence->current_custodian_id,
                    'transferred_by' => $evidence->registered_by,
                    'purpose' => 'Initial evidence registration',
                    'from_location' => null,
                    'to_location' => $evidence->current_custody_location,
                    'notes' => null,
                    'previous_event_hash' => null,
                    'event_hash' => hash('sha256', $payload),
                    'hash_scheme_version' => 1,
                    'occurred_at' => $occurredAt,
                    'transferred_at' => $occurredAt,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            });
    }

    /** Remove only entries created by this historical backfill. */
    public function down(): void
    {
        DB::table('evidence_custody_events')
            ->where('action', 'INITIAL_CUSTODY')
            ->where('transfer_method', 'REGISTRATION')
            ->delete();
    }
};
