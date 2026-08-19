<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Release B2 — backfill `deal_code` and `stage` on every existing `enquiries`
 * row, then add a unique index on `deal_code`.
 *
 * Idempotent: guarded by `WHERE deal_code IS NULL`, so re-running only
 * touches rows that still need a code and is a no-op once every row has one.
 *
 * Collision safety: `deal_code` values assigned here must never collide with
 * codes already assigned to `deals` rows, because B3 merges those `deals`
 * rows into this same table (copying their `deal_code` verbatim). We load
 * every existing `deals.deal_code` up front into an O(1) lookup set, and also
 * seed that set with any `enquiries.deal_code` already assigned (defensive:
 * covers a prior partial run of this same migration), then track newly
 * assigned codes in the same in-memory set as we go.
 */
return new class extends Migration
{
    /**
     * status (on enquiries) => stage mapping.
     */
    private const STATUS_TO_STAGE = [
        'new' => 'new',
        'assigned' => 'new',
        'in_progress' => 'qualified',
        'quoted' => 'proposal_sent',
        'won' => 'won',
        'lost' => 'lost',
        'closed' => 'won',
        'cancelled' => 'cancelled',
    ];

    public function up(): void
    {
        $usedCodes = [];

        foreach (DB::table('deals')->pluck('deal_code') as $code) {
            $usedCodes[$code] = true;
        }

        foreach (DB::table('enquiries')->whereNotNull('deal_code')->pluck('deal_code') as $code) {
            $usedCodes[$code] = true;
        }

        $rows = DB::table('enquiries')
            ->whereNull('deal_code')
            ->orderBy('id')
            ->get(['id', 'status', 'created_at']);

        foreach ($rows as $row) {
            $status = $row->status;

            if (! array_key_exists($status, self::STATUS_TO_STAGE)) {
                Log::warning("Migration 2026_07_26_000102: enquiries.id={$row->id} has unmapped status '{$status}', defaulting stage to 'new'.");
                $stage = 'new';
            } else {
                $stage = self::STATUS_TO_STAGE[$status];
            }

            $createdAt = $row->created_at ? \Illuminate\Support\Carbon::parse($row->created_at) : now();
            $prefix = 'ZRNX-DL-' . $createdAt->format('Ymd') . '-';

            $sequence = 1;
            do {
                $candidate = $prefix . str_pad((string) $sequence, 3, '0', STR_PAD_LEFT);
                $sequence++;
            } while (isset($usedCodes[$candidate]));

            $usedCodes[$candidate] = true;

            DB::table('enquiries')->where('id', $row->id)->update([
                'deal_code' => $candidate,
                'stage' => $stage,
            ]);
        }

        // Safe now that every row has a distinct, non-null-or-duplicate value
        // among rows that have one; the column itself stays nullable for any
        // brand-new row inserted before Release C's model rename.
        if (! $this->indexExists('enquiries', 'enquiries_deal_code_unique')) {
            Schema::table('enquiries', function (Blueprint $table) {
                $table->unique('deal_code');
            });
        }
    }

    public function down(): void
    {
        if ($this->indexExists('enquiries', 'enquiries_deal_code_unique')) {
            Schema::table('enquiries', function (Blueprint $table) {
                $table->dropUnique('enquiries_deal_code_unique');
            });
        }

        // Data backfill itself is not reversed — clearing deal_code/stage
        // here would be destructive to rows that may since have been relied
        // upon (e.g. by B3's merge). Down() only drops the index.
    }

    /**
     * Uses the schema builder rather than a MySQL-only information_schema
     * query so this also runs under SQLite (used by the test suite).
     */
    private function indexExists(string $table, string $indexName): bool
    {
        foreach (Schema::getIndexes($table) as $index) {
            if ($index['name'] === $indexName) {
                return true;
            }
        }

        return false;
    }
};
