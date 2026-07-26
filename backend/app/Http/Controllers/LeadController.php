<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\CustomerContact;
use App\Models\Lead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeadController extends Controller
{
    private const STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost', 'unresponsive'];

    public function index(Request $request)
    {
        $query = Lead::with('owner')->withCount('deals');

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

        if ($request->filled('source') && $request->source !== 'all') {
            $query->where('source', $request->source);
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
            'phone_2' => 'nullable|string|max:50',
            'source' => 'nullable|string',
            'status' => 'nullable|string|in:' . implode(',', self::STATUSES),
            'notes' => 'nullable|string',
            'user_id' => 'nullable|exists:users,id',
        ]);

        $validated['user_id'] = $validated['user_id'] ?? $request->user()->id ?? null;

        $lead = Lead::create($validated);

        return response()->json($lead->load('owner'), 201);
    }

    public function show(Request $request, Lead $lead)
    {
        $this->authorize('view', $lead);

        return response()->json($lead->load(['owner', 'convertedCustomer', 'deals']));
    }

    public function update(Request $request, Lead $lead)
    {
        $this->authorize('update', $lead);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'company' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255|unique:leads,email,' . $lead->id,
            'phone' => 'nullable|string|max:50',
            'phone_2' => 'nullable|string|max:50',
            'source' => 'nullable|string',
            'status' => 'nullable|string|in:' . implode(',', self::STATUSES),
            'notes' => 'nullable|string',
            'user_id' => 'nullable|exists:users,id',
        ]);

        $lead->update($validated);

        return response()->json($lead->load('owner'));
    }

    public function destroy(Request $request, Lead $lead)
    {
        $this->authorize('delete', $lead);

        $lead->delete();
        return response()->json(['message' => 'Lead deleted']);
    }

    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:leads,id',
            'user_id' => 'nullable|exists:users,id',
            'status' => 'nullable|string|in:' . implode(',', self::STATUSES),
        ]);

        $updateData = array_filter([
            'user_id' => $validated['user_id'] ?? null,
            'status' => $validated['status'] ?? null,
        ], fn ($val) => !is_null($val));

        if (empty($updateData)) {
            return response()->json(['message' => 'No update data provided'], 400);
        }

        Lead::whereIn('id', $validated['ids'])->update($updateData);

        return response()->json(['message' => 'Leads updated successfully']);
    }

    public function convert(Request $request, Lead $lead)
    {
        $this->authorize('update', $lead);

        if ($lead->status === 'converted') {
            return response()->json(['message' => 'Lead has already been converted.'], 422);
        }

        DB::beginTransaction();
        try {
            // Dedup in priority order, so the same business doesn't end up split
            // across two customer records:
            //   (a) exact email match (email is globally unique on customers)
            //   (b) exact phone match
            //   (c) case-insensitive company name match, combined with a phone
            //       match — company name alone is too ambiguous to key off of.
            $customer = $lead->email
                ? Customer::where('email', $lead->email)->first()
                : null;

            if (!$customer && !empty($lead->phone)) {
                $customer = Customer::where('phone', $lead->phone)->first();
            }

            if (!$customer && !empty($lead->company) && !empty($lead->phone)) {
                $customer = Customer::whereRaw('LOWER(company) = ?', [strtolower($lead->company)])
                    ->where('phone', $lead->phone)
                    ->first();
            }

            if (!$customer) {
                $customer = Customer::create([
                    'name' => $lead->name,
                    'company' => $lead->company,
                    'email' => $lead->email,
                    'phone' => $lead->phone,
                ]);
            }

            $hasContact = $lead->email
                ? CustomerContact::where('customer_id', $customer->id)->where('email', $lead->email)->exists()
                : false;

            if (!$hasContact) {
                CustomerContact::create([
                    'customer_id' => $customer->id,
                    'first_name' => $lead->name,
                    'email' => $lead->email,
                    'phone' => $lead->phone,
                    'is_primary' => !CustomerContact::where('customer_id', $customer->id)->exists(),
                    'is_active' => true,
                ]);
            }

            $lead->update([
                'status' => 'converted',
                'converted_customer_id' => $customer->id,
                'converted_at' => now(),
            ]);

            // Only customer_id is touched here — lead_id is intentionally preserved on
            // these deals for historical reporting (the lead is never deleted).
            $lead->deals()->update(['customer_id' => $customer->id]);

            // Assign both the lead's original owner and the converting user to the
            // resulting customer, so the person who just converted it (and whoever
            // it was originally owned by) can actually see it afterwards.
            $assigneeIds = collect([$lead->user_id, $request->user()->id])
                ->filter()
                ->unique()
                ->values()
                ->all();

            if (!empty($assigneeIds)) {
                $customer->assigned_users()->syncWithoutDetaching($assigneeIds);
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to convert lead', 'error' => $e->getMessage()], 500);
        }

        return response()->json([
            'lead' => $lead->fresh(['owner', 'convertedCustomer']),
            'customer' => $customer,
        ]);
    }
}
