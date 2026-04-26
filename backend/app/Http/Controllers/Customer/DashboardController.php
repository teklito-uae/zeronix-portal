<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Enquiry;
use App\Models\Quote;
use App\Models\Invoice;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $customerId = $request->user()->id;

        $stats = [
            'enquiries_count' => Enquiry::where('customer_id', $customerId)->count(),
            'quotes_count' => Quote::where('customer_id', $customerId)->count(),
            'invoices_count' => Invoice::where('customer_id', $customerId)->count(),
            'total_spent' => Invoice::where('customer_id', $customerId)
                ->where('status', 'paid')
                ->sum('total'),
        ];

        // Chart data: Enquiries & Quotes by Month
        $chartData = DB::table('enquiries')
            ->select(DB::raw('DATE_FORMAT(created_at, "%b") as month'), DB::raw('count(*) as count'))
            ->where('customer_id', $customerId)
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupBy('month')
            ->get();

        $quoteData = DB::table('quotes')
            ->select(DB::raw('DATE_FORMAT(created_at, "%b") as month'), DB::raw('count(*) as count'))
            ->where('customer_id', $customerId)
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupBy('month')
            ->get();

        return response()->json([
            'stats' => $stats,
            'charts' => [
                'enquiries' => $chartData,
                'quotes' => $quoteData
            ],
            'recent_enquiries' => Enquiry::where('customer_id', $customerId)
                ->latest()
                ->limit(5)
                ->get(),
            'recent_invoices' => Invoice::where('customer_id', $customerId)
                ->latest()
                ->limit(5)
                ->get(),
            'recent_activity' => ActivityLog::where('customer_id', $customerId)
                ->latest()
                ->limit(10)
                ->get()
        ]);
    }
}
