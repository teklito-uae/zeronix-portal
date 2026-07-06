<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enquiries', function (Blueprint $table) {
            $table->foreignId('customer_contact_id')->nullable()->after('lead_id')->constrained('customer_contacts')->nullOnDelete();
            $table->json('attachments')->nullable()->after('notes');
        });

        Schema::table('quotes', function (Blueprint $table) {
            $table->foreignId('customer_contact_id')->nullable()->after('customer_id')->constrained('customer_contacts')->nullOnDelete();
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('customer_contact_id')->nullable()->after('customer_id')->constrained('customer_contacts')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('enquiries', function (Blueprint $table) {
            $table->dropConstrainedForeignId('customer_contact_id');
            $table->dropColumn('attachments');
        });
        Schema::table('quotes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('customer_contact_id');
        });
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropConstrainedForeignId('customer_contact_id');
        });
    }
};
