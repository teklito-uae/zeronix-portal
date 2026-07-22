<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Retires the invoice-level delivery confirmation fields. Delivery state now
 * lives entirely on the Delivery model (see 2026_07_22_000003), which is the
 * record actually tracking dispatch and stock movement — the flags dropped
 * here were a disconnected, invoice-scoped duplicate of that concept.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['delivery_confirmed_at', 'delivery_status', 'delivery_notes']);
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->timestamp('delivery_confirmed_at')->nullable();
            $table->string('delivery_status')->nullable();
            $table->text('delivery_notes')->nullable();
        });
    }
};
