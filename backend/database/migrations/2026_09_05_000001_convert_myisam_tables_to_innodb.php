<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Every table in this app was created on MyISAM (a historical MySQL
     * server/config default), which doesn't support foreign key constraints
     * or transactions at all — DB::beginTransaction()/rollBack() calls used
     * throughout the app (e.g. SbBroadcastController::store()) were silent
     * no-ops, so a failed multi-row import could leave partial data behind
     * instead of rolling back cleanly. This converts every existing MyISAM
     * table to InnoDB in place — a standard, non-destructive MySQL operation
     * that preserves all data and just changes how it's stored/locked.
     *
     * Query-driven rather than a fixed table list so this is safe to run
     * against any environment's actual current table set (dev/staging/prod)
     * without needing to be kept in sync with the schema by hand.
     */
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        $tables = DB::select(
            "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND ENGINE = 'MyISAM'"
        );

        foreach ($tables as $table) {
            DB::statement("ALTER TABLE `{$table->TABLE_NAME}` ENGINE=InnoDB");
        }
    }

    /**
     * Not reversible by design — going back to MyISAM would just
     * reintroduce the bug this migration exists to fix.
     */
    public function down(): void
    {
        //
    }
};
