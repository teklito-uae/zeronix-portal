<?php

namespace App\Http\Controllers;

use App\Models\CustomerLabel;
use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerLabelController extends Controller
{
    public function index()
    {
        $labels = CustomerLabel::withCount('customers')->orderBy('name')->get();
        return response()->json($labels);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:100|unique:customer_labels,name',
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        $validated['name']       = strtoupper(trim($validated['name']));
        $validated['created_by'] = $request->user()->id;
        $validated['color']      = $validated['color'] ?? '#6366F1';

        $label = CustomerLabel::create($validated);
        return response()->json($label->loadCount('customers'), 201);
    }

    public function update(Request $request, CustomerLabel $label)
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:100|unique:customer_labels,name,' . $label->id,
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        $validated['name'] = strtoupper(trim($validated['name']));
        $label->update($validated);

        return response()->json($label->loadCount('customers'));
    }

    public function destroy(CustomerLabel $label)
    {
        $label->customers()->detach();
        $label->delete();
        return response()->json(['message' => 'Label deleted']);
    }

    /**
     * Bulk-assign all customers with this label to a staff member.
     */
    public function assignTeam(Request $request, CustomerLabel $label)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $customerIds = $label->customers()->pluck('customers.id');
        Customer::whereIn('id', $customerIds)->update(['user_id' => $validated['user_id']]);

        // Notify the assigned staff member
        $staff = \App\Models\User::find($validated['user_id']);
        if ($staff) {
            $count = $customerIds->count();
            $staff->notify(new \App\Notifications\SystemNotification([
                'title'      => 'Customers Assigned',
                'message'    => "{$count} customer(s) from label [{$label->name}] have been assigned to you.",
                'type'       => 'info',
                'action_url' => "/staff/customers",
            ]));
        }

        return response()->json([
            'message'  => 'Team assignment complete',
            'affected' => $customerIds->count(),
        ]);
    }
}
