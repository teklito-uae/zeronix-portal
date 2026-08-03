<?php

namespace App\Services;

use App\Models\Deal;
use App\Models\Quote;
use App\Models\Invoice;
use App\Models\Customer;
use App\Models\Product;
use App\Models\PaymentReceipt;
use App\Models\User;
use App\Models\ActivityLog;
use App\Models\Lead;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class DashboardService
{
    public function getStats(User $user): array
    {
        $canSeeTeamStats = in_array($user->role, ['admin', 'super_admin', 'manager'], true);

        return [
            'total_enquiries' => Deal::forUser($user)->count(),
            'pending_quotes' => Quote::forUser($user)->whereIn('status', ['draft', 'sent'])->count(),
            'active_customers' => Customer::forUser($user)->count(),
            'total_products' => Product::count(),
            'total_users' => $canSeeTeamStats ? User::count() : null,
            'active_users' => $canSeeTeamStats ? User::where('is_active', true)->count() : null,
            'total_bank_received' => $this->getRevenueByMethod($user, 'bank'),
            'total_cash_received' => $this->getRevenueByMethod($user, 'cash'),
            'total_invoiced' => (float) Invoice::forUser($user)->sum('total'),
            'total_paid' => $this->getTotalPaid($user),
            'total_quotes' => Quote::forUser($user)->count(),
            'total_invoices' => Invoice::forUser($user)->count(),
            'paid_invoices_count' => Invoice::forUser($user)
                ->where('status', '!=', 'cancelled')
                ->whereRaw('total <= COALESCE((SELECT SUM(amount) FROM payment_receipts WHERE payment_receipts.invoice_id = invoices.id), 0)')
                ->count(),
            'converted_leads_count' => Deal::forUser($user)->has('quotes')->count(),
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
                'enquiries' => Deal::forUser($user)->whereBetween('created_at', [$start, $end])->count(),
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
                'enquiries' => Deal::forUser($user)->whereBetween('created_at', [$start, $end])->count(),
                'quotes' => Quote::forUser($user)->whereBetween('created_at', [$start, $end])->count(),
                'invoices' => Invoice::forUser($user)->whereBetween('created_at', [$start, $end])->count(),
            ];
        }
        return $dailyActivity;
    }

    public function getRecentEnquiries(User $user, int $limit = 5): Collection
    {
        return Deal::forUser($user)
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
        if (!in_array($user->role, ['admin', 'super_admin', 'manager'], true)) {
            return collect();
        }

        return User::select('id', 'name', 'email', 'role')
            ->withCount(['deals as enquiries_count', 'quotes', 'invoices'])
            ->where('is_active', true)
            ->take($limit)
            ->get();
    }

    protected function getRevenueByMethod(User $user, string $method, $start = null, $end = null): float
    {
        $query = PaymentReceipt::where('payment_method', $method);

        if (!in_array($user->role, ['admin', 'super_admin'], true)) {
            $query->whereHas('invoice', fn($iq) => $iq->forUser($user));
        }

        if ($start && $end) {
            $query->whereBetween('payment_date', [$start, $end]);
        }

        return (float) $query->sum('amount');
    }

    protected function getTotalPaid(User $user, $start = null, $end = null): float
    {
        $query = PaymentReceipt::query();

        if (!in_array($user->role, ['admin', 'super_admin'], true)) {
            $query->whereHas('invoice', fn($iq) => $iq->forUser($user));
        }

        if ($start && $end) {
            $query->whereBetween('payment_date', [$start, $end]);
        }

        return (float) $query->sum('amount');
    }

    /**
     * Day/month-scale activity numbers for an individual salesperson's own
     * pipeline — what they closed today, and what's moved this month.
     */
    public function getSalesmanStats(User $user): array
    {
        $todayStart = Carbon::today();
        $todayEnd = Carbon::tomorrow()->subSecond();
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd = Carbon::now()->endOfMonth();

        return [
            'invoices_today' => Invoice::forUser($user)->whereBetween('created_at', [$todayStart, $todayEnd])->count(),
            'invoice_value_today' => (float) Invoice::forUser($user)->whereBetween('created_at', [$todayStart, $todayEnd])->sum('total'),
            'quotes_this_month' => Quote::forUser($user)->whereBetween('created_at', [$monthStart, $monthEnd])->count(),
            'new_leads_today' => Lead::forUser($user)->whereBetween('created_at', [$todayStart, $todayEnd])->count(),
            'leads_converted_this_month' => Lead::forUser($user)
                ->whereNotNull('converted_at')
                ->whereBetween('converted_at', [$monthStart, $monthEnd])
                ->count(),
        ];
    }

    /**
     * Ranks active salespeople within the current tenant by invoice value
     * this month, to give team members a relative sense of standing. Scoped
     * to the tenant only (via Invoice's BelongsToCompany global scope) —
     * intentionally not per-user, since comparing to teammates is the point.
     */
    public function getLeaderboard(User $user, int $limit = 8): array
    {
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd = Carbon::now()->endOfMonth();

        $rows = Invoice::whereNotNull('user_id')
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->selectRaw('user_id, SUM(total) as total_value, COUNT(*) as invoice_count')
            ->groupBy('user_id')
            ->orderByDesc('total_value')
            ->get();

        $names = User::whereIn('id', $rows->pluck('user_id'))->pluck('name', 'id');

        $ranked = $rows->values()->map(function ($row, $index) use ($user, $names) {
            return [
                'rank' => $index + 1,
                'user_id' => (int) $row->user_id,
                'name' => $names[$row->user_id] ?? 'Unknown',
                'total_value' => (float) $row->total_value,
                'invoice_count' => (int) $row->invoice_count,
                'is_current_user' => (int) $row->user_id === (int) $user->id,
            ];
        });

        $top = $ranked->take($limit)->values();

        // Always let the viewer see their own standing, even outside the
        // top N — otherwise a mid-table rep just sees a list of strangers.
        $ownRow = $ranked->firstWhere('is_current_user', true);
        if ($ownRow && !$top->contains('user_id', $ownRow['user_id'])) {
            $top->push($ownRow);
        }

        return $top->all();
    }
}
