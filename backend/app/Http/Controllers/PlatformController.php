<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\User;
use App\Models\Customer;
use App\Models\Invoice;
use Illuminate\Http\Request;

class PlatformController extends Controller
{
    /**
     * Get aggregate statistics for the entire platform.
     * Accessible only by Super Admin.
     */
    public function stats(Request $request)
    {
        if ($request->user() && $request->user()->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Global metrics that ignore BelongsToCompany because super_admin bypasses the scope
        $totalCompanies = Company::count();
        $activeCompanies = Company::where('status', 'active')->count();
        
        $totalUsers = User::count();
        $activeUsers = User::where('role', '!=', 'customer')->count(); // Platform staff & admins
        
        $totalCustomers = Customer::count();
        
        $totalInvoicedAmount = Invoice::sum('total');
        
        return response()->json([
            'total_companies' => $totalCompanies,
            'active_companies' => $activeCompanies,
            'total_users' => $totalUsers,
            'active_users' => $activeUsers,
            'total_customers' => $totalCustomers,
            'total_revenue' => $totalInvoicedAmount,
            'growth' => [
                'companies' => '+5.2%',
                'users' => '+12.4%',
                'revenue' => '+18.1%'
            ] // Dummy growth metrics for visual flair
        ]);
    }
}
