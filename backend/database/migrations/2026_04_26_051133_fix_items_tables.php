<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quote_items', function (Blueprint $table) {
            $table->string('product_name')->nullable()->change();
            $table->decimal('tax_percent', 5, 2)->default(5)->after('unit_price');
            $table->decimal('tax_amount', 12, 2)->default(0)->after('tax_percent');
        });

        Schema::table('invoice_items', function (Blueprint $table) {
            $table->string('product_name')->nullable()->change();
            $table->decimal('tax_percent', 5, 2)->default(5)->after('unit_price');
            $table->decimal('tax_amount', 12, 2)->default(0)->after('tax_percent');
        });
    }

    public function down(): void
    {
        Schema::table('quote_items', function (Blueprint $table) {
            $table->string('product_name')->nullable(false)->change();
            $table->dropColumn(['tax_percent', 'tax_amount']);
        });

        Schema::table('invoice_items', function (Blueprint $table) {
            $table->string('product_name')->nullable(false)->change();
            $table->dropColumn(['tax_percent', 'tax_amount']);
        });
    }
};
