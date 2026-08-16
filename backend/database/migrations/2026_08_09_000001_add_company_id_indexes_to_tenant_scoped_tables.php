<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Every table below has a `company_id` column (added across several earlier
 * migrations) that was never given an index, so every tenant-scoped query —
 * i.e. every request, via App\Traits\BelongsToCompany's global scope of
 * `where('company_id', ...)` — has been doing a full table scan on these
 * tables. This migration is index-only: no columns, no data changes.
 *
 * `enquiries` (the Deal model's table) gets a composite [company_id, stage]
 * index instead of two separate single-column indexes: DealController's
 * pipeline()/pipelineStats() both filter by company (via the forUser scope)
 * and then group/aggregate by `stage` in the same query, so a single index
 * covering both columns serves that access pattern directly. This mirrors
 * the exact index the old, now-dropped `deals` table had before it was
 * merged into `enquiries` (see 2026_07_22_000001_create_deals_table.php).
 *
 * `quotes`, `invoices`, `tasks`, `products` only get a plain `company_id`
 * index — no other column is consistently filtered/grouped alongside
 * company_id in their list endpoints, so a composite would be speculative.
 *
 * `templates` and `attendances` are intentionally NOT touched here — they
 * were already handled (company_id column + index) by
 * 2026_08_08_000001_add_company_id_to_templates_and_attendances_table.php.
 */
return new class extends Migration
{
    /**
     * Plain tables that just need a single-column index on `company_id`.
     */
    private const SINGLE_COLUMN_TABLES = [
        'customers',
        'leads',
        'sales_orders',
        'deliveries',
        'stock_movements',
        'customer_contacts',
        'contact_activities',
        'purchase_bills',
        'supplier_payment_receipts',
        'expenses',
        'tags',
        'deal_activities',
        'google_contact_connections',
        'quotes',
        'invoices',
        'tasks',
        'products',
    ];

    public function up(): void
    {
        foreach (self::SINGLE_COLUMN_TABLES as $tableName) {
            $indexName = "{$tableName}_company_id_index";

            if (Schema::hasTable($tableName)
                && Schema::hasColumn($tableName, 'company_id')
                && !Schema::hasIndex($tableName, $indexName)
            ) {
                Schema::table($tableName, function (Blueprint $table) use ($indexName) {
                    $table->index('company_id', $indexName);
                });
            }
        }

        if (Schema::hasTable('enquiries')
            && Schema::hasColumn('enquiries', 'company_id')
            && Schema::hasColumn('enquiries', 'stage')
            && !Schema::hasIndex('enquiries', 'enquiries_company_id_stage_index')
        ) {
            Schema::table('enquiries', function (Blueprint $table) {
                $table->index(['company_id', 'stage'], 'enquiries_company_id_stage_index');
            });
        }
    }

    public function down(): void
    {
        foreach (self::SINGLE_COLUMN_TABLES as $tableName) {
            $indexName = "{$tableName}_company_id_index";

            if (Schema::hasTable($tableName) && Schema::hasIndex($tableName, $indexName)) {
                Schema::table($tableName, function (Blueprint $table) use ($indexName) {
                    $table->dropIndex($indexName);
                });
            }
        }

        if (Schema::hasTable('enquiries') && Schema::hasIndex('enquiries', 'enquiries_company_id_stage_index')) {
            Schema::table('enquiries', function (Blueprint $table) {
                $table->dropIndex('enquiries_company_id_stage_index');
            });
        }
    }
};
