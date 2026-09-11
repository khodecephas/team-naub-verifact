<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Create an append-only record of report PDF deliveries. */
    public function up(): void
    {
        Schema::create('report_downloads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained('reports')->cascadeOnDelete();
            $table->foreignId('downloaded_by')->constrained('users')->restrictOnDelete();
            $table->string('delivery_type', 20);
            $table->boolean('included_technical_appendix')->default(false);
            $table->timestamp('downloaded_at');
            $table->timestamps();

            $table->index(['report_id', 'downloaded_at']);
        });
    }

    /** Remove report delivery history. */
    public function down(): void
    {
        Schema::dropIfExists('report_downloads');
    }
};
