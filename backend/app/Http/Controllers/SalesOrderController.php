<?php

namespace App\Http\Controllers;

use App\Models\Delivery;
use App\Models\DeliveryItem;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class SalesOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesOrder::with(['customer', 'customerContact', 'user'])->withCount('items');

        $query->forUser($request->user());

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('order_number', 'like', "%{$s}%")
                    ->orWhereHas('customer', function ($q2) use ($s) {
                        $q2->where('name', 'like', "%{$s}%")->orWhere('company', 'like', "%{$s}%");
                    });
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('user_id') && $request->user_id !== 'all') {
            $query->where('user_id', $request->user_id);
        }

        $orders = $query->latest()->paginate($request->get('per_page', config('zeronix.default_per_page', 15)));

        return response()->json([
            'data' => $orders->items(),
            'total' => $orders->total(),
            'current_page' => $orders->currentPage(),
            'last_page' => $orders->lastPage(),
            'per_page' => $orders->perPage(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'customer_contact_id' => 'nullable|exists:customer_contacts,id',
            'enquiry_id' => 'nullable|exists:enquiries,id',
            'quote_id' => 'nullable|exists:quotes,id',
            'date' => 'required|date',
            'status' => 'nullable|string|in:draft,confirmed,processing,completed,cancelled',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_percent' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $date = Carbon::now()->format('Ymd');
            $count = SalesOrder::whereDate('created_at', Carbon::today())->count() + 1;
            $orderNumber = 'SO-' . $date . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);

            [$subtotal, $vatAmount] = $this->totals($validated['items']);

            $order = SalesOrder::create([
                'order_number' => $orderNumber,
                'customer_id' => $validated['customer_id'],
                'customer_contact_id' => $validated['customer_contact_id'] ?? null,
                'enquiry_id' => $validated['enquiry_id'] ?? null,
                'quote_id' => $validated['quote_id'] ?? null,
                'user_id' => $request->user()->id,
                'date' => $validated['date'],
                'status' => $validated['status'] ?? 'draft',
                'subtotal' => $subtotal,
                'vat_amount' => $vatAmount,
                'total' => $subtotal + $vatAmount,
            ]);

            $this->createItems($order, $validated['items']);

            DB::commit();
            return response()->json($order->load(['customer', 'items']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create sales order', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(Request $request, SalesOrder $salesOrder)
    {
        return response()->json($salesOrder->load(['customer', 'customerContact', 'items.product', 'user', 'quote', 'deliveries']));
    }

    public function update(Request $request, SalesOrder $salesOrder)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'customer_contact_id' => 'nullable|exists:customer_contacts,id',
            'date' => 'required|date',
            'status' => 'nullable|string|in:draft,confirmed,processing,completed,cancelled',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_percent' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            [$subtotal, $vatAmount] = $this->totals($validated['items']);

            $salesOrder->update([
                'customer_id' => $validated['customer_id'],
                'customer_contact_id' => $validated['customer_contact_id'] ?? $salesOrder->customer_contact_id,
                'date' => $validated['date'],
                'status' => $validated['status'] ?? $salesOrder->status,
                'subtotal' => $subtotal,
                'vat_amount' => $vatAmount,
                'total' => $subtotal + $vatAmount,
            ]);

            $salesOrder->items()->delete();
            $this->createItems($salesOrder, $validated['items']);

            DB::commit();
            return response()->json($salesOrder->load(['customer', 'items']));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update sales order', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, SalesOrder $salesOrder)
    {
        $salesOrder->items()->delete();
        $salesOrder->delete();
        return response()->json(['message' => 'Sales order deleted']);
    }

    public function convertToDelivery(Request $request, SalesOrder $salesOrder)
    {
        $existingDelivery = $salesOrder->deliveries()->latest()->first();
        if ($existingDelivery) {
            return response()->json($existingDelivery->load(['customer', 'items']));
        }

        $salesOrder->load('items');

        DB::beginTransaction();
        try {
            $date = Carbon::now()->format('Ymd');
            $count = Delivery::whereDate('created_at', Carbon::today())->count() + 1;
            $deliveryNumber = 'DN-' . $date . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);

            $delivery = Delivery::create([
                'delivery_number' => $deliveryNumber,
                'customer_id' => $salesOrder->customer_id,
                'sales_order_id' => $salesOrder->id,
                'delivery_date' => now()->toDateString(),
                'status' => 'pending',
            ]);

            foreach ($salesOrder->items as $item) {
                DeliveryItem::create([
                    'delivery_id' => $delivery->id,
                    'sales_order_item_id' => $item->id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product_name ?? $item->description,
                    'quantity' => $item->quantity,
                ]);
            }

            $salesOrder->update(['status' => 'processing']);

            DB::commit();
            return response()->json($delivery->load(['customer', 'items']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create delivery', 'error' => $e->getMessage()], 500);
        }
    }

    private function totals(array $items): array
    {
        $subtotal = 0;
        $vatAmount = 0;
        foreach ($items as $item) {
            $itemSubtotal = $item['quantity'] * $item['unit_price'];
            $subtotal += $itemSubtotal;
            $vatAmount += $itemSubtotal * (($item['tax_percent'] ?? 5) / 100);
        }
        return [$subtotal, $vatAmount];
    }

    private function createItems(SalesOrder $order, array $items): void
    {
        foreach ($items as $item) {
            $itemSubtotal = $item['quantity'] * $item['unit_price'];
            $itemTax = $itemSubtotal * (($item['tax_percent'] ?? 5) / 100);

            SalesOrderItem::create([
                'sales_order_id' => $order->id,
                'product_id' => $item['product_id'] ?? null,
                'description' => $item['description'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'tax_percent' => $item['tax_percent'] ?? 5,
                'tax_amount' => $itemTax,
                'total' => $itemSubtotal + $itemTax,
            ]);
        }
    }
}
