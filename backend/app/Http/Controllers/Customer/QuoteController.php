<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class QuoteController extends Controller
{
    public function index(Request $request)
    {
        $customer = $request->user();
        $query = \App\Models\Quote::where('customer_id', $customer->id)
            ->with(['user'])
            ->withCount('items');

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where('quote_number', 'like', "%{$s}%");
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $quotes = $query->latest()->paginate($request->get('per_page', 15));
        return response()->json($quotes);
    }

    public function show(Request $request, $id)
    {
        $customer = $request->user();
        $quote = \App\Models\Quote::where('customer_id', $customer->id)
            ->with(['items.product', 'user'])
            ->findOrFail($id);

        return response()->json($quote);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:accepted,rejected',
        ]);

        $customer = $request->user();
        $quote = \App\Models\Quote::where('customer_id', $customer->id)->findOrFail($id);

        $quote->update([
            'status' => $request->status,
        ]);

        // Notify Admins
        $usersToNotify = \App\Models\User::where('role', 'admin')->get();

        foreach ($usersToNotify as $user) {
            $user->notify(new \App\Notifications\AdminNotification(
                'Quote ' . ucfirst($request->status),
                "{$customer->company} has {$request->status} Quote {$quote->quote_number}.",
                $request->status === 'accepted' ? 'success' : 'error',
                "/admin/quotes/{$quote->id}"
            ));
        }
        
        $assignedUsers = $customer->assigned_users;
        foreach ($assignedUsers as $staff) {
            $staff->notify(new \App\Notifications\SystemNotification([
                'title'      => 'Quote Approved by Customer',
                'message'    => "Customer {$customer->name} has {$request->status} quote {$quote->quote_number}.",
                'type'       => $request->status === 'accepted' ? 'success' : 'error',
                'action_url' => "/staff/quotes/{$quote->id}"
            ]));
        }

        return response()->json([
            'message' => "Quote status updated to {$request->status}.",
            'quote' => $quote
        ]);
    }
}
