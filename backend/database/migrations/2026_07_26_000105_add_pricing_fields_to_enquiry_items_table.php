<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Release B5 — priced `enquiry_items`, matching `quote_items`' column types
 * (unit_price/tax_percent/tax_amount/discount_percent/discount_amount/total
 * decimal precisions confirmed by reading quote_items' migrations and the
 * live schema). Purely additive; the 5 existing rows get zero-value defaults
 * for all new columns.
 *
 * Note: `quote_items.discount_percent`/`discount_amount` are NOT NULL in the
 * live schema (defaulted, but not nullable). This migration's spec calls for
 * `enquiry_items.discount_percent`/`discount_amount` to be nullable, which is
 * followed here verbatim even though it's a minor deviation from "match
 * quote_items' exact column types" for those two columns specifically —
 * flagged in the final report for review.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enquiry_items', function (Blueprint $table) {
            $table->decimal('unit_price', 12, 2)->default(0)->after('description');
            $table->decimal('tax_percent', 5, 2)->default(5)->after('unit_price');
            $table->decimal('tax_amount', 12, 2)->default(0)->after('tax_percent');
            $table->decimal('discount_percent', 5, 2)->nullable()->default(0)->after('tax_amount');
            $table->decimal('discount_amount', 12, 2)->nullable()->default(0)->after('discount_percent');
            $table->decimal('total', 12, 2)->default(0)->after('discount_amount');
        });
    }

    public function down(): void
    {
        Schema::table('enquiry_items', function (Blueprint $table) {
            $table->dropColumn([
                'unit_price',
                'tax_percent',
                'tax_amount',
                'discount_percent',
                'discount_amount',
                'total',
            ]);
        });
    }
};
