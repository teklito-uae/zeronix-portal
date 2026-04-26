<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('imap_host')->nullable()->after('smtp_encryption');
            $table->string('imap_port')->nullable()->after('imap_host');
            $table->string('imap_username')->nullable()->after('imap_port');
            $table->string('imap_password')->nullable()->after('imap_username');
            $table->string('imap_encryption')->default('ssl')->after('imap_password');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['imap_host', 'imap_port', 'imap_username', 'imap_password', 'imap_encryption']);
        });
    }
};
