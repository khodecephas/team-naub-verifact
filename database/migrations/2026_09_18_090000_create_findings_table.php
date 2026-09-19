<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A hash-chained, append-only ledger of analyst findings per case —
     * the same tamper-evident pattern as evidence_custody_events, so a
     * finding can never be silently edited or removed after recording.
     */
    public function up(): void
    {
        Schema::create('findings', function (Blueprint $table) {
            $table->id();
            $table->string('finding_number')->unique();
            $table->foreignId('case_id')->constrained('cases')->restrictOnDelete();
            $table->foreignId('evidence_id')->nullable()->constrained('evidence')->restrictOnDelete();
            $table->foreignId('authored_by')->constrained('users')->restrictOnDelete();
            $table->unsignedInteger('sequence_number');
            $table->string('title');
            $table->text('narrative');
            $table->char('previous_finding_hash', 64)->nullable();
            $table->char('finding_hash', 64);
            $table->unsignedSmallInteger('hash_scheme_version')->default(1);
            $table->timestamp('occurred_at');
            $table->timestamps();

            $table->unique(['case_id', 'sequence_number']);
            $table->index(['case_id', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('findings');
    }
};
