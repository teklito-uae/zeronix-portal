<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Release B1 — additive, zero-risk pipeline fields on `enquiries`.
 *
 * `enquiries` is not renamed in this release (that happens in Release C, after
 * old `deals` rows are merged in by B3 and FKs are repointed by B4). All new
 * columns here are nullable or safely defaulted; `stage` defaults to 'new' as
 * a placeholder because B2 immediately overwrites every existing row's stage
 * based on its current `status`, so the default is never meaningfully "seen".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enquiries', function (Blueprint $table) {
            $table->string('title')->nullable()->after('cancelled_at');
            $table->decimal('value', 12, 2)->default(0)->after('title');
            $table->string('stage')->nullable()->default('new')->after('value');
            $table->date('expected_close_date')->nullable()->after('stage');
            $table->timestamp('closed_at')->nullable()->after('expected_close_date');
            $table->string('lost_reason')->nullable()->after('closed_at');
            $table->text('lost_notes')->nullable()->after('lost_reason');
            $table->unsignedTinyInteger('probability')->default(50)->after('lost_notes');
            // No unique index yet — deal_code isn't backfilled until B2, and a
            // unique index over not-yet-distinct NULL/duplicate values would be
            // premature here. B2 adds the unique index once every row has a
            // distinct code.
            $table->string('deal_code')->nullable()->after('probability');
            $table->timestamp('next_action_at')->nullable()->after('deal_code');
            $table->text('next_action_note')->nullable()->after('next_action_at');
        });
    }

    public function down(): void
    {
        Schema::table('enquiries', function (Blueprint $table) {
            $table->dropColumn([
                'title',
                'value',
                'stage',
                'expected_close_date',
                'closed_at',
                'lost_reason',
                'lost_notes',
                'probability',
                'deal_code',
                'next_action_at',
                'next_action_note',
            ]);
        });
    }
};
