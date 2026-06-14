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
        Schema::table('quotes', function (Blueprint $table) {
            $table->date('due_date')->nullable()->after('valid_until');
            $table->integer('closing_ratio')->nullable()->after('due_date');
            $table->timestamp('last_notified_at')->nullable()->after('closing_ratio');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->dropColumn(['due_date', 'closing_ratio', 'last_notified_at']);
        });
    }
};
