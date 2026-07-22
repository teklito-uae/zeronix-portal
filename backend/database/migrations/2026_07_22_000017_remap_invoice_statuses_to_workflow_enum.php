<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * `invoices.status` used to mix workflow state and payment state
 * (draft/posted/partially_paid/paid/overdue/cancelled). It's now workflow-only
 * (draft/sent/accepted/on_hold/cancelled); payment state is computed from
 * receipts via Invoice::getPaymentStatusAttribute(). Remap existing rows so
 * none are left holding a value no longer in the new enum.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('invoices')->where('status', 'posted')->update(['status' => 'sent']);
        DB::table('invoices')->whereIn('status', ['paid', 'partially_paid', 'overdue'])->update(['status' => 'accepted']);
    }

    public function down(): void
    {
        // Not reversible — the original paid/partially_paid/overdue/posted split
        // can't be reconstructed from workflow status alone.
    }
};
