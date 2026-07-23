<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_bill_items', function (Blueprint $table) {
            $table->decimal('discount_percent', 5, 2)->default(0)->after('tax_amount');
            $table->decimal('discount_amount', 12, 2)->default(0)->after('discount_percent');
        });
    }

    public function down(): void
    {
        Schema::table('purchase_bill_items', function (Blueprint $table) {
            $table->dropColumn(['discount_percent', 'discount_amount']);
        });
    }
};
