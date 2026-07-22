<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->foreignId('deal_id')->nullable()->after('enquiry_id')->constrained()->nullOnDelete();
            $table->string('payment_terms')->nullable()->after('attachments');
            $table->date('delivery_date')->nullable()->after('payment_terms');
        });
    }

    public function down(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('deal_id');
            $table->dropColumn(['payment_terms', 'delivery_date']);
        });
    }
};
