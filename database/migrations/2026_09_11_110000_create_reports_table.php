<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Create versioned, snapshot-backed non-technical reports. */
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->string('report_number')->unique();
            $table->foreignId('case_id')->constrained('cases')->restrictOnDelete();
            $table->string('title');
            $table->text('introduction')->nullable();
            $table->string('status', 20)->default('DRAFT');
            $table->json('evidence_ids');
            $table->json('finding_ids')->nullable();
            $table->json('snapshot');
            $table->json('technical_details')->nullable();
            $table->char('report_sha256', 64)->nullable();
            $table->foreignId('generated_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('generated_at')->nullable();
            $table->timestamp('finalized_at')->nullable();
            $table->foreignId('supersedes_report_id')->nullable()->constrained('reports')->restrictOnDelete();
            $table->foreignId('superseded_by')->nullable()->constrained('reports')->restrictOnDelete();
            $table->timestamps();

            $table->index(['case_id', 'status']);
            $table->index(['generated_by', 'generated_at']);
        });
    }

    /** Remove report storage. */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
