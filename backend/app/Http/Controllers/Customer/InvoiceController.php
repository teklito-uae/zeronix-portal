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
            ->with(['user'])
            ->withCount('items');

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where('invoice_number', 'like', "%{$s}%");
        }

        $invoices = $query->latest()->paginate($request->get('per_page', 15));
        return response()->json($invoices);
    }

    public function show(Request $request, $id)
    {
        $customer = $request->user();
        $invoice = \App\Models\Invoice::where('customer_id', $customer->id)
            ->with(['items.product', 'user'])
            ->findOrFail($id);

        return response()->json($invoice);
    }

    public function confirmDelivery(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:accepted,rejected',
            'notes' => 'nullable|string',
        ]);

        $customer = $request->user();
        $invoice = \App\Models\Invoice::where('customer_id', $customer->id)->findOrFail($id);

        $invoice->update([
            'delivery_status' => $request->status === 'accepted' ? 'delivered' : 'shipped',
            'delivery_notes' => $request->notes,
            'delivery_confirmed_at' => now(),
        ]);

        // Notify Admins and Assigned User
        $assignedUserId = $customer->user_id;
        $usersToNotify = \App\Models\User::where('role', 'admin')
            ->when($assignedUserId, function($q) use ($assignedUserId) {
                $q->orWhere('id', $assignedUserId);
            })->get();

        $title = $request->status === 'accepted' ? 'Delivery Accepted' : 'Delivery Rejected';
        $type = $request->status === 'accepted' ? 'success' : 'error';
        $message = "Customer {$customer->company} has {$request->status} delivery for Invoice #{$invoice->invoice_number}.";
        
        foreach ($usersToNotify as $user) {
            $user->notify(new \App\Notifications\AdminNotification($title, $message, $type, "/admin/invoices/{$invoice->id}"));
        }

        return response()->json([
            'message' => "Delivery confirmation saved successfully.",
            'invoice' => $invoice
        ]);
    }
}
