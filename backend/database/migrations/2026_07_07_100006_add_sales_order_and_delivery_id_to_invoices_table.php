<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('sales_order_id')->nullable()->after('quote_id')->constrained()->nullOnDelete();
            $table->foreignId('delivery_id')->nullable()->after('sales_order_id')->constrained()->nullOnDelete();
        });

        // Canonical invoice status list: draft, posted, partially_paid, paid, overdue, cancelled.
        DB::table('invoices')->whereIn('status', ['unpaid', 'sent'])->update(['status' => 'posted']);
        DB::table('invoices')->where('status', 'partial')->update(['status' => 'partially_paid']);
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropConstrainedForeignId('delivery_id');
            $table->dropConstrainedForeignId('sales_order_id');
        });
    }
};
