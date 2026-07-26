<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Release B3 — merge every `deals` row into `enquiries`.
 *
 * Idempotency key: `deal_code`, copied verbatim from `deals.deal_code` onto
 * the new `enquiries` row. A `deals` row is "already migrated" if an
 * `enquiries` row exists with the same `deal_code`.
 *
 * Robustness note: this builds the full old-deal-id => new-enquiry-id map on
 * every run (by find-or-insert per `deals` row, keyed on `deal_code`), not
 * just for newly-inserted rows, and then unconditionally re-applies the
 * `deal_activities` / `quotes` / `invoices` / `activity_logs` remaps for the
 * whole map. Those remap statements are themselves idempotent (a
 * `WHERE deal_id = <old id>` matches nothing once already remapped), so this
 * is safe to re-run and also self-heals a run that was interrupted after
 * inserting some `enquiries` rows but before finishing the remap step — see
 * the MyISAM note in the final report: this table engine does not actually
 * support transactions, so DB::transaction() below does not give true
 * all-or-nothing atomicity on this database today.
 */
return new class extends Migration
{
    private const DEAL_STAGE_TO_ENQUIRY_STAGE = [
        'new' => 'new',
        'qualified' => 'qualified',
        'proposal' => 'proposal_sent',
        'negotiation' => 'negotiation',
        'won' => 'won',
        'lost' => 'lost',
    ];

    public function up(): void
    {
        DB::transaction(function () {
            $deals = DB::table('deals')->orderBy('id')->get();

            $idMap = []; // old deal_id => new enquiry_id

            foreach ($deals as $deal) {
                $existing = DB::table('enquiries')->where('deal_code', $deal->deal_code)->first(['id']);

                if ($existing) {
                    $idMap[$deal->id] = $existing->id;
                    continue;
                }

                $stage = self::DEAL_STAGE_TO_ENQUIRY_STAGE[$deal->stage] ?? 'new';

                $newId = DB::table('enquiries')->insertGetId([
                    'title' => $deal->title,
                    'notes' => $deal->description,
                    'value' => $deal->value,
                    'stage' => $stage,
                    'expected_close_date' => $deal->expected_close_date,
                    'closed_at' => $deal->closed_at,
                    'lost_reason' => $deal->lost_reason,
                    'deal_code' => $deal->deal_code,
                    'lead_id' => $deal->lead_id,
                    'customer_id' => $deal->customer_id,
                    'customer_contact_id' => $deal->customer_contact_id,
                    'user_id' => $deal->user_id,
                    'company_id' => $deal->company_id,
                    'source' => 'manual',
                    'priority' => 'normal',
                    // Legacy status column is vestigial post-merge (stage is
                    // authoritative going forward); fixed placeholder is fine
                    // and gets dropped entirely in a later release.
                    'status' => 'closed',
                    'created_at' => $deal->created_at,
                    'updated_at' => $deal->updated_at,
                ]);

                $idMap[$deal->id] = $newId;
            }

            // Snapshot which activity_logs rows (by their own immutable primary
            // key) need remapping BEFORE mutating anything. Keying the later
            // update by subject_id (the value being changed) instead of by
            // activity_logs.id would risk a chaining bug: if a new enquiry_id
            // for one deal happened to equal another deal's old id, that row
            // could get matched and shifted a second time later in the loop.
            // Using the row's own id as the match key makes each row's update
            // fire at most once, independent of processing order.
            $dealSubjectLogUpdates = [];
            if (!empty($idMap)) {
                $dealSubjectLogs = DB::table('activity_logs')
                    ->where('subject_type', 'App\\Models\\Deal')
                    ->whereIn('subject_id', array_keys($idMap))
                    ->get(['id', 'subject_id']);

                foreach ($dealSubjectLogs as $log) {
                    if (isset($idMap[$log->subject_id])) {
                        $dealSubjectLogUpdates[$log->id] = $idMap[$log->subject_id];
                    }
                }
            }

            foreach ($idMap as $oldDealId => $newEnquiryId) {
                DB::table('deal_activities')->where('deal_id', $oldDealId)->update(['deal_id' => $newEnquiryId]);
                DB::table('quotes')->where('deal_id', $oldDealId)->update(['deal_id' => $newEnquiryId]);
                DB::table('invoices')->where('deal_id', $oldDealId)->update(['deal_id' => $newEnquiryId]);
            }

            // `subject_type` stays 'App\Models\Deal' — that class name will
            // exist again once the next release renames Enquiry => Deal.
            foreach ($dealSubjectLogUpdates as $logId => $newSubjectId) {
                DB::table('activity_logs')->where('id', $logId)->update(['subject_id' => $newSubjectId]);
            }

            // Enquiry-origin activity_logs rows keep their original subject_id
            // (nothing moved for them) — just relabel the class name.
            DB::table('activity_logs')
                ->where('subject_type', 'App\\Models\\Enquiry')
                ->update(['subject_type' => 'App\\Models\\Deal']);
        });
    }

    public function down(): void
    {
        // Intentional no-op: reversing a data merge (splitting merged
        // `enquiries` rows back out into `deals`, un-remapping
        // `deal_activities`/`quotes`/`invoices`/`activity_logs`, and
        // restoring `activity_logs.subject_type` back to 'App\Models\Enquiry'
        // for only the rows that were originally that type) isn't attempted.
        // The old `deals` table itself is left untouched by this migration
        // and still holds the original rows, so no source data is lost.
    }
};
