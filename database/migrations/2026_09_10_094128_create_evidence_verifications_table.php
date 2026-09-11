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
        Schema::create('evidence_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evidence_id')->constrained('evidence')->restrictOnDelete();
            $table->char('baseline_sha256', 64);
            $table->char('observed_sha256', 64);
            $table->boolean('matches_baseline');
            $table->string('verification_method')->default('MASTER_REHASH');
            $table->string('comparison_filename')->nullable();
            $table->unsignedBigInteger('comparison_file_size_bytes')->nullable();
            $table->foreignId('verified_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('verified_at');
            $table->timestamps();

            $table->index(['evidence_id', 'verified_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('evidence_verifications');
    }
};
