<?php

namespace App\Http\Controllers;

use App\Models\PurchaseBill;
use App\Models\PurchaseBillItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class PurchaseBillController extends Controller
{
    public function index(Request $request)
    {
        $query = PurchaseBill::with(['supplier', 'user'])
            ->withCount('items');

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('bill_number', 'like', "%{$s}%")
                    ->orWhereHas('supplier', function ($q2) use ($s) {
                        $q2->where('name', 'like', "%{$s}%");
                    });
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $bills = $query->latest()->paginate($request->get('per_page', config('zeronix.default_per_page', 15)));

        return response()->json([
            'data' => $bills->items(),
            'total' => $bills->total(),
            'current_page' => $bills->currentPage(),
            'last_page' => $bills->lastPage(),
            'per_page' => $bills->perPage(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'date' => 'required|date',
            'due_date' => 'nullable|date',
            'status' => 'nullable|string',
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
            $count = PurchaseBill::whereDate('created_at', Carbon::today())->count() + 1;
            $billNumber = 'PB-' . $date . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);

            $subtotal = 0;
            $vatAmount = 0;

            foreach ($validated['items'] as $item) {
                $itemSubtotal = $item['quantity'] * $item['unit_price'];
                $subtotal += $itemSubtotal;
                $vatAmount += $itemSubtotal * (($item['tax_percent'] ?? 5) / 100);
            }

            $bill = PurchaseBill::create([
                'bill_number' => $billNumber,
                'supplier_id' => $validated['supplier_id'],
                'user_id' => $request->user()->id,
                'date' => $validated['date'],
                'due_date' => $validated['due_date'] ?? null,
                'subtotal' => $subtotal,
                'vat_amount' => $vatAmount,
                'total' => $subtotal + $vatAmount,
                'status' => $validated['status'] ?? 'unpaid',
            ]);

            foreach ($validated['items'] as $item) {
                $itemSubtotal = $item['quantity'] * $item['unit_price'];
                $itemTax = $itemSubtotal * (($item['tax_percent'] ?? 5) / 100);

                PurchaseBillItem::create([
                    'purchase_bill_id' => $bill->id,
                    'product_id' => $item['product_id'] ?? null,
                    'product_name' => $item['product_name'] ?? $item['description'],
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_percent' => $item['tax_percent'] ?? 5,
                    'tax_amount' => $itemTax,
                    'total' => $itemSubtotal + $itemTax,
                ]);
            }

            DB::commit();

            return response()->json($bill->load(['supplier', 'items']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create purchase bill', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(Request $request, PurchaseBill $purchaseBill)
    {
        return response()->json($purchaseBill->load(['supplier', 'items.product', 'user']));
    }

    public function update(Request $request, PurchaseBill $purchaseBill)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'date' => 'required|date',
            'due_date' => 'nullable|date',
            'status' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_percent' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $subtotal = 0;
            $vatAmount = 0;

            foreach ($validated['items'] as $item) {
                $itemSubtotal = $item['quantity'] * $item['unit_price'];
                $subtotal += $itemSubtotal;
                $vatAmount += $itemSubtotal * (($item['tax_percent'] ?? 5) / 100);
            }

            $purchaseBill->update([
                'supplier_id' => $validated['supplier_id'],
                'date' => $validated['date'],
                'due_date' => $validated['due_date'] ?? null,
                'subtotal' => $subtotal,
                'vat_amount' => $vatAmount,
                'total' => $subtotal + $vatAmount,
                'status' => $validated['status'] ?? $purchaseBill->status,
            ]);

            // Sync items (delete row-by-row so stock-reversal model events fire)
            $purchaseBill->items()->get()->each->delete();
            foreach ($validated['items'] as $item) {
                $itemSubtotal = $item['quantity'] * $item['unit_price'];
                $itemTax = $itemSubtotal * (($item['tax_percent'] ?? 5) / 100);

                PurchaseBillItem::create([
                    'purchase_bill_id' => $purchaseBill->id,
                    'product_id' => $item['product_id'] ?? null,
                    'product_name' => $item['product_name'] ?? $item['description'],
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_percent' => $item['tax_percent'] ?? 5,
                    'tax_amount' => $itemTax,
                    'total' => $itemSubtotal + $itemTax,
                ]);
            }

            DB::commit();

            return response()->json($purchaseBill->load(['supplier', 'items']));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update purchase bill', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, PurchaseBill $purchaseBill)
    {
        // Delete items row-by-row (not via cascade) so stock-reversal model events fire
        $purchaseBill->items()->get()->each->delete();
        $purchaseBill->delete();
        return response()->json(['message' => 'Purchase bill deleted']);
    }
}
