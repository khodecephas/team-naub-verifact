<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Provenance for evidence synchronized from an offline collection
     * queue. `registered_at` remains the trusted server registration
     * (= synchronization) time; `collected_at` is the separate,
     * client-recorded time the device says the item was captured — never
     * treated as server-witnessed. `offline_collection_id` is the client
     * idempotency key so a retried sync can never create a duplicate
     * evidence row.
     */
    public function up(): void
    {
        Schema::table('evidence', function (Blueprint $table) {
            $table->string('collection_source', 20)->default('ONLINE')->after('evidence_type');
            $table->uuid('offline_collection_id')->nullable()->unique()->after('collection_source');
            $table->timestamp('collected_at')->nullable()->after('offline_collection_id');
            $table->string('collected_timezone')->nullable()->after('collected_at');
            $table->char('client_sha256', 64)->nullable()->after('collected_timezone');
        });
    }

    public function down(): void
    {
        Schema::table('evidence', function (Blueprint $table) {
            $table->dropColumn([
                'collection_source', 'offline_collection_id', 'collected_at',
                'collected_timezone', 'client_sha256',
            ]);
        });
    }
};
