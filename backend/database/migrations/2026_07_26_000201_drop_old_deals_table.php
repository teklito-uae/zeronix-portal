<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Release C — drop the old `deals` table now that every row has been merged
 * into `enquiries` (Release B, migration 2026_07_26_000103) and the PHP-level
 * Enquiry -> Deal rename has landed (this release). Guarded by a safety
 * assertion so this refuses to run if any `deals` row's `deal_code` has no
 * matching row in `enquiries` — i.e. if the merge didn't actually cover
 * every row for some reason, this bails out instead of silently discarding
 * data.
 *
 * NOT RUN as part of this change — left for manual review/execution.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('deals')) {
            return;
        }

        $unmigratedCount = DB::table('deals')
            ->whereNotIn('deal_code', DB::table('enquiries')->pluck('deal_code'))
            ->count();

        if ($unmigratedCount > 0) {
            throw new \RuntimeException(
                "Refusing to drop `deals`: {$unmigratedCount} row(s) have a deal_code with no matching row in `enquiries`. " .
                "The Release B merge (migration 2026_07_26_000103_merge_deals_into_enquiries) must fully cover every `deals` row before this table can be dropped safely."
            );
        }

        Schema::dropIfExists('deals');
    }

    public function down(): void
    {
        // Intentional no-op, same rationale as the Release B merge
        // migration's down(): the old `deals` table's rows already live on
        // in `enquiries` (see 2026_07_26_000103_merge_deals_into_enquiries),
        // so recreating the old, now-abandoned `deals` table shape here
        // would be misleading rather than a genuine restore.
    }
};
