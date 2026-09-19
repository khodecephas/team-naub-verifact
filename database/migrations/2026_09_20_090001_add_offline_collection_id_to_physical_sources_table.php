<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Idempotency key so a retried offline sync never creates a duplicate physical source. */
    public function up(): void
    {
        Schema::table('physical_sources', function (Blueprint $table) {
            $table->uuid('offline_collection_id')->nullable()->unique()->after('case_id');
        });
    }

    public function down(): void
    {
        Schema::table('physical_sources', function (Blueprint $table) {
            $table->dropColumn('offline_collection_id');
        });
    }
};
