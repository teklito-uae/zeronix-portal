<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `customer_labels.name` was globally unique, predating tenancy: one company
 * creating "VIP" stopped every other company from ever using that name. Scope
 * the constraint to the owning tenant instead.
 *
 * Widening a constraint, so existing rows always satisfy the new index.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_labels', function (Blueprint $table) {
            $table->dropUnique('customer_labels_name_unique');
            $table->unique(['company_id', 'name'], 'customer_labels_company_id_name_unique');
        });
    }

    public function down(): void
    {
        Schema::table('customer_labels', function (Blueprint $table) {
            $table->dropUnique('customer_labels_company_id_name_unique');
            $table->unique('name', 'customer_labels_name_unique');
        });
    }
};
