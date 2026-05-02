<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::with(['assigned_user'])->withCount(['quotes', 'invoices', 'enquiries']);

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

        $customers = $query->latest()->paginate($request->get('per_page', config('zeronix.default_per_page', 15)));

        return response()->json([
            'data' => $customers->items(),
            'total' => $customers->total(),
            'current_page' => $customers->currentPage(),
            'last_page' => $customers->lastPage(),
            'per_page' => $customers->perPage(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'company' => 'nullable|string|max:255',
            'email' => 'required|email|unique:customers,email',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'trn' => 'nullable|string|max:50',
            'password' => 'nullable|string|min:6',
            'is_portal_active' => 'nullable|boolean',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            $validated['password'] = Hash::make('zeronix@123');
        }

        $validated['user_id'] = $request->user()->id;

        $customer = Customer::create($validated);

        return response()->json($customer->load('assigned_user'), 201);
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
            'name' => 'required|string|max:255',
            'company' => 'nullable|string|max:255',
            'email' => 'required|email|unique:customers,email,' . $customer->id,
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'trn' => 'nullable|string|max:50',
            'is_portal_active' => 'nullable|boolean',
            'user_id' => 'nullable|exists:users,id',
        ]);

        $oldUserId = $customer->user_id;
        $customer->update($validated);

        // Notify new staff if assignment changed
        if (isset($validated['user_id']) && $validated['user_id'] != $oldUserId) {
            $staff = \App\Models\User::find($validated['user_id']);
            if ($staff) {
                $staff->notify(new \App\Notifications\SystemNotification([
                    'title' => 'New Customer Assigned',
                    'message' => "You have been assigned to customer: {$customer->name} ({$customer->company})",
                    'type' => 'info',
                    'action_url' => "/staff/customers/{$customer->id}"
                ]));
            }
        }

        return response()->json($customer->load('assigned_user'));
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
