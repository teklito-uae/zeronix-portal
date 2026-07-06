<?php

namespace App\Http\Controllers;

use App\Models\Enquiry;
use App\Models\Invoice;
use App\Models\Lead;
use App\Models\PaymentReceipt;
use App\Models\PurchaseBill;
use App\Models\Expense;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function sales(Request $request)
    {
        $query = Invoice::with(['customer', 'user'])->forUser($request->user());

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $totals = [
            'total_invoiced' => (float) (clone $query)->sum('total'),
            'count' => (clone $query)->count(),
        ];
        $totals['total_paid'] = (float) PaymentReceipt::whereIn(
            'invoice_id',
            (clone $query)->pluck('id')
        )->sum('amount');

        $invoices = $query->latest('date')->paginate($request->get('per_page', 20));

        return response()->json([
            'data' => $invoices->items(),
            'total' => $invoices->total(),
            'current_page' => $invoices->currentPage(),
            'last_page' => $invoices->lastPage(),
            'per_page' => $invoices->perPage(),
            'totals' => $totals,
        ]);
    }

    public function salesByStaff(Request $request)
    {
        $query = Invoice::query();

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        $rows = $query->selectRaw('user_id, COUNT(*) as invoice_count, SUM(total) as total_sales')
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            ->with('user:id,name')
            ->get()
            ->map(function ($row) {
                return [
                    'user_id' => $row->user_id,
                    'user_name' => $row->user->name ?? 'Unknown',
                    'invoice_count' => (int) $row->invoice_count,
                    'total_sales' => (float) $row->total_sales,
                ];
            });

        return response()->json($rows);
    }

    public function profitLoss(Request $request)
    {
        $from = $request->date_from;
        $to = $request->date_to;

        $revenueQuery = Invoice::query();
        $cogsQuery = PurchaseBill::query();
        $expensesQuery = Expense::query();

        if ($from) {
            $revenueQuery->whereDate('date', '>=', $from);
            $cogsQuery->whereDate('date', '>=', $from);
            $expensesQuery->whereDate('date', '>=', $from);
        }
        if ($to) {
            $revenueQuery->whereDate('date', '<=', $to);
            $cogsQuery->whereDate('date', '<=', $to);
            $expensesQuery->whereDate('date', '<=', $to);
        }

        $revenue = (float) $revenueQuery->sum('total');
        $cogs = (float) $cogsQuery->sum('total');
        $expenses = (float) $expensesQuery->sum('amount');

        return response()->json([
            'revenue' => $revenue,
            'cost_of_goods' => $cogs,
            'expenses' => $expenses,
            'gross_profit' => $revenue - $cogs,
            'net_profit' => $revenue - $cogs - $expenses,
            'period' => ['from' => $from, 'to' => $to],
        ]);
    }

    public function receivablesAging(Request $request)
    {
        $invoices = Invoice::forUser($request->user())
            ->whereIn('status', ['posted', 'partially_paid', 'overdue'])
            ->get();

        $buckets = [
            'current' => 0,
            '1_30' => 0,
            '31_60' => 0,
            '61_90' => 0,
            '90_plus' => 0,
        ];

        foreach ($invoices as $invoice) {
            if ($invoice->balance <= 0) {
                continue;
            }
            $reference = $invoice->due_date ?? $invoice->date;
            $daysOverdue = now()->diffInDays(\Illuminate\Support\Carbon::parse($reference), false) * -1;

            if ($daysOverdue <= 0) {
                $bucket = 'current';
            } elseif ($daysOverdue <= 30) {
                $bucket = '1_30';
            } elseif ($daysOverdue <= 60) {
                $bucket = '31_60';
            } elseif ($daysOverdue <= 90) {
                $bucket = '61_90';
            } else {
                $bucket = '90_plus';
            }

            $buckets[$bucket] += $invoice->balance;
        }

        return response()->json($buckets);
    }

    public function crmDashboard(Request $request)
    {
        $from = $request->date_from;
        $to = $request->date_to;

        $leadQuery = Lead::query();
        if ($from) $leadQuery->whereDate('created_at', '>=', $from);
        if ($to) $leadQuery->whereDate('created_at', '<=', $to);

        $leadsByStatus = (clone $leadQuery)->selectRaw('status, COUNT(*) as count')->groupBy('status')->pluck('count', 'status');
        $totalLeads = (clone $leadQuery)->count();
        $convertedLeads = (clone $leadQuery)->whereNotNull('converted_at')->count();

        $enquiryQuery = Enquiry::forUser($request->user());
        if ($from) $enquiryQuery->whereDate('created_at', '>=', $from);
        if ($to) $enquiryQuery->whereDate('created_at', '<=', $to);

        $enquiriesByStatus = (clone $enquiryQuery)->selectRaw('status, COUNT(*) as count')->groupBy('status')->pluck('count', 'status');

        $topCustomers = \App\Models\Customer::query()
            ->withSum(['invoices as total_invoiced'], 'total')
            ->orderByDesc('total_invoiced')
            ->limit(5)
            ->get(['id', 'name', 'company']);

        return response()->json([
            'leads_by_status' => $leadsByStatus,
            'total_leads' => $totalLeads,
            'converted_leads' => $convertedLeads,
            'conversion_rate' => $totalLeads > 0 ? round($convertedLeads / $totalLeads * 100, 1) : 0,
            'enquiries_by_status' => $enquiriesByStatus,
            'top_customers' => $topCustomers,
        ]);
    }

    public function enquiriesBySource(Request $request)
    {
        $rows = Enquiry::forUser($request->user())
            ->selectRaw('source, COUNT(*) as count')
            ->groupBy('source')
            ->get();

        return response()->json($rows);
    }

    public function pipelineSummary(Request $request)
    {
        return response()->json([
            'quotations' => \App\Models\Quote::forUser($request->user())->selectRaw('status, COUNT(*) as count, SUM(total) as total')->groupBy('status')->get(),
            'sales_orders' => \App\Models\SalesOrder::forUser($request->user())->selectRaw('status, COUNT(*) as count, SUM(total) as total')->groupBy('status')->get(),
            'deliveries' => \App\Models\Delivery::forUser($request->user())->selectRaw('status, COUNT(*) as count')->groupBy('status')->get(),
            'invoices' => Invoice::forUser($request->user())->selectRaw('status, COUNT(*) as count, SUM(total) as total')->groupBy('status')->get(),
        ]);
    }
}
