<?php

namespace App\Http\Controllers;

use App\Models\Delivery;
use App\Models\DeliveryItem;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use App\Support\LineItemMath;

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
            $user = $request->user();
            $settings = $user->company->settings ?? [];
            $prefix = $settings['sales_order_prefix'] ?? 'SO-';
            $companyId = $user->role === 'super_admin' ? null : $user->company_id;
            $orderNumber = \App\Services\DocumentNumberGenerator::nextDailySequence(SalesOrder::class, $prefix, $companyId);

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
        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error('Failed to create sales order: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Failed to create sales order.'], 500);
        }
    }

    /**
     * Object-level ownership check for a single sales order, mirroring the
     * three-tier `forUser()` scope (HasUserScope) already applied in index():
     * admin/super_admin unrestricted; manager also sees orders owned by their
     * direct reports; everyone else only their own (sales_orders.user_id).
     */
    private function authorizeSalesOrderAccess(Request $request, SalesOrder $salesOrder): void
    {
        $user = $request->user();

        if (!$user || in_array($user->role, ['admin', 'super_admin'], true)) {
            return;
        }

        $userIds = [$user->id];

        if ($user->role === 'manager') {
            $userIds = array_merge($userIds, User::where('manager_id', $user->id)->pluck('id')->all());
        }

        if (!in_array($salesOrder->user_id, $userIds, true)) {
            abort(403);
        }
    }

    public function show(Request $request, SalesOrder $salesOrder)
    {
        $this->authorizeSalesOrderAccess($request, $salesOrder);

        return response()->json($salesOrder->load(['customer', 'customerContact', 'items.product', 'user', 'quote', 'deliveries']));
    }

    public function update(Request $request, SalesOrder $salesOrder)
    {
        $this->authorizeSalesOrderAccess($request, $salesOrder);

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
        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error('Failed to update sales order: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Failed to update sales order.'], 500);
        }
    }

    public function destroy(Request $request, SalesOrder $salesOrder)
    {
        $this->authorizeSalesOrderAccess($request, $salesOrder);

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
            $user = $request->user();
            $companyId = $user && $user->role === 'super_admin' ? null : $user?->company_id;
            $settings = $user->company->settings ?? [];
            $deliveryPrefix = $settings['delivery_prefix'] ?? 'DN-';
            $deliveryNumber = \App\Services\DocumentNumberGenerator::nextDailySequence(Delivery::class, $deliveryPrefix, $companyId);

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
        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error('Failed to create delivery from sales order: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Failed to create delivery.'], 500);
        }
    }

    private function totals(array $items): array
    {
        $totals = LineItemMath::totals($items);
        return [$totals['subtotal'], $totals['vat_amount']];
    }

    private function createItems(SalesOrder $order, array $items): void
    {
        foreach ($items as $item) {
            $line = LineItemMath::line($item);

            SalesOrderItem::create([
                'sales_order_id' => $order->id,
                'product_id' => $item['product_id'] ?? null,
                'description' => $item['description'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'tax_percent' => $line['tax_percent'],
                'tax_amount' => $line['tax_amount'],
                'total' => $line['total'],
            ]);
        }
    }
}
