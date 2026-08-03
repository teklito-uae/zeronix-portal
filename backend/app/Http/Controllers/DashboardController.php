<?php

namespace App\Http\Controllers;

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
    public function index(Request $request, \App\Services\DashboardService $dashboardService)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            $isTeamScope = in_array($user->role, ['admin', 'super_admin', 'manager'], true);

            return response()->json([
                'stats' => $dashboardService->getStats($user),
                'chart_data' => $dashboardService->getChartData($user),
                'daily_revenue' => $dashboardService->getDailyRevenue($user),
                'daily_activity' => $dashboardService->getDailyActivity($user),
                'recent_enquiries' => $dashboardService->getRecentEnquiries($user),
                'recent_invoices' => $dashboardService->getRecentInvoices($user),
                'recent_activities' => $dashboardService->getRecentActivities($user),
                'user_stats' => $dashboardService->getUserPerformance($user),
                'sales_stats' => $isTeamScope ? null : $dashboardService->getSalesmanStats($user),
                'leaderboard' => $isTeamScope ? null : $dashboardService->getLeaderboard($user),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Dashboard Error',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }
}
