<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            $table->foreignId('invoice_id')->nullable()->after('sales_order_id')->constrained()->nullOnDelete();
            $table->string('customer_confirmation')->nullable()->after('delivered_at'); // accepted, rejected
            $table->timestamp('customer_confirmed_at')->nullable()->after('customer_confirmation');
            $table->text('customer_notes')->nullable()->after('customer_confirmed_at');
        });
    }

    public function down(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            $table->dropColumn(['customer_confirmation', 'customer_confirmed_at', 'customer_notes']);
            $table->dropConstrainedForeignId('invoice_id');
        });
    }
};
