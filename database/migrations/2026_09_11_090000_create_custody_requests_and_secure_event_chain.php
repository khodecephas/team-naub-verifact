<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add the reviewed request workflow and cryptographic custody ledger metadata.
     */
    public function up(): void
    {
        Schema::create('custody_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evidence_id')->constrained('evidence')->restrictOnDelete();
            $table->foreignId('requested_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('current_custodian_id')->constrained('users')->restrictOnDelete();
            $table->string('requested_location')->nullable();
            $table->string('purpose');
            $table->string('status', 20)->default('PENDING');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();
            $table->timestamps();

            $table->index(['evidence_id', 'status']);
            $table->index(['current_custodian_id', 'status']);
            $table->index(['requested_by', 'status']);
        });

        Schema::table('evidence_custody_events', function (Blueprint $table) {
            $table->string('custodial_subject_type')->nullable()->after('evidence_id');
            $table->unsignedBigInteger('custodial_subject_id')->nullable()->after('custodial_subject_type');
            $table->unsignedInteger('sequence_number')->nullable()->after('custodial_subject_id');
            $table->string('action', 40)->default('TRANSFER')->after('sequence_number');
            $table->string('transfer_method', 40)->default('DIRECT_ADMINISTRATIVE')->after('action');
            $table->foreignId('custody_request_id')->nullable()->after('transfer_method')->constrained('custody_requests')->restrictOnDelete();
            $table->char('previous_event_hash', 64)->nullable()->after('notes');
            $table->char('event_hash', 64)->nullable()->after('previous_event_hash');
            $table->unsignedSmallInteger('hash_scheme_version')->default(1)->after('event_hash');
            $table->timestamp('occurred_at')->nullable()->after('hash_scheme_version');
        });

        $previousByEvidence = [];
        $sequenceByEvidence = [];

        DB::table('evidence_custody_events')->orderBy('evidence_id')->orderBy('transferred_at')->orderBy('id')
            ->get()->each(function ($event) use (&$previousByEvidence, &$sequenceByEvidence) {
                $sequence = ($sequenceByEvidence[$event->evidence_id] ?? 0) + 1;
                $previous = $previousByEvidence[$event->evidence_id] ?? null;
                $occurredAt = (string) $event->transferred_at;
                $payload = implode('|', [
                    1, 'evidence', $event->evidence_id, $sequence, 'TRANSFER',
                    $event->from_custodian_id ?? '', $event->to_custodian_id,
                    $event->transferred_by, $event->purpose, $event->from_location ?? '',
                    $event->to_location ?? '', $occurredAt, 'DIRECT_ADMINISTRATIVE', $previous ?? '',
                ]);
                $hash = hash('sha256', $payload);

                DB::table('evidence_custody_events')->where('id', $event->id)->update([
                    'custodial_subject_type' => 'evidence',
                    'custodial_subject_id' => $event->evidence_id,
                    'sequence_number' => $sequence,
                    'previous_event_hash' => $previous,
                    'event_hash' => $hash,
                    'occurred_at' => $event->transferred_at,
                ]);
                $sequenceByEvidence[$event->evidence_id] = $sequence;
                $previousByEvidence[$event->evidence_id] = $hash;
            });

        Schema::table('evidence_custody_events', function (Blueprint $table) {
            $table->unique(
                ['custodial_subject_type', 'custodial_subject_id', 'sequence_number'],
                'custody_subject_sequence_unique',
            );
            $table->index(
                ['custodial_subject_type', 'custodial_subject_id', 'occurred_at'],
                'custody_subject_occurred_index',
            );
        });
    }

    /** Reverse the custody workflow schema. */
    public function down(): void
    {
        Schema::table('evidence_custody_events', function (Blueprint $table) {
            $table->dropUnique('custody_subject_sequence_unique');
            $table->dropIndex('custody_subject_occurred_index');
            $table->dropConstrainedForeignId('custody_request_id');
            $table->dropColumn([
                'custodial_subject_type', 'custodial_subject_id', 'sequence_number', 'action',
                'transfer_method', 'previous_event_hash', 'event_hash', 'hash_scheme_version',
                'occurred_at',
            ]);
        });

        Schema::dropIfExists('custody_requests');
    }
};
