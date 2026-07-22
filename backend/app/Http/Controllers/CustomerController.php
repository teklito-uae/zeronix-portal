<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Customer;
use App\Models\CustomerContact;
use App\Models\Deal;
use App\Models\Enquiry;
use App\Models\Invoice;
use App\Models\Quote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::with(['assigned_users', 'labels'])->withCount(['quotes', 'invoices', 'enquiries', 'deals', 'contacts']);

        // Outstanding balance: sum of (invoice total - amount already received) across
        // this customer's unsettled invoices, computed in one correlated subquery per
        // page load rather than N+1'ing Invoice::balance across every row.
        $paidPerInvoice = fn () => DB::table('payment_receipts')
            ->selectRaw('invoice_id, SUM(amount) as paid')
            ->groupBy('invoice_id');

        // "Unsettled" is now balance-driven (total > paid) rather than keying off
        // a 'paid' status value, since payment state is computed, not stored.
        $balanceSub = DB::table('invoices as inv')
            ->leftJoinSub($paidPerInvoice(), 'pr', 'pr.invoice_id', '=', 'inv.id')
            ->selectRaw('COALESCE(SUM(GREATEST(inv.total - COALESCE(pr.paid, 0), 0)), 0)')
            ->whereColumn('inv.customer_id', 'customers.id')
            ->where('inv.status', '!=', 'cancelled');

        $overdueSub = DB::table('invoices as inv2')
            ->leftJoinSub($paidPerInvoice(), 'pr2', 'pr2.invoice_id', '=', 'inv2.id')
            ->selectRaw('COUNT(*)')
            ->whereColumn('inv2.customer_id', 'customers.id')
            ->where('inv2.status', '!=', 'cancelled')
            ->whereRaw('inv2.total > COALESCE(pr2.paid, 0)')
            ->whereNotNull('inv2.due_date')
            ->where('inv2.due_date', '<', now());

        $totalInvoicedSub = DB::table('invoices as inv3')
            ->selectRaw('COALESCE(SUM(inv3.total), 0)')
            ->whereColumn('inv3.customer_id', 'customers.id')
            ->where('inv3.status', '!=', 'cancelled');

        $query->addSelect([
            'outstanding_balance' => $balanceSub,
            'overdue_invoices_count' => $overdueSub,
            'total_invoiced' => $totalInvoicedSub,
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
            $labelIds = explode(',', $request->get('label_id'));
            $query->whereHas('labels', fn($q) => $q->whereIn('customer_labels.id', $labelIds));
        }

        if ($request->filled('user_id')) {
            $userIds = explode(',', $request->get('user_id'));
            $query->whereHas('assigned_users', fn($q) => $q->whereIn('users.id', $userIds));
        }

        if ($request->filled('industry')) {
            $industries = explode(',', $request->get('industry'));
            $query->whereIn('industry', $industries);
        }

        if ($request->filled('is_portal_active')) {
            $statuses = explode(',', $request->get('is_portal_active'));
            $bools = array_map(fn ($s) => $s === 'active', $statuses);
            $query->whereIn('is_portal_active', $bools);
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

    public function industries(Request $request)
    {
        $industries = Customer::forUser($request->user())
            ->whereNotNull('industry')
            ->where('industry', '!=', '')
            ->distinct()
            ->orderBy('industry')
            ->pluck('industry');

        return response()->json($industries);
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
            'industry'         => 'nullable|string|max:255',
            'website'          => 'nullable|string|max:255',
            'description'      => 'nullable|string',
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

        $customer->loadCount(['quotes', 'invoices', 'enquiries', 'deals', 'contacts']);
        $customer->load(['labels', 'assigned_users']);
        $customer->total_volume = (float) $customer->invoices()->sum('total');

        $openDeals = $customer->deals()->whereNotIn('stage', ['won', 'lost']);
        $customer->open_deals_count = (clone $openDeals)->count();
        $customer->open_deals_value = (float) (clone $openDeals)->sum('value');

        $openQuotes = $customer->quotes()->whereIn('status', ['draft', 'sent']);
        $customer->open_quotes_count = (clone $openQuotes)->count();
        $customer->open_quotes_value = (float) (clone $openQuotes)->sum('total');

        $openInvoices = $customer->invoices()
            ->where('status', '!=', 'cancelled')
            ->whereRaw('invoices.total > COALESCE((SELECT SUM(amount) FROM payment_receipts WHERE payment_receipts.invoice_id = invoices.id), 0)');
        $customer->open_invoices_count = (clone $openInvoices)->count();
        $customer->open_invoices_value = (float) (clone $openInvoices)->sum('total');

        $overdueInvoices = (clone $openInvoices)->whereNotNull('due_date')->where('due_date', '<', now());
        $customer->overdue_invoices_count = (clone $overdueInvoices)->count();
        $customer->overdue_invoices_value = (float) (clone $overdueInvoices)->sum('total');

        return response()->json([
            'customer' => $customer,
            'enquiries' => $customer->enquiries()->with('items')->latest()->limit(10)->get(),
            'quotes' => $customer->quotes()->with('items')->latest()->limit(10)->get(),
            'invoices' => $customer->invoices()->with('items')->latest()->limit(10)->get(),
            'deals' => $customer->deals()->with('user')->latest()->limit(10)->get(),
        ]);
    }

    /**
     * Unified activity feed for this customer: edits to the customer record itself,
     * plus activity logged against their quotes/invoices/deals/enquiries/contacts.
     */
    public function activities(Request $request, Customer $customer)
    {
        $this->authorize('view', $customer);

        $quoteIds = $customer->quotes()->pluck('id');
        $invoiceIds = $customer->invoices()->pluck('id');
        $dealIds = $customer->deals()->pluck('id');
        $enquiryIds = $customer->enquiries()->pluck('id');
        $contactIds = $customer->contacts()->pluck('id');

        $activities = ActivityLog::with('user')
            ->where(function ($q) use ($customer, $quoteIds, $invoiceIds, $dealIds, $enquiryIds, $contactIds) {
                $q->where(fn ($q2) => $q2->where('subject_type', Customer::class)->where('subject_id', $customer->id))
                  ->orWhere('customer_id', $customer->id)
                  ->orWhere(fn ($q2) => $q2->where('subject_type', Quote::class)->whereIn('subject_id', $quoteIds))
                  ->orWhere(fn ($q2) => $q2->where('subject_type', Invoice::class)->whereIn('subject_id', $invoiceIds))
                  ->orWhere(fn ($q2) => $q2->where('subject_type', Deal::class)->whereIn('subject_id', $dealIds))
                  ->orWhere(fn ($q2) => $q2->where('subject_type', Enquiry::class)->whereIn('subject_id', $enquiryIds))
                  ->orWhere(fn ($q2) => $q2->where('subject_type', CustomerContact::class)->whereIn('subject_id', $contactIds));
            })
            ->latest()
            ->limit(30)
            ->get();

        return response()->json($activities);
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
            'industry'         => 'nullable|string|max:255',
            'website'          => 'nullable|string|max:255',
            'description'      => 'nullable|string',
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
