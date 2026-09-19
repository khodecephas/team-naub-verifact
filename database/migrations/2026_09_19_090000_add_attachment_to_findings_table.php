<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Optional supporting document stored and fingerprinted alongside a finding. */
    public function up(): void
    {
        Schema::table('findings', function (Blueprint $table) {
            $table->string('attachment_disk')->nullable()->after('narrative');
            $table->string('attachment_path')->nullable()->after('attachment_disk');
            $table->string('attachment_original_filename')->nullable()->after('attachment_path');
            $table->string('attachment_mime_type')->nullable()->after('attachment_original_filename');
            $table->unsignedBigInteger('attachment_size_bytes')->nullable()->after('attachment_mime_type');
            $table->char('attachment_sha256', 64)->nullable()->after('attachment_size_bytes');
        });
    }

    public function down(): void
    {
        Schema::table('findings', function (Blueprint $table) {
            $table->dropColumn([
                'attachment_disk', 'attachment_path', 'attachment_original_filename',
                'attachment_mime_type', 'attachment_size_bytes', 'attachment_sha256',
            ]);
        });
    }
};
