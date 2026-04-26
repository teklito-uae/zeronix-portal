<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tables = ['customers', 'enquiries', 'quotes', 'invoices'];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    if (!Schema::hasColumn($tableName, 'user_id')) {
                        $table->foreignId('user_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
                    }
                });
            }
        }
    }

    public function down(): void
    {
        $tables = ['customers', 'enquiries', 'quotes', 'invoices'];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    if (Schema::hasColumn($tableName, 'user_id')) {
                        $table->dropForeign(['user_id']);
                        $table->dropColumn('user_id');
                    }
                });
            }
        }
    }
};
