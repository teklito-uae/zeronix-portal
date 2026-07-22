<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\CustomerContact;
use Illuminate\Http\Request;

class CustomerContactController extends Controller
{
    public function index(Request $request, Customer $customer)
    {
        $query = $customer->contacts();

        if ($request->boolean('active')) {
            $query->where('is_active', true);
        }

        return response()->json($query->orderByDesc('is_primary')->get());
    }

    public function store(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'designation' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'mobile' => 'nullable|string|max:50',
            'extension' => 'nullable|string|max:20',
            'is_primary' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        $isFirstContact = $customer->contacts()->count() === 0;
        $validated['is_primary'] = $validated['is_primary'] ?? $isFirstContact;
        $validated['is_active'] = $validated['is_active'] ?? true;

        $contact = $customer->contacts()->create($validated);

        return response()->json($contact, 201);
    }

    public function update(Request $request, Customer $customer, CustomerContact $contact)
    {
        $validated = $request->validate([
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'designation' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'mobile' => 'nullable|string|max:50',
            'extension' => 'nullable|string|max:20',
            'is_primary' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        $contact->update($validated);

        return response()->json($contact);
    }

    public function destroy(Request $request, Customer $customer, CustomerContact $contact)
    {
        $contact->delete();
        return response()->json(['message' => 'Contact deleted']);
    }

    public function setPrimary(Request $request, Customer $customer, CustomerContact $contact)
    {
        $contact->update(['is_primary' => true]);
        return response()->json($customer->contacts()->orderByDesc('is_primary')->get());
    }

    public function indexAll(Request $request)
    {
        $query = CustomerContact::with('customer:id,name,company')
            ->whereHas('customer', fn ($q) => $q->forUser($request->user()));

        if ($request->filled('search')) {
            $s = $request->get('search');
            $query->where(fn ($q) => $q->where('full_name', 'like', "%{$s}%")
                ->orWhere('email', 'like', "%{$s}%")
                ->orWhere('designation', 'like', "%{$s}%")
                ->orWhereHas('customer', fn ($q2) => $q2->where('name', 'like', "%{$s}%")
                    ->orWhere('company', 'like', "%{$s}%")));
        }
        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->get('customer_id'));
        }

        $contacts = $query->orderByDesc('is_primary')->latest()
            ->paginate($request->get('per_page', config('zeronix.default_per_page', 15)));

        return response()->json([
            'data' => $contacts->items(), 'total' => $contacts->total(),
            'current_page' => $contacts->currentPage(), 'last_page' => $contacts->lastPage(),
            'per_page' => $contacts->perPage(),
        ]);
    }
}
