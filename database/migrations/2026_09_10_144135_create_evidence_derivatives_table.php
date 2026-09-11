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
        Schema::create('evidence_derivatives', function (Blueprint $table) {
            $table->id();
            $table->string('derivative_number')->unique();
            $table->foreignId('evidence_id')->constrained('evidence')->restrictOnDelete();
            $table->string('derivative_type');
            $table->string('storage_disk');
            $table->string('storage_path');
            $table->string('original_filename')->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('file_size_bytes');
            $table->char('sha256', 64);
            $table->string('status');
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('issued_to')->nullable()->constrained('users')->restrictOnDelete();
            $table->text('purpose')->nullable();
            $table->timestamp('issued_at')->nullable();
            $table->timestamp('downloaded_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();

            $table->index(['evidence_id', 'created_at']);
            $table->index(['status', 'expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('evidence_derivatives');
    }
};
