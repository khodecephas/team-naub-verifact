<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('evidence', function (Blueprint $table) {
            $table->foreignId('current_custodian_id')
                ->nullable()
                ->after('registered_by')
                ->constrained('users')
                ->restrictOnDelete();
            $table->string('current_custody_location')->nullable()->after('current_custodian_id');
        });

        DB::table('evidence')->update([
            'current_custodian_id' => DB::raw('registered_by'),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('evidence', function (Blueprint $table) {
            $table->dropConstrainedForeignId('current_custodian_id');
            $table->dropColumn('current_custody_location');
        });
    }
};
