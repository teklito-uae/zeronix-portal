<?php

namespace App\Services;

use App\Models\Enquiry;
use App\Models\Quote;
use App\Models\Invoice;
use App\Models\Customer;
use App\Models\Product;
use App\Models\PaymentReceipt;
use App\Models\User;
use App\Models\ActivityLog;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class DashboardService
{
    public function getStats(User $user): array
    {
        return [
            'total_enquiries' => Enquiry::forUser($user)->count(),
            'pending_quotes' => Quote::forUser($user)->whereIn('status', ['draft', 'sent'])->count(),
            'active_customers' => Customer::forUser($user)->count(),
            'total_products' => Product::count(),
            'total_users' => User::count(),
            'active_users' => User::where('is_active', true)->count(),
            'total_bank_received' => $this->getRevenueByMethod($user, 'bank'),
            'total_cash_received' => $this->getRevenueByMethod($user, 'cash'),
            'total_invoiced' => (float) Invoice::forUser($user)->sum('total'),
            'total_paid' => $this->getTotalPaid($user),
            'total_quotes' => Quote::forUser($user)->count(),
            'total_invoices' => Invoice::forUser($user)->count(),
            'paid_invoices_count' => Invoice::forUser($user)->where('status', 'paid')->count(),
            'converted_leads_count' => Enquiry::forUser($user)->has('quotes')->count(),
        ];
    }

    public function getChartData(User $user): array
    {
        $chartData = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $start = $date->copy()->startOfMonth();
            $end = $date->copy()->endOfMonth();

            $chartData[] = [
                'name' => $date->format('M'),
                'enquiries' => Enquiry::forUser($user)->whereBetween('created_at', [$start, $end])->count(),
                'quotes' => Quote::forUser($user)->whereBetween('created_at', [$start, $end])->count(),
                'invoices' => Invoice::forUser($user)->whereBetween('created_at', [$start, $end])->count(),
                'revenue' => $this->getTotalPaid($user, $start, $end),
            ];
        }
        return $chartData;
    }

    public function getDailyRevenue(User $user): array
    {
        $dailyRevenue = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $start = $date->copy()->startOfDay();
            $end = $date->copy()->endOfDay();

            $dailyRevenue[] = [
                'date' => $date->toDateString(),
                'bank' => $this->getRevenueByMethod($user, 'bank', $start, $end),
                'cash' => $this->getRevenueByMethod($user, 'cash', $start, $end),
            ];
        }
        return $dailyRevenue;
    }

    public function getDailyActivity(User $user): array
    {
        $dailyActivity = [];
        $daysInMonth = Carbon::now()->daysInMonth;
        for ($i = 1; $i <= $daysInMonth; $i++) {
            $date = Carbon::now()->day($i);
            $start = $date->copy()->startOfDay();
            $end = $date->copy()->endOfDay();

            $dailyActivity[] = [
                'day' => $i,
                'name' => $date->format('d M'),
                'enquiries' => Enquiry::forUser($user)->whereBetween('created_at', [$start, $end])->count(),
                'quotes' => Quote::forUser($user)->whereBetween('created_at', [$start, $end])->count(),
                'invoices' => Invoice::forUser($user)->whereBetween('created_at', [$start, $end])->count(),
            ];
        }
        return $dailyActivity;
    }

    public function getRecentEnquiries(User $user, int $limit = 5): Collection
    {
        return Enquiry::forUser($user)
            ->with(['customer', 'user'])
            ->latest()
            ->take($limit)
            ->get();
    }

    public function getRecentInvoices(User $user, int $limit = 5): Collection
    {
        return Invoice::forUser($user)
            ->with('customer')
            ->latest()
            ->take($limit)
            ->get();
    }

    public function getRecentActivities(User $user, int $limit = 10): array
    {
        if (!class_exists(ActivityLog::class)) {
            return [];
        }

        return ActivityLog::forUser($user)
            ->with('user')
            ->latest()
            ->take($limit)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'user_name' => $log->user?->name ?? 'System',
                    'action' => $log->action,
                    'model' => $log->subject_type ? class_basename($log->subject_type) : null,
                    'model_id' => $log->subject_id,
                    'description' => $log->description ?? ($log->action . ' ' . (class_basename($log->subject_type ?? '') ?: '')),
                    'created_at' => $log->created_at,
                ];
            })->toArray();
    }

    public function getUserPerformance(User $user, int $limit = 10): Collection
    {
        if ($user->role === 'salesman') {
            return collect();
        }

        return User::select('id', 'name', 'email', 'role')
            ->withCount(['enquiries', 'quotes', 'invoices'])
            ->where('is_active', true)
            ->take($limit)
            ->get();
    }

    protected function getRevenueByMethod(User $user, string $method, $start = null, $end = null): float
    {
        $query = PaymentReceipt::where('payment_method', $method);
        
        if ($user->role === 'salesman') {
            $query->whereHas('invoice', fn($iq) => $iq->where('user_id', $user->id));
        }

        if ($start && $end) {
            $query->whereBetween('payment_date', [$start, $end]);
        }

        return (float) $query->sum('amount');
    }

    protected function getTotalPaid(User $user, $start = null, $end = null): float
    {
        $query = PaymentReceipt::query();
        
        if ($user->role === 'salesman') {
            $query->whereHas('invoice', fn($iq) => $iq->where('user_id', $user->id));
        }

        if ($start && $end) {
            $query->whereBetween('payment_date', [$start, $end]);
        }

        return (float) $query->sum('amount');
    }
}
