<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Deals-module rebuild — adds a `position` column to `enquiries` (the table
 * backing the `Deal` model) so Kanban columns can maintain a stable,
 * user-controlled ordering within each `(company_id, stage)` group,
 * independent of `created_at`. Backfilled in the following migration.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enquiries', function (Blueprint $table) {
            $table->unsignedInteger('position')->default(0)->after('stage');
        });
    }

    public function down(): void
    {
        Schema::table('enquiries', function (Blueprint $table) {
            $table->dropColumn('position');
        });
    }
};
