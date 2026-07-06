<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Data-only migration: collapse the drifting status/source value sets that had
     * accumulated on enquiries (delivered/won/invoiced) and leads (disqualified) into
     * the new canonical lists, so no row is left holding a now-invalid string.
     */
    public function up(): void
    {
        DB::table('enquiries')->where('status', 'delivered')->update(['status' => 'won']);
        DB::table('enquiries')->where('status', 'invoiced')->update(['status' => 'closed']);
        DB::table('enquiries')->where('source', 'portal_public')->update(['source' => 'website']);
        DB::table('enquiries')->where('source', 'portal')->update(['source' => 'manual']);

        DB::table('leads')->where('status', 'disqualified')->update(['status' => 'lost']);
    }

    public function down(): void
    {
        // Data normalization is not reversible to the original (ambiguous) values.
    }
};
