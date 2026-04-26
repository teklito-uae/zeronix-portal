<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Enquiry;
use App\Models\EnquiryItem;
use Illuminate\Support\Facades\DB;

class EnquiryController extends Controller
{
    public function index(Request $request)
    {
        $enquiries = Enquiry::withCount('items')
            ->where('customer_id', $request->user()->id)
            ->latest()
            ->paginate($request->get('per_page', 10));

        return response()->json($enquiries);
    }

    public function store(Request $request)
    {
        $request->validate([
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.description' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request) {
            $enquiry = Enquiry::create([
                'customer_id' => $request->user()->id,
                'source' => 'portal',
                'priority' => 'normal',
                'status' => 'new',
                'notes' => $request->notes,
            ]);

            foreach ($request->items as $item) {
                EnquiryItem::create([
                    'enquiry_id' => $enquiry->id,
                    'product_id' => $item['product_id'] ?? null,
                    'quantity' => $item['quantity'],
                    'description' => $item['description'] ?? null,
                ]);
            }

            // Notify Admins and Assigned User
            $customer = $request->user();
            $assignedUserId = $customer->user_id;
            
            $usersToNotify = \App\Models\User::where('role', 'admin')
                ->when($assignedUserId, function($q) use ($assignedUserId) {
                    $q->orWhere('id', $assignedUserId);
                })->get();

            foreach ($usersToNotify as $user) {
                $user->notify(new \App\Notifications\AdminNotification(
                    'New Enquiry Received',
                    "{$customer->company} has submitted a new enquiry.",
                    'info',
                    "/admin/enquiries/{$enquiry->id}"
                ));
            }

            return response()->json($enquiry->load('items.product'), 201);
        });
    }

    public function show($id, Request $request)
    {
        $enquiry = Enquiry::with(['items.product', 'user'])
            ->where('customer_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json($enquiry);
    }
}
