<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Release B7 — collapse `quotes.enquiry_id` into `quotes.deal_id`, then drop
 * the now-redundant `enquiry_id` column. Live data currently has 0 rows with
 * `enquiry_id` set, but the copy step is defensive in case that changes
 * before this runs, and is idempotent (`WHERE deal_id IS NULL AND
 * enquiry_id IS NOT NULL` matches nothing on a second run).
 *
 * See 2026_07_26_000104's docblock for why the FK drop is guarded by an
 * existence check rather than an unconditional dropForeign() — same
 * MyISAM-has-no-real-FKs situation applies here.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('quotes')
            ->whereNull('deal_id')
            ->whereNotNull('enquiry_id')
            ->update(['deal_id' => DB::raw('enquiry_id')]);

        $this->dropExistingForeignKeys('quotes', 'enquiry_id');

        if (Schema::hasColumn('quotes', 'enquiry_id')) {
            Schema::table('quotes', function (Blueprint $table) {
                $table->dropColumn('enquiry_id');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('quotes', 'enquiry_id')) {
            Schema::table('quotes', function (Blueprint $table) {
                $table->foreignId('enquiry_id')->nullable()->after('user_id')->constrained('enquiries')->nullOnDelete();
            });
        }

        // Values are not restored (the column was dropped, not just its FK);
        // this only brings the column itself back so the schema is
        // reversible, matching how the rest of this release documents
        // data-loss-adjacent down()s.
    }

    /**
     * Introspected through the schema builder rather than a MySQL-only
     * information_schema query so this also runs under SQLite (test suite).
     */
    private function dropExistingForeignKeys(string $table, string $column): void
    {
        foreach (Schema::getForeignKeys($table) as $foreignKey) {
            if (! in_array($column, $foreignKey['columns'], true)) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) use ($foreignKey, $column) {
                // MySQL reports a constraint name we can target precisely;
                // SQLite reports none and only supports dropping by column.
                $blueprint->dropForeign($foreignKey['name'] ?? [$column]);
            });
        }
    }
};
