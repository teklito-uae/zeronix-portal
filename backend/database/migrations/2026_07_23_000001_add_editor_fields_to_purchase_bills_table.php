<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_bills', function (Blueprint $table) {
            $table->string('reference_id')->nullable()->after('status');
            $table->text('notes')->nullable()->after('reference_id');
            $table->text('terms')->nullable()->after('notes');
            $table->decimal('discount_percent', 5, 2)->nullable()->default(0)->after('terms');
            $table->decimal('shipping_amount', 12, 2)->nullable()->default(0)->after('discount_percent');
            $table->json('tags')->nullable()->after('shipping_amount');
            $table->json('attachments')->nullable()->after('tags');
        });
    }

    public function down(): void
    {
        Schema::table('purchase_bills', function (Blueprint $table) {
            $table->dropColumn(['reference_id', 'notes', 'terms', 'discount_percent', 'shipping_amount', 'tags', 'attachments']);
        });
    }
};
