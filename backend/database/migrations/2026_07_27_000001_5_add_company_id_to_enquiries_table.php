<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('enquiries') && !Schema::hasColumn('enquiries', 'company_id')) {
            Schema::table('enquiries', function (Blueprint $table) {
                $table->foreignId('company_id')->nullable()->after('id')->constrained('companies')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('enquiries', 'company_id')) {
            Schema::table('enquiries', function (Blueprint $table) {
                $table->dropForeign(['company_id']);
                $table->dropColumn('company_id');
            });
        }
    }
};
