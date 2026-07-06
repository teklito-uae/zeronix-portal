<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\CustomerContact;
use App\Models\Lead;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    private const STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost', 'unresponsive'];

    public function index(Request $request)
    {
        $query = Lead::with('owner')->withCount('enquiries');

        $query->forUser($request->user());

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('company', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%")
                    ->orWhere('lead_code', 'like', "%{$s}%");
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $leads = $query->latest()->paginate($request->get('per_page', config('zeronix.default_per_page', 15)));

        return response()->json([
            'data' => $leads->items(),
            'total' => $leads->total(),
            'current_page' => $leads->currentPage(),
            'last_page' => $leads->lastPage(),
            'per_page' => $leads->perPage(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'company' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255|unique:leads,email',
            'phone' => 'nullable|string|max:50',
            'source' => 'nullable|string',
            'status' => 'nullable|string|in:' . implode(',', self::STATUSES),
            'notes' => 'nullable|string',
        ]);

        $validated['user_id'] = $request->user()->id ?? null;

        $lead = Lead::create($validated);

        return response()->json($lead->load('owner'), 201);
    }

    public function show(Request $request, Lead $lead)
    {
        return response()->json($lead->load(['owner', 'convertedCustomer', 'enquiries']));
    }

    public function update(Request $request, Lead $lead)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'company' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255|unique:leads,email,' . $lead->id,
            'phone' => 'nullable|string|max:50',
            'source' => 'nullable|string',
            'status' => 'nullable|string|in:' . implode(',', self::STATUSES),
            'notes' => 'nullable|string',
        ]);

        $lead->update($validated);

        return response()->json($lead->load('owner'));
    }

    public function destroy(Request $request, Lead $lead)
    {
        $lead->delete();
        return response()->json(['message' => 'Lead deleted']);
    }

    public function convert(Request $request, Lead $lead)
    {
        if ($lead->status === 'converted') {
            return response()->json(['message' => 'Lead has already been converted.'], 422);
        }

        $customer = Customer::create([
            'name' => $lead->name,
            'company' => $lead->company,
            'email' => $lead->email,
            'phone' => $lead->phone,
        ]);

        CustomerContact::create([
            'customer_id' => $customer->id,
            'first_name' => $lead->name,
            'email' => $lead->email,
            'phone' => $lead->phone,
            'is_primary' => true,
            'is_active' => true,
        ]);

        $lead->update([
            'status' => 'converted',
            'converted_customer_id' => $customer->id,
            'converted_at' => now(),
        ]);

        // Only customer_id is touched here — lead_id is intentionally preserved on
        // these enquiries for historical reporting (the lead is never deleted).
        $lead->enquiries()->update(['customer_id' => $customer->id]);

        return response()->json([
            'lead' => $lead->fresh(['owner', 'convertedCustomer']),
            'customer' => $customer,
        ]);
    }
}
