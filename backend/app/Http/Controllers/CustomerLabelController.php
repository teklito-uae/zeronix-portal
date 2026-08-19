<?php

namespace App\Http\Controllers;

use App\Models\CustomerLabel;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;

class CustomerLabelController extends Controller
{
    public function index()
    {
        $labels = CustomerLabel::withCount('customers')->orderBy('name')->get();
        return response()->json($labels);
    }

    public function store(Request $request)
    {
        $this->normalizeName($request);

        $validated = $request->validate([
            'name'  => ['required', 'string', 'max:100', $this->uniqueNameRule($request)],
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        $validated['created_by'] = $request->user()->id;
        $validated['color']      = $validated['color'] ?? '#6366F1';

        $label = CustomerLabel::create($validated);
        return response()->json($label->loadCount('customers'), 201);
    }

    public function update(Request $request, CustomerLabel $label)
    {
        $this->normalizeName($request);

        $validated = $request->validate([
            'name'  => ['required', 'string', 'max:100', $this->uniqueNameRule($request)->ignore($label->id)],
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

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
     * Labels are stored uppercased, so normalize before validating: the
     * uniqueness check then compares like with like.
     */
    private function normalizeName(Request $request): void
    {
        $name = $request->input('name');

        if (is_string($name)) {
            $request->merge(['name' => strtoupper(trim($name))]);
        }
    }

    /**
     * Label names are unique per tenant: one company's labels must not
     * constrain another's.
     */
    private function uniqueNameRule(Request $request): Unique
    {
        return Rule::unique('customer_labels', 'name')
            ->where('company_id', $request->user()->company_id);
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

        // customers.user_id was dropped in favor of the customer_user pivot.
        $customers = Customer::whereIn('id', $customerIds)->get();
        foreach ($customers as $customer) {
            $customer->assigned_users()->syncWithoutDetaching([$validated['user_id']]);
        }

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
