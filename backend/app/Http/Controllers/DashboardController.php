<?php

namespace App\Http\Controllers;

use App\Models\Enquiry;
use App\Models\Quote;
use App\Models\Invoice;
use App\Models\Customer;
use App\Models\Product;
use App\Models\PaymentReceipt;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $stats = [
            'total_enquiries' => Enquiry::count(),
            'pending_quotes' => Quote::whereIn('status', ['draft', 'sent'])->count(),
            'active_customers' => Customer::count(),
            'total_products' => Product::count(),
            'total_users' => User::count(),
            'active_users' => User::where('is_active', true)->count(),
            'total_bank_received' => (float) PaymentReceipt::where('payment_method', 'bank')->sum('amount'),
            'total_cash_received' => (float) PaymentReceipt::where('payment_method', 'cash')->sum('amount'),
            'total_invoiced' => (float) Invoice::sum('total'),
            'total_paid' => (float) PaymentReceipt::sum('amount'),
            'total_quotes' => Quote::count(),
            'total_invoices' => Invoice::count(),
        ];

        // Chart Data (Last 6 Months)
        $chartData = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $start = $date->copy()->startOfMonth();
            $end = $date->copy()->endOfMonth();

            $chartData[] = [
                'name' => $date->format('M'),
                'enquiries' => Enquiry::whereBetween('created_at', [$start, $end])->count(),
                'quotes' => Quote::whereBetween('created_at', [$start, $end])->count(),
                'invoices' => Invoice::whereBetween('created_at', [$start, $end])->count(),
                'revenue' => (float) PaymentReceipt::whereBetween('payment_date', [$start, $end])->sum('amount'),
            ];
        }

        // Daily Revenue (Last 30 Days)
        $dailyRevenue = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $start = $date->copy()->startOfDay();
            $end = $date->copy()->endOfDay();

            $dailyRevenue[] = [
                'date' => $date->toDateString(),
                'bank' => (float) PaymentReceipt::where('payment_method', 'bank')->whereBetween('payment_date', [$start, $end])->sum('amount'),
                'cash' => (float) PaymentReceipt::where('payment_method', 'cash')->whereBetween('payment_date', [$start, $end])->sum('amount'),
            ];
        }

        // Daily Activity (Current Month)
        $dailyActivity = [];
        $daysInMonth = Carbon::now()->daysInMonth;
        for ($i = 1; $i <= $daysInMonth; $i++) {
            $date = Carbon::now()->day($i);
            // Don't show future days in the chart if today is not the end of month
            if ($date->isFuture() && !$date->isToday()) {
                // optional: break or continue
            }
            
            $start = $date->copy()->startOfDay();
            $end = $date->copy()->endOfDay();

            $dailyActivity[] = [
                'day' => $i,
                'name' => $date->format('d M'),
                'enquiries' => Enquiry::whereBetween('created_at', [$start, $end])->count(),
                'quotes' => Quote::whereBetween('created_at', [$start, $end])->count(),
                'invoices' => Invoice::whereBetween('created_at', [$start, $end])->count(),
            ];
        }

        // Recent Activity
        $recentEnquiries = Enquiry::with(['customer', 'user'])->latest()->take(5)->get();
        $recentInvoices = Invoice::with('customer')->latest()->take(5)->get();

        // Recent Activity Logs
        $recentActivities = [];
        if (class_exists(ActivityLog::class)) {
            try {
                $recentActivities = ActivityLog::with('user')
                    ->latest()
                    ->take(10)
                    ->get()
                    ->map(function ($log) {
                        return [
                            'id' => $log->id,
                            'user_name' => $log->user?->name ?? 'System',
                            'action' => $log->action,
                            'model' => $log->model_type ? class_basename($log->model_type) : null,
                            'model_id' => $log->model_id,
                            'description' => $log->description ?? ($log->action . ' ' . (class_basename($log->model_type ?? '') ?: '')),
                            'created_at' => $log->created_at,
                        ];
                    });
            } catch (\Exception $e) {
                $recentActivities = [];
            }
        }

        // User performance
        $userStats = User::select('id', 'name', 'email', 'role')
            ->withCount(['enquiries', 'quotes', 'invoices'])
            ->where('is_active', true)
            ->take(10)
            ->get();

        return response()->json([
            'stats' => $stats,
            'chart_data' => $chartData,
            'daily_revenue' => $dailyRevenue,
            'daily_activity' => $dailyActivity,
            'recent_enquiries' => $recentEnquiries,
            'recent_invoices' => $recentInvoices,
            'recent_activities' => $recentActivities,
            'user_stats' => $userStats,
        ]);
    }
}
