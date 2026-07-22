<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->text('notes')->nullable()->after('delivery_date');
            $table->text('terms')->nullable()->after('notes');
            $table->decimal('discount_percent', 5, 2)->nullable()->default(0)->after('terms');
            $table->decimal('shipping_amount', 12, 2)->nullable()->default(0)->after('discount_percent');
        });
    }

    public function down(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->dropColumn(['notes', 'terms', 'discount_percent', 'shipping_amount']);
        });
    }
};
