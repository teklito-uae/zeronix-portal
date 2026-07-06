<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::with(['assigned_users', 'labels'])->withCount(['quotes', 'invoices', 'enquiries']);

        // Outstanding balance: sum of (invoice total - amount already received) across
        // this customer's unsettled invoices, computed in one correlated subquery per
        // page load rather than N+1'ing Invoice::balance across every row.
        $paidPerInvoice = DB::table('payment_receipts')
            ->selectRaw('invoice_id, SUM(amount) as paid')
            ->groupBy('invoice_id');

        $balanceSub = DB::table('invoices as inv')
            ->leftJoinSub($paidPerInvoice, 'pr', 'pr.invoice_id', '=', 'inv.id')
            ->selectRaw('COALESCE(SUM(inv.total - COALESCE(pr.paid, 0)), 0)')
            ->whereColumn('inv.customer_id', 'customers.id')
            ->whereNotIn('inv.status', ['paid', 'cancelled']);

        $overdueSub = DB::table('invoices as inv2')
            ->selectRaw('COUNT(*)')
            ->whereColumn('inv2.customer_id', 'customers.id')
            ->whereNotIn('inv2.status', ['paid', 'cancelled'])
            ->whereNotNull('inv2.due_date')
            ->where('inv2.due_date', '<', now());

        $query->addSelect([
            'outstanding_balance' => $balanceSub,
            'overdue_invoices_count' => $overdueSub,
        ]);

        // Data Scoping
        $query->forUser($request->user());

        if ($request->filled('search')) {
            $s = $request->get('search');
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('company', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%")
                  ->orWhere('phone', 'like', "%{$s}%")
                  ->orWhere('trn', 'like', "%{$s}%")
                  ->orWhere('customer_code', 'like', "%{$s}%");
            });
        }

        // Filter by label
        if ($request->filled('label_id')) {
            $query->whereHas('labels', fn($q) => $q->where('customer_labels.id', $request->get('label_id')));
        }

        $customers = $query->latest()->paginate($request->get('per_page', config('zeronix.default_per_page', 15)));

        return response()->json([
            'data'         => $customers->items(),
            'total'        => $customers->total(),
            'current_page' => $customers->currentPage(),
            'last_page'    => $customers->lastPage(),
            'per_page'     => $customers->perPage(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'company'          => 'nullable|string|max:255',
            'email'            => 'nullable|email|max:255|unique:customers,email',
            'phone'            => 'nullable|string|max:50',
            'address'          => 'nullable|string',
            'trn'              => 'nullable|string|max:50',
            'password'         => 'nullable|string|min:6',
            'is_portal_active' => 'nullable|boolean',
            'user_ids'         => 'nullable|array',
            'user_ids.*'       => 'exists:users,id',
            'label_ids'        => 'nullable|array',
            'label_ids.*'      => 'exists:customer_labels,id',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            $validated['password'] = Hash::make('zeronix@123');
        }

        $userIds = $request->input('user_ids');
        if (is_null($userIds) || empty($userIds)) {
            $userIds = [$request->user()->id];
        }
        unset($validated['user_ids']);

        $labelIds = $validated['label_ids'] ?? [];
        unset($validated['label_ids']);

        $customer = Customer::create($validated);

        if ($userIds) {
            $customer->assigned_users()->attach($userIds);
        }

        if ($labelIds) {
            $customer->labels()->attach($labelIds);
        }

        return response()->json($customer->load(['assigned_users', 'labels']), 201);
    }

    public function show(Request $request, Customer $customer)
    {
        $this->authorize('view', $customer);

        $customer->loadCount(['quotes', 'invoices', 'enquiries']);
        $customer->total_volume = (float) $customer->invoices()->sum('total');

        return response()->json([
            'customer' => $customer,
            'enquiries' => $customer->enquiries()->with('items')->latest()->limit(10)->get(),
            'quotes' => $customer->quotes()->with('items')->latest()->limit(10)->get(),
            'invoices' => $customer->invoices()->with('items')->latest()->limit(10)->get(),
        ]);
    }

    public function update(Request $request, Customer $customer)
    {
        $this->authorize('update', $customer);

        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'company'          => 'nullable|string|max:255',
            'email'            => 'nullable|email|max:255|unique:customers,email,' . $customer->id,
            'phone'            => 'nullable|string|max:50',
            'address'          => 'nullable|string',
            'trn'              => 'nullable|string|max:50',
            'is_portal_active' => 'nullable|boolean',
            'user_ids'         => 'nullable|array',
            'user_ids.*'       => 'exists:users,id',
            'label_ids'        => 'nullable|array',
            'label_ids.*'      => 'exists:customer_labels,id',
        ]);

        $labelIds = $validated['label_ids'] ?? null;
        unset($validated['label_ids']);
        
        $userIds = $request->input('user_ids');
        unset($validated['user_ids']);

        $oldUserIds = $customer->assigned_users()->pluck('users.id')->toArray();
        $customer->update($validated);

        if (!is_null($labelIds)) {
            $customer->labels()->sync($labelIds);
        }

        if (!is_null($userIds)) {
            $customer->assigned_users()->sync($userIds);

            // Notify newly assigned staff
            $newUsers = array_diff($userIds, $oldUserIds);
            if (!empty($newUsers)) {
                $staffMembers = \App\Models\User::whereIn('id', $newUsers)->get();
                foreach ($staffMembers as $staff) {
                    $staff->notify(new \App\Notifications\SystemNotification([
                        'title'      => 'New Customer Assigned',
                        'message'    => "You have been assigned to customer: {$customer->name} ({$customer->company})",
                        'type'       => 'info',
                        'action_url' => "/staff/customers/{$customer->id}"
                    ]));
                }
            }
        }

        return response()->json($customer->load(['assigned_users', 'labels']));
    }

    public function destroy(Request $request, Customer $customer)
    {
        $this->authorize('delete', $customer);
        $customer->delete();
        return response()->json(['message' => 'Customer deleted']);
    }

    public function registerPortal(Request $request, Customer $customer)
    {
        if (!$customer->email) {
            return response()->json(['message' => 'Customer must have an email address.'], 422);
        }

        $password = \Illuminate\Support\Str::random(10);
        $customer->update([
            'password' => \Illuminate\Support\Facades\Hash::make($password),
            'is_portal_active' => true
        ]);

        try {
            \App\Services\MailConfigService::applyUserSmtp($request->user());
            \Illuminate\Support\Facades\Mail::to($customer->email)
                ->send(new \App\Mail\WelcomeCustomerMail($customer, $password));

            return response()->json(['message' => 'Customer registered and welcome email sent.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Registration successful but failed to send email.', 'error' => $e->getMessage()], 500);
        }
    }
}
