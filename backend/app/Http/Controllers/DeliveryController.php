<?php

namespace App\Http\Controllers;

use App\Models\Delivery;
use App\Models\DeliveryItem;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class DeliveryController extends Controller
{
    public function index(Request $request)
    {
        $query = Delivery::with(['customer', 'salesOrder', 'deliveredBy'])->withCount('items');

        $query->forUser($request->user());

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('delivery_number', 'like', "%{$s}%")
                    ->orWhereHas('customer', function ($q2) use ($s) {
                        $q2->where('name', 'like', "%{$s}%")->orWhere('company', 'like', "%{$s}%");
                    });
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('customer_confirmation') && $request->customer_confirmation !== 'all') {
            $query->where('customer_confirmation', $request->customer_confirmation);
        }

        $deliveries = $query->latest()->paginate($request->get('per_page', config('zeronix.default_per_page', 15)));

        return response()->json([
            'data' => $deliveries->items(),
            'total' => $deliveries->total(),
            'current_page' => $deliveries->currentPage(),
            'last_page' => $deliveries->lastPage(),
            'per_page' => $deliveries->perPage(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'sales_order_id' => 'nullable|exists:sales_orders,id',
            'delivery_date' => 'required|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.product_name' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
        ]);

        DB::beginTransaction();
        try {
            $date = \Illuminate\Support\Carbon::now()->format('Ymd');
            $count = Delivery::whereDate('created_at', \Illuminate\Support\Carbon::today())->count() + 1;
            $deliveryNumber = 'DN-' . $date . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);

            $delivery = Delivery::create([
                'delivery_number' => $deliveryNumber,
                'customer_id' => $validated['customer_id'],
                'sales_order_id' => $validated['sales_order_id'] ?? null,
                'delivery_date' => $validated['delivery_date'],
                'status' => 'pending',
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                DeliveryItem::create([
                    'delivery_id' => $delivery->id,
                    'product_id' => $item['product_id'] ?? null,
                    'product_name' => $item['product_name'],
                    'quantity' => $item['quantity'],
                ]);
            }

            DB::commit();
            return response()->json($delivery->load(['customer', 'items']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create delivery', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(Request $request, Delivery $delivery)
    {
        return response()->json($delivery->load(['customer', 'salesOrder', 'invoice', 'invoices', 'items.product', 'deliveredBy']));
    }

    public function update(Request $request, Delivery $delivery)
    {
        $validated = $request->validate([
            'delivery_date' => 'required|date',
            'status' => 'nullable|string|in:pending,processing,delivered,cancelled',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.product_name' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
        ]);

        if (($validated['status'] ?? $delivery->status) === 'delivered' && $delivery->status !== 'delivered') {
            return response()->json(['message' => 'Use the mark-delivered action to complete a delivery.'], 422);
        }

        if ($delivery->status === 'delivered') {
            return response()->json(['message' => 'A completed delivery cannot be edited.'], 422);
        }

        DB::beginTransaction();
        try {
            $delivery->update([
                'delivery_date' => $validated['delivery_date'],
                'status' => $validated['status'] ?? $delivery->status,
                'notes' => $validated['notes'] ?? $delivery->notes,
            ]);

            $delivery->items()->delete();
            foreach ($validated['items'] as $item) {
                DeliveryItem::create([
                    'delivery_id' => $delivery->id,
                    'product_id' => $item['product_id'] ?? null,
                    'product_name' => $item['product_name'],
                    'quantity' => $item['quantity'],
                ]);
            }

            DB::commit();
            return response()->json($delivery->load(['customer', 'items']));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update delivery', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, Delivery $delivery)
    {
        if ($delivery->status === 'delivered') {
            return response()->json(['message' => 'A completed delivery cannot be deleted.'], 422);
        }
        $delivery->items()->delete();
        $delivery->delete();
        return response()->json(['message' => 'Delivery deleted']);
    }

    /**
     * Stock only moves here, on the explicit transition to 'delivered' — not on
     * Delivery/DeliveryItem creation — so a pending/processing delivery never
     * touches inventory. Idempotent: re-calling on an already-delivered delivery
     * is a no-op, preventing double-decrement.
     */
    public function markDelivered(Request $request, Delivery $delivery)
    {
        if ($delivery->status === 'delivered') {
            return response()->json($delivery->load('items'));
        }

        $delivery->load('items.product');
        $shortages = [];
        foreach ($delivery->items as $item) {
            if ($item->product_id && $item->product && $item->product->stock_quantity < $item->quantity) {
                $shortages[] = "{$item->product->name} (available {$item->product->stock_quantity}, needs {$item->quantity})";
            }
        }
        if ($shortages) {
            return response()->json([
                'message' => 'Not enough stock to complete this delivery: ' . implode(', ', $shortages),
            ], 422);
        }

        DB::beginTransaction();
        try {
            foreach ($delivery->items as $item) {
                if ($item->product_id) {
                    Product::where('id', $item->product_id)->decrement('stock_quantity', (int) $item->quantity);
                    StockMovement::create([
                        'product_id' => $item->product_id,
                        'quantity' => -(int) $item->quantity,
                        'movement_type' => 'sale',
                        'reference_type' => Delivery::class,
                        'reference_id' => $delivery->id,
                        'user_id' => $request->user()->id,
                    ]);
                }
            }

            $delivery->update([
                'status' => 'delivered',
                'delivered_by' => $request->user()->id,
                'delivered_at' => now(),
            ]);

            if ($delivery->salesOrder) {
                $delivery->salesOrder->update(['status' => 'completed']);
            }

            DB::commit();
            return response()->json($delivery->load(['items', 'deliveredBy']));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to mark delivery as delivered', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Goods-first flow: bill for what was actually delivered. Only allowed
     * once the delivery is confirmed dispatched, and idempotent — re-calling
     * returns the invoice already billed against this delivery.
     */
    public function convertToInvoice(Request $request, Delivery $delivery)
    {
        if ($delivery->status !== 'delivered') {
            return response()->json(['message' => 'Only a completed delivery can be invoiced.'], 422);
        }

        $existing = Invoice::where('delivery_id', $delivery->id)->first();
        if ($existing) {
            return response()->json($existing->load(['customer', 'items']));
        }

        $delivery->load('items.product');

        DB::beginTransaction();
        try {
            $date = Carbon::now()->format('Ymd');
            $count = Invoice::whereDate('created_at', Carbon::today())->count() + 1;
            $invoiceNumber = 'INV-' . $date . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);

            $subtotal = 0;
            $vatAmount = 0;
            $lineItems = $delivery->items->map(function ($item) use (&$subtotal, &$vatAmount) {
                $unitPrice = $item->product?->price ?? 0;
                $taxPercent = 5;
                $itemSubtotal = $item->quantity * $unitPrice;
                $itemTax = $itemSubtotal * ($taxPercent / 100);
                $subtotal += $itemSubtotal;
                $vatAmount += $itemTax;
                return [
                    'product_id' => $item->product_id,
                    'description' => $item->product_name,
                    'quantity' => $item->quantity,
                    'unit_price' => $unitPrice,
                    'tax_percent' => $taxPercent,
                    'tax_amount' => $itemTax,
                    'total' => $itemSubtotal + $itemTax,
                ];
            });

            $invoice = Invoice::create([
                'invoice_number' => $invoiceNumber,
                'sales_order_id' => $delivery->sales_order_id,
                'delivery_id' => $delivery->id,
                'customer_id' => $delivery->customer_id,
                'user_id' => $request->user()->id,
                'date' => now()->toDateString(),
                'due_date' => now()->addDays(7)->toDateString(),
                'subtotal' => $subtotal,
                'vat_amount' => $vatAmount,
                'total' => $subtotal + $vatAmount,
                // Goods have already shipped by the time this bill-first invoice
                // is generated, so it starts life already accepted rather than draft.
                'status' => 'accepted',
            ]);

            foreach ($lineItems as $item) {
                InvoiceItem::create($item + ['invoice_id' => $invoice->id]);
            }

            DB::commit();

            if ($invoice->customer) {
                $slug = \Illuminate\Support\Str::slug($invoice->customer->company ?? 'company');
                $invoice->customer->notify(new \App\Notifications\SystemNotification([
                    'title' => 'New Invoice Available',
                    'message' => "Invoice {$invoice->invoice_number} has been generated.",
                    'type' => 'info',
                    'action_url' => "/portal/{$slug}/invoices/{$invoice->id}"
                ]));
            }

            return response()->json($invoice->load(['customer', 'items']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create invoice', 'error' => $e->getMessage()], 500);
        }
    }
}
