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
        Schema::create('evidence_custody_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evidence_id')->constrained('evidence')->restrictOnDelete();
            $table->foreignId('from_custodian_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->foreignId('to_custodian_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('transferred_by')->constrained('users')->restrictOnDelete();
            $table->string('purpose');
            $table->string('from_location')->nullable();
            $table->string('to_location')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('transferred_at');
            $table->timestamps();

            $table->index(['evidence_id', 'transferred_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('evidence_custody_events');
    }
};
