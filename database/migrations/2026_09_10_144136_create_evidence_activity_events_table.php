<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('evidence_activity_events', function (Blueprint $table) {
            $table->id();
            $table->string('subject_type');
            $table->unsignedBigInteger('subject_id');
            $table->string('event_type');
            $table->foreignId('actor_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->json('payload');
            $table->unsignedSmallInteger('hash_scheme_version')->default(1);
            $table->char('previous_event_hash', 64)->nullable();
            $table->char('event_hash', 64)->unique();
            $table->timestamp('occurred_at');
            $table->timestamps();

            $table->index(['subject_type', 'subject_id', 'id']);
            $table->index(['event_type', 'occurred_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('evidence_activity_events');
    }
};
