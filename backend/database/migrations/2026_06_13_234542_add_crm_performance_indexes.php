<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            if (!Schema::hasIndex('customers', 'customers_user_id_index')) {
                $table->index('user_id', 'customers_user_id_index');
            }
            if (!Schema::hasIndex('customers', 'customers_email_index')) {
                $table->index('email', 'customers_email_index');
            }
        });

        Schema::table('enquiries', function (Blueprint $table) {
            if (!Schema::hasIndex('enquiries', 'enquiries_customer_id_created_at_index')) {
                $table->index(['customer_id', 'created_at'], 'enquiries_customer_id_created_at_index');
            }
        });

        Schema::table('quotes', function (Blueprint $table) {
            if (!Schema::hasIndex('quotes', 'quotes_customer_id_index')) {
                $table->index('customer_id', 'quotes_customer_id_index');
            }
        });

        Schema::table('invoices', function (Blueprint $table) {
            if (!Schema::hasIndex('invoices', 'invoices_customer_id_status_index')) {
                $table->index(['customer_id', 'status'], 'invoices_customer_id_status_index');
            }
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex('customers_user_id_index');
            $table->dropIndex('customers_email_index');
        });

        Schema::table('enquiries', function (Blueprint $table) {
            $table->dropIndex('enquiries_customer_id_created_at_index');
        });

        Schema::table('quotes', function (Blueprint $table) {
            $table->dropIndex('quotes_customer_id_index');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex('invoices_customer_id_status_index');
        });
    }
};
