<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->timestamp('email_sent_at')->nullable()->after('status');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->timestamp('email_sent_at')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->dropColumn('email_sent_at');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn('email_sent_at');
        });
    }
};
