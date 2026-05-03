<?php

namespace App\Http\Controllers;

use App\Models\Enquiry;
use App\Models\EnquiryItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EnquiryController extends Controller
{
    public function index(Request $request)
    {
        $query = Enquiry::with(['customer', 'user', 'assignedUser'])->withCount('items');

        // Data Scoping
        $query->forUser($request->user());

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function($q) use ($s) {
                $q->whereHas('customer', function ($q2) use ($s) {
                    $q2->where('name', 'like', "%{$s}%")
                      ->orWhere('company', 'like', "%{$s}%")
                      ->orWhere('email', 'like', "%{$s}%");
                })->orWhere('id', 'like', "%{$s}%");
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('source') && $request->source !== 'all') {
            $query->where('source', $request->source);
        }

        $enquiries = $query->latest()->paginate($request->get('per_page', config('zeronix.default_per_page', 15)));

        return response()->json([
            'data' => $enquiries->items(),
            'total' => $enquiries->total(),
            'current_page' => $enquiries->currentPage(),
            'last_page' => $enquiries->lastPage(),
            'per_page' => $enquiries->perPage(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'customer_name' => 'required_without:customer_id|string|max:255',
            'customer_email' => 'required_without:customer_id|email',
            'customer_phone' => 'nullable|string|max:50',
            'customer_company' => 'nullable|string|max:255',
            'source' => 'nullable|string',
            'priority' => 'nullable|string',
            'status' => 'nullable|string',
            'notes' => 'nullable|string',
            'items' => 'nullable|array',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.description' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $customerId = $validated['customer_id'] ?? null;

            // CRM Flow: Auto-create customer if it doesn't exist
            if (!$customerId && !empty($validated['customer_email'])) {
                $customer = \App\Models\Customer::firstOrCreate(
                    ['email' => $validated['customer_email']],
                    [
                        'name' => $validated['customer_name'] ?? 'Unknown',
                        'phone' => $validated['customer_phone'] ?? null,
                        'company' => $validated['customer_company'] ?? null,
                        'user_id' => $request->user()->id ?? null,
                        'password' => \Illuminate\Support\Facades\Hash::make('zeronix@123')
                    ]
                );
                $customerId = $customer->id;
            }

            $enquiry = Enquiry::create([
                'customer_id' => $customerId,
                'user_id' => $request->user()->id ?? null,
                'assigned_to' => $request->user()->role === 'salesman' ? $request->user()->id : null,
                'source' => $validated['source'] ?? 'portal',
                'priority' => $validated['priority'] ?? 'normal',
                'status' => $validated['status'] ?? 'new',
                'notes' => $validated['notes'] ?? null,
            ]);

            if (!empty($validated['items'])) {
                foreach ($validated['items'] as $item) {
                    $enquiry->items()->create([
                        'product_id' => $item['product_id'] ?? null,
                        'quantity' => $item['quantity'],
                        'description' => $item['description'] ?? null,
                    ]);
                }
            }

            DB::commit();
            
            $enquiry->load(['customer', 'items.product', 'user', 'assignedUser']);
            
            return response()->json($enquiry, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create enquiry', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(Request $request, Enquiry $enquiry)
    {
        $this->authorize('view', $enquiry);
        return response()->json($enquiry->load(['customer', 'items.product', 'user', 'assignedUser']));
    }

    public function update(Request $request, Enquiry $enquiry)
    {
        $this->authorize('update', $enquiry);

        $validated = $request->validate([
            'status' => 'nullable|string',
            'priority' => 'nullable|string',
            'notes' => 'nullable|string',
            'cancellation_reason' => 'required_if:status,cancelled|string|nullable',
        ]);

        if (isset($validated['status']) && $validated['status'] === 'cancelled' && $enquiry->status !== 'cancelled') {
            $enquiry->cancelled_at = now();
        }

        $enquiry->update($validated);

        return response()->json($enquiry);
    }

    public function destroy(Request $request, Enquiry $enquiry)
    {
        $this->authorize('delete', $enquiry);
        $enquiry->delete();
        return response()->json(['message' => 'Enquiry deleted']);
    }

    public function assign(Request $request, $id)
    {
        $enquiry = Enquiry::findOrFail($id);

        $validated = $request->validate([
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $enquiry->update(['assigned_to' => $validated['assigned_to']]);
        $enquiry->load(['customer', 'user', 'assignedUser']);

        return response()->json($enquiry);
    }

    public function publicStore(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email',
            'customer_phone' => 'nullable|string|max:50',
            'customer_company' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        DB::beginTransaction();
        try {
            $customer = \App\Models\Customer::firstOrCreate(
                ['email' => $validated['customer_email']],
                [
                    'name' => $validated['customer_name'],
                    'phone' => $validated['customer_phone'] ?? null,
                    'company' => $validated['customer_company'] ?? null,
                    'password' => \Illuminate\Support\Facades\Hash::make('zeronix@123')
                ]
            );

            $enquiry = Enquiry::create([
                'customer_id' => $customer->id,
                'source' => 'portal_public',
                'priority' => 'normal',
                'status' => 'new',
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $enquiry->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                ]);
            }

            DB::commit();
            return response()->json(['message' => 'Quote request sent successfully', 'id' => $enquiry->id], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to send quote request', 'error' => $e->getMessage()], 500);
        }
    }
}
