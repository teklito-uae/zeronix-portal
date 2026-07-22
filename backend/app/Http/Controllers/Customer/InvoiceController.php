<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $customer = $request->user();
        $query = \App\Models\Invoice::where('customer_id', $customer->id)
            ->with(['user', 'delivery', 'deliveries'])
            ->withCount('items');

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where('invoice_number', 'like', "%{$s}%");
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $invoices = $query->latest()->paginate($request->get('per_page', 15));
        return response()->json($invoices);
    }

    public function show(Request $request, $id)
    {
        $customer = $request->user();
        $invoice = \App\Models\Invoice::where('customer_id', $customer->id)
            ->with(['items.product', 'user', 'delivery', 'deliveries'])
            ->findOrFail($id);

        return response()->json($invoice);
    }

    /**
     * Customer acknowledgment of receipt. This updates the actual linked
     * Delivery record (the one thing tracking real dispatch/stock state) —
     * not a standalone flag on the invoice — so staff see one consistent
     * delivery status regardless of whether it came from the warehouse
     * marking it delivered or the customer confirming receipt.
     */
    public function confirmDelivery(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:accepted,rejected',
            'notes' => 'nullable|string',
        ]);

        $customer = $request->user();
        $invoice = \App\Models\Invoice::where('customer_id', $customer->id)->findOrFail($id);

        $delivery = $invoice->delivery ?: $invoice->deliveries()->latest()->first();
        if (!$delivery) {
            return response()->json(['message' => 'No delivery note has been created for this invoice yet.'], 422);
        }

        $delivery->update([
            'customer_confirmation' => $request->status,
            'customer_notes' => $request->notes,
            'customer_confirmed_at' => now(),
        ]);

        // Notify Admins and Assigned User
        $usersToNotify = \App\Models\User::where('role', 'admin')->get();

        $title = $request->status === 'accepted' ? 'Delivery Accepted' : 'Delivery Rejected';
        $type = $request->status === 'accepted' ? 'success' : 'error';
        $message = "Customer {$customer->company} has {$request->status} delivery for Invoice #{$invoice->invoice_number}.";

        $assignedUsers = $customer->assigned_users;
        foreach ($assignedUsers as $staff) {
            $staff->notify(new \App\Notifications\SystemNotification([
                'title'      => $title,
                'message'    => $message,
                'type'       => $type,
                'action_url' => "/admin/invoices/{$invoice->id}"
            ]));
        }

        foreach ($usersToNotify as $user) {
            $user->notify(new \App\Notifications\AdminNotification($title, $message, $type, "/admin/invoices/{$invoice->id}"));
        }

        return response()->json([
            'message' => "Delivery confirmation saved successfully.",
            'invoice' => $invoice->fresh(['delivery', 'deliveries']),
        ]);
    }
}
