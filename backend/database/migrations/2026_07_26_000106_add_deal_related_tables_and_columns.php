<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Release B6 — remaining additive schema for the final feature set:
 *   - `customers.type` (business|individual), backfilled from `company`.
 *   - `sales_orders.deal_id`, FK to `enquiries.id` (brand new column, no
 *     existing data to remap).
 *   - New `deal_contacts` pivot: `deal_id` FKs to `enquiries.id` (named
 *     `deal_id` for forward-clarity even though `deals` isn't the physical
 *     target table — there's no `deals`-named table to point at in this
 *     release), `customer_contact_id` FKs to `customer_contacts`.
 *
 * `quotes.status` needs no migration — it's already a plain unconstrained
 * `string` column; the `approved`/`superseded` values are an
 * application-level convention added in a later release.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('customers', 'type')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->string('type')->nullable()->default(null)->after('company');
            });
        }

        DB::table('customers')
            ->whereNull('type')
            ->update([
                'type' => DB::raw("CASE WHEN company IS NULL OR company = '' THEN 'individual' ELSE 'business' END"),
            ]);

        if (! Schema::hasColumn('sales_orders', 'deal_id')) {
            Schema::table('sales_orders', function (Blueprint $table) {
                $table->foreignId('deal_id')->nullable()->after('enquiry_id')->constrained('enquiries')->nullOnDelete();
            });
        }

        if (! Schema::hasTable('deal_contacts')) {
            Schema::create('deal_contacts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('deal_id')->constrained('enquiries')->cascadeOnDelete();
                $table->foreignId('customer_contact_id')->constrained('customer_contacts')->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['deal_id', 'customer_contact_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('deal_contacts');

        if (Schema::hasColumn('sales_orders', 'deal_id')) {
            Schema::table('sales_orders', function (Blueprint $table) {
                $table->dropConstrainedForeignId('deal_id');
            });
        }

        if (Schema::hasColumn('customers', 'type')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->dropColumn('type');
            });
        }
    }
};
