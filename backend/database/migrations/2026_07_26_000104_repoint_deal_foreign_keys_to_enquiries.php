<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Release B4 — repoint `deal_activities.deal_id`, `quotes.deal_id`, and
 * `invoices.deal_id` off `deals.id` and onto `enquiries.id`.
 *
 * Must run after B3, since by then every value in these columns already
 * points at a valid `enquiries.id` (either an already-existing enquiry that
 * a `deals` row's `deal_code` matched, or a freshly-inserted one).
 *
 * Environment note (verified against the live dev DB — flagged in the final
 * report): every table in this database, including `deal_activities`,
 * `quotes`, `invoices`, `enquiries`, and `deals`, uses the MyISAM storage
 * engine, not InnoDB. MyISAM does not support foreign keys at all — MySQL
 * silently accepts `FOREIGN KEY` clauses on MyISAM tables at CREATE/ALTER
 * time but never enforces or records them (confirmed: information_schema
 * shows zero real FK constraints anywhere in this database today, despite
 * several tables' migrations declaring `constrained()`/`cascadeOnDelete()`).
 * So on this database, `dropForeign()` on a name that was never actually
 * registered would raise a "check that column/key exists" SQL error if we
 * called it unconditionally. This migration therefore checks
 * information_schema for a real constraint before attempting to drop it, and
 * always (re)adds the new constraint afterward — which is a harmless no-op
 * under MyISAM today but becomes a real, enforced constraint if this
 * database (or a production copy) is ever run on InnoDB.
 */
return new class extends Migration
{
    /**
     * [table => [column, onDeleteBehavior]]
     */
    private const REPOINTS = [
        'deal_activities' => ['deal_id', 'cascade'],
        'quotes' => ['deal_id', 'null'],
        'invoices' => ['deal_id', 'null'],
    ];

    public function up(): void
    {
        foreach (self::REPOINTS as $table => [$column, $onDelete]) {
            $this->dropExistingForeignKeys($table, $column);

            Schema::table($table, function (Blueprint $blueprint) use ($column, $onDelete) {
                $fk = $blueprint->foreign($column)->references('id')->on('enquiries');
                $onDelete === 'cascade' ? $fk->cascadeOnDelete() : $fk->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        foreach (self::REPOINTS as $table => [$column, $onDelete]) {
            $this->dropExistingForeignKeys($table, $column);

            Schema::table($table, function (Blueprint $blueprint) use ($column, $onDelete) {
                $fk = $blueprint->foreign($column)->references('id')->on('deals');
                $onDelete === 'cascade' ? $fk->cascadeOnDelete() : $fk->nullOnDelete();
            });
        }
    }

    /**
     * Drop any foreign key constraint that currently exists on $table.$column,
     * regardless of what it's named or what it references. No-op if none is
     * actually registered (e.g. under MyISAM).
     */
    private function dropExistingForeignKeys(string $table, string $column): void
    {
        $constraints = DB::select(
            "SELECT DISTINCT kcu.CONSTRAINT_NAME
             FROM information_schema.KEY_COLUMN_USAGE kcu
             JOIN information_schema.TABLE_CONSTRAINTS tc
               ON tc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
              AND tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
              AND tc.TABLE_NAME = kcu.TABLE_NAME
             WHERE tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
               AND kcu.TABLE_SCHEMA = DATABASE()
               AND kcu.TABLE_NAME = ?
               AND kcu.COLUMN_NAME = ?",
            [$table, $column]
        );

        foreach ($constraints as $constraint) {
            Schema::table($table, function (Blueprint $blueprint) use ($constraint) {
                $blueprint->dropForeign($constraint->CONSTRAINT_NAME);
            });
        }
    }
};
