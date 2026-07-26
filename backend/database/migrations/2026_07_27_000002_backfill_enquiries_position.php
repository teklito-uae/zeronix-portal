<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Backfills the `position` column added in
 * 2026_07_27_000001_add_position_to_enquiries_table for every pre-existing
 * `enquiries` row. Within each `(company_id, stage)` group, rows are ordered
 * by `created_at` ascending and assigned positions spaced by 1000 (1000,
 * 2000, 3000, ...) so later inserts/moves can slot in between without a
 * full renumber.
 *
 * Streams rows ordered by `company_id, stage, created_at` in chunks (rather
 * than loading the whole table) and keeps a per-group running counter,
 * keyed by "{company_id}|{stage}", to know the next position to assign as
 * each chunk is processed.
 *
 * Not reversible — down() is a no-op.
 */
return new class extends Migration
{
    public function up(): void
    {
        $nextPosition = [];

        DB::table('enquiries')
            ->select(['id', 'company_id', 'stage'])
            ->orderBy('company_id')
            ->orderBy('stage')
            ->orderBy('created_at')
            ->chunkById(500, function ($rows) use (&$nextPosition) {
                foreach ($rows as $row) {
                    $key = $row->company_id . '|' . $row->stage;

                    if (!isset($nextPosition[$key])) {
                        $nextPosition[$key] = 1000;
                    }

                    DB::table('enquiries')
                        ->where('id', $row->id)
                        ->update(['position' => $nextPosition[$key]]);

                    $nextPosition[$key] += 1000;
                }
            });
    }

    public function down(): void
    {
        // Intentional no-op: this is a data backfill, not a reversible
        // schema change.
    }
};
