<?php

use App\Enums\IntegrityStatus;
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
        Schema::create('evidence', function (Blueprint $table) {
            $table->id();
            $table->string('evidence_number')->unique();

            // restrictOnDelete throughout: evidence rows are never silently
            // orphaned by deleting the case, source, or registering user that
            // produced them.
            $table->foreignId('case_id')->constrained('cases')->restrictOnDelete();
            $table->foreignId('physical_source_id')->nullable()
                ->constrained('physical_sources')->restrictOnDelete();

            $table->string('title');
            $table->text('description')->nullable();
            $table->string('evidence_type');

            $table->string('storage_disk');
            $table->string('storage_path');

            $table->string('original_filename');
            $table->string('mime_type')->nullable();
            $table->string('file_extension', 16)->nullable();
            $table->unsignedBigInteger('file_size_bytes');

            $table->char('sha256_baseline', 64);
            $table->string('integrity_status')->default(IntegrityStatus::BASELINE_ESTABLISHED);

            $table->foreignId('registered_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('registered_at');

            $table->timestamps();

            // case_id, physical_source_id and registered_by already get an
            // index from their FK constraint above — no need to add another.
            $table->index('integrity_status');
            $table->index('evidence_type');
            $table->index('registered_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('evidence');
    }
};
