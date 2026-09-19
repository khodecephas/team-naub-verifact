<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Append-only audit log of every offline-sync attempt, successful or
     * not. This is what lets a hash mismatch or an authorization change
     * while offline be reviewed later instead of silently vanishing.
     */
    public function up(): void
    {
        Schema::create('offline_sync_attempts', function (Blueprint $table) {
            $table->id();
            $table->uuid('offline_collection_id');
            $table->string('subject_type', 20);
            $table->foreignId('case_id')->nullable()->constrained('cases')->nullOnDelete();
            $table->foreignId('attempted_by')->constrained('users')->restrictOnDelete();
            $table->string('outcome', 20);
            $table->char('client_sha256', 64)->nullable();
            $table->char('server_sha256', 64)->nullable();
            $table->foreignId('evidence_id')->nullable()->constrained('evidence')->nullOnDelete();
            $table->foreignId('physical_source_id')->nullable()->constrained('physical_sources')->nullOnDelete();
            $table->text('error_message')->nullable();
            $table->timestamp('attempted_at');
            $table->timestamps();

            $table->index(['offline_collection_id', 'attempted_at']);
            $table->index(['attempted_by', 'attempted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('offline_sync_attempts');
    }
};
