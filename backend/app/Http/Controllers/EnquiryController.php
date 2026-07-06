<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\CustomerContact;
use App\Models\Enquiry;
use App\Models\EnquiryItem;
use App\Models\Lead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EnquiryController extends Controller
{
    private const SOURCES = ['manual', 'website', 'email', 'referral', 'import', 'other'];
    private const STATUSES = ['new', 'assigned', 'in_progress', 'quoted', 'won', 'lost', 'closed', 'cancelled'];

    /**
     * Resolve a brand-new contact (no customer_id supplied) to, in priority order:
     * an existing Customer Contact (dedup by email — a known contact at a company
     * must not spawn a duplicate Lead), an existing Customer without contacts yet
     * (backward compatibility for pre-Contact-feature customers), or a Lead (a new
     * prospect, not yet an accounting entity).
     *
     * @return array{customer_id: int|null, lead_id: int|null, contact_id: int|null}
     */
    private function resolveContact(?string $email, array $attrs): array
    {
        if (empty($email)) {
            return ['customer_id' => null, 'lead_id' => null, 'contact_id' => null];
        }

        $contact = CustomerContact::where('email', $email)->where('is_active', true)->first();
        if ($contact) {
            return ['customer_id' => $contact->customer_id, 'lead_id' => null, 'contact_id' => $contact->id];
        }

        $customer = Customer::where('email', $email)->first();
        if ($customer) {
            return ['customer_id' => $customer->id, 'lead_id' => null, 'contact_id' => $customer->primaryContact()?->id];
        }

        $lead = Lead::firstOrCreate(
            ['email' => $email],
            [
                'name' => $attrs['name'] ?? 'Unknown',
                'phone' => $attrs['phone'] ?? null,
                'company' => $attrs['company'] ?? null,
                'source' => $attrs['source'] ?? null,
                'user_id' => $attrs['user_id'] ?? null,
            ]
        );
        return ['customer_id' => null, 'lead_id' => $lead->id, 'contact_id' => null];
    }

    public function index(Request $request)
    {
        $query = Enquiry::with(['customer', 'lead', 'customerContact', 'user', 'assigned_users'])->withCount('items');

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
            'customer_contact_id' => 'nullable|exists:customer_contacts,id',
            'customer_name' => 'required_without:customer_id|string|max:255',
            'customer_email' => 'required_without:customer_id|email',
            'customer_phone' => 'nullable|string|max:50',
            'customer_company' => 'nullable|string|max:255',
            'source' => 'nullable|string|in:' . implode(',', self::SOURCES),
            'priority' => 'nullable|string',
            'status' => 'nullable|string|in:' . implode(',', self::STATUSES),
            'notes' => 'nullable|string',
            'items' => 'nullable|array',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.description' => 'nullable|string',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        DB::beginTransaction();
        try {
            $customerId = $validated['customer_id'] ?? null;
            $contactId = $validated['customer_contact_id'] ?? null;
            $leadId = null;

            // CRM Flow: resolve a brand-new contact to an existing Customer Contact
            // (dedup), an existing Customer without contacts yet, or a new Lead — a
            // prospect is not an accounting entity until converted.
            if (!$customerId && !empty($validated['customer_email'])) {
                $resolved = $this->resolveContact($validated['customer_email'], [
                    'name' => $validated['customer_name'] ?? 'Unknown',
                    'phone' => $validated['customer_phone'] ?? null,
                    'company' => $validated['customer_company'] ?? null,
                    'source' => $validated['source'] ?? 'manual',
                    'user_id' => $request->user()->id ?? null,
                ]);
                $customerId = $resolved['customer_id'];
                $contactId = $resolved['contact_id'];
                $leadId = $resolved['lead_id'];
            }

            $attachmentPaths = [];
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $attachmentPaths[] = $file->store('enquiry_attachments', 'public');
                }
            }

            $enquiry = Enquiry::create([
                'customer_id' => $customerId,
                'lead_id' => $leadId,
                'customer_contact_id' => $contactId,
                'user_id' => $request->user()->id ?? null,
                'source' => $validated['source'] ?? 'manual',
                'priority' => $validated['priority'] ?? 'normal',
                'status' => $validated['status'] ?? 'new',
                'notes' => $validated['notes'] ?? null,
                'attachments' => $attachmentPaths,
            ]);

            if ($request->user() && $request->user()->role === 'salesman') {
                $enquiry->assigned_users()->attach([$request->user()->id]);
            }

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

            $enquiry->load(['customer', 'lead', 'customerContact', 'items.product', 'user', 'assigned_users']);

            return response()->json($enquiry, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create enquiry', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(Request $request, Enquiry $enquiry)
    {
        $this->authorize('view', $enquiry);
        return response()->json($enquiry->load(['customer', 'lead', 'customerContact', 'items.product', 'user', 'assigned_users']));
    }

    public function update(Request $request, Enquiry $enquiry)
    {
        $this->authorize('update', $enquiry);

        $validated = $request->validate([
            'status' => 'nullable|string|in:' . implode(',', self::STATUSES),
            'priority' => 'nullable|string',
            'notes' => 'nullable|string',
            'customer_contact_id' => 'nullable|exists:customer_contacts,id',
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

    public function assign(Request $request, Enquiry $enquiry)
    {

        $validated = $request->validate([
            'user_ids'   => 'nullable|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $enquiry->assigned_users()->sync($validated['user_ids'] ?? []);
        $enquiry->load(['customer', 'user', 'assigned_users']);

        return response()->json($enquiry);
    }
}
