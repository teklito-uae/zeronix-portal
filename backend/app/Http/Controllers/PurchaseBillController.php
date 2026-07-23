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

        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
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
            'reference_id' => 'nullable|string',
            'status' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_percent' => 'nullable|numeric|min:0',
            'items.*.discount_percent' => 'nullable|numeric|min:0|max:100',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'shipping_amount' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $billNumber = $this->nextBillNumber();

            $subtotal = 0;
            $vatAmount = 0;

            foreach ($validated['items'] as $item) {
                $lineSubtotal = ($item['quantity'] ?? 0) * ($item['unit_price'] ?? 0);
                $lineDiscountAmt = $lineSubtotal * (($item['discount_percent'] ?? 0) / 100);
                $lineTaxable = $lineSubtotal - $lineDiscountAmt;
                $lineTax = $lineTaxable * (($item['tax_percent'] ?? 0) / 100);
                $subtotal += $lineTaxable;
                $vatAmount += $lineTax;
            }

            $discountPercent = $validated['discount_percent'] ?? 0;
            $shippingAmount = $validated['shipping_amount'] ?? 0;
            $headerDiscountAmt = $subtotal * ($discountPercent / 100);

            $bill = PurchaseBill::create([
                'bill_number' => $billNumber,
                'supplier_id' => $validated['supplier_id'],
                'user_id' => $request->user()->id,
                'date' => $validated['date'],
                'due_date' => $validated['due_date'] ?? null,
                'reference_id' => $validated['reference_id'] ?? null,
                'subtotal' => $subtotal,
                'vat_amount' => $vatAmount,
                'total' => $subtotal - $headerDiscountAmt + $vatAmount + $shippingAmount,
                'status' => $validated['status'] ?? 'unpaid',
                'tags' => $validated['tags'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'terms' => $validated['terms'] ?? null,
                'discount_percent' => $discountPercent,
                'shipping_amount' => $shippingAmount,
            ]);

            foreach ($validated['items'] as $item) {
                $lineSubtotal = $item['quantity'] * $item['unit_price'];
                $lineDiscountPercent = $item['discount_percent'] ?? 0;
                $lineDiscountAmt = $lineSubtotal * ($lineDiscountPercent / 100);
                $lineTaxable = $lineSubtotal - $lineDiscountAmt;
                $lineTax = $lineTaxable * (($item['tax_percent'] ?? 5) / 100);

                PurchaseBillItem::create([
                    'purchase_bill_id' => $bill->id,
                    'product_id' => $item['product_id'] ?? null,
                    'product_name' => $item['product_name'] ?? $item['description'],
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_percent' => $item['tax_percent'] ?? 5,
                    'tax_amount' => $lineTax,
                    'discount_percent' => $lineDiscountPercent,
                    'discount_amount' => $lineDiscountAmt,
                    'total' => $lineTaxable + $lineTax,
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
        return response()->json($purchaseBill->load(['supplier', 'items.product', 'user', 'activities.user', 'receipts']));
    }

    public function update(Request $request, PurchaseBill $purchaseBill)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'date' => 'required|date',
            'due_date' => 'nullable|date',
            'reference_id' => 'nullable|string',
            'status' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_percent' => 'nullable|numeric|min:0',
            'items.*.discount_percent' => 'nullable|numeric|min:0|max:100',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'shipping_amount' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $subtotal = 0;
            $vatAmount = 0;

            foreach ($validated['items'] as $item) {
                $lineSubtotal = $item['quantity'] * $item['unit_price'];
                $lineDiscountAmt = $lineSubtotal * (($item['discount_percent'] ?? 0) / 100);
                $lineTaxable = $lineSubtotal - $lineDiscountAmt;
                $lineTax = $lineTaxable * (($item['tax_percent'] ?? 5) / 100);
                $subtotal += $lineTaxable;
                $vatAmount += $lineTax;
            }

            $discountPercent = $validated['discount_percent'] ?? 0;
            $shippingAmount = $validated['shipping_amount'] ?? 0;
            $headerDiscountAmt = $subtotal * ($discountPercent / 100);

            $purchaseBill->update([
                'supplier_id' => $validated['supplier_id'],
                'date' => $validated['date'],
                'due_date' => $validated['due_date'] ?? null,
                'reference_id' => $validated['reference_id'] ?? null,
                'subtotal' => $subtotal,
                'vat_amount' => $vatAmount,
                'total' => $subtotal - $headerDiscountAmt + $vatAmount + $shippingAmount,
                'status' => $validated['status'] ?? $purchaseBill->status,
                'tags' => array_key_exists('tags', $validated) ? $validated['tags'] : $purchaseBill->tags,
                'notes' => array_key_exists('notes', $validated) ? $validated['notes'] : $purchaseBill->notes,
                'terms' => array_key_exists('terms', $validated) ? $validated['terms'] : $purchaseBill->terms,
                'discount_percent' => $discountPercent,
                'shipping_amount' => $shippingAmount,
            ]);

            // Sync items (delete row-by-row so stock-reversal model events fire)
            $purchaseBill->items()->get()->each->delete();
            foreach ($validated['items'] as $item) {
                $lineSubtotal = $item['quantity'] * $item['unit_price'];
                $lineDiscountPercent = $item['discount_percent'] ?? 0;
                $lineDiscountAmt = $lineSubtotal * ($lineDiscountPercent / 100);
                $lineTaxable = $lineSubtotal - $lineDiscountAmt;
                $lineTax = $lineTaxable * (($item['tax_percent'] ?? 5) / 100);

                PurchaseBillItem::create([
                    'purchase_bill_id' => $purchaseBill->id,
                    'product_id' => $item['product_id'] ?? null,
                    'product_name' => $item['product_name'] ?? $item['description'],
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_percent' => $item['tax_percent'] ?? 5,
                    'tax_amount' => $lineTax,
                    'discount_percent' => $lineDiscountPercent,
                    'discount_amount' => $lineDiscountAmt,
                    'total' => $lineTaxable + $lineTax,
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

    /**
     * Lightweight update for fields editable directly from the detail sidebar
     * (status, tags) without requiring the full item list.
     */
    public function quickUpdate(Request $request, PurchaseBill $purchaseBill)
    {
        $validated = $request->validate([
            'status' => 'nullable|string',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
        ]);

        $purchaseBill->update(array_filter($validated, fn ($v, $k) => $request->has($k), ARRAY_FILTER_USE_BOTH));

        return response()->json($purchaseBill->load(['supplier', 'items.product', 'user']));
    }

    public function duplicate(Request $request, PurchaseBill $purchaseBill)
    {
        $purchaseBill->load('items');

        DB::beginTransaction();
        try {
            $billNumber = $this->nextBillNumber();

            $copy = PurchaseBill::create([
                'bill_number' => $billNumber,
                'supplier_id' => $purchaseBill->supplier_id,
                'user_id' => $request->user()->id,
                'date' => Carbon::now()->toDateString(),
                'due_date' => $purchaseBill->due_date,
                'reference_id' => $purchaseBill->reference_id,
                'subtotal' => $purchaseBill->subtotal,
                'vat_amount' => $purchaseBill->vat_amount,
                'total' => $purchaseBill->total,
                'status' => 'unpaid',
                'tags' => $purchaseBill->tags,
                'notes' => $purchaseBill->notes,
                'terms' => $purchaseBill->terms,
                'discount_percent' => $purchaseBill->discount_percent,
                'shipping_amount' => $purchaseBill->shipping_amount,
            ]);

            foreach ($purchaseBill->items as $item) {
                PurchaseBillItem::create([
                    'purchase_bill_id' => $copy->id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product_name,
                    'description' => $item->description,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'tax_percent' => $item->tax_percent,
                    'tax_amount' => $item->tax_amount,
                    'discount_percent' => $item->discount_percent,
                    'discount_amount' => $item->discount_amount,
                    'total' => $item->total,
                ]);
            }

            DB::commit();

            return response()->json($copy->load(['supplier', 'items']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to duplicate purchase bill', 'error' => $e->getMessage()], 500);
        }
    }

    public function uploadAttachment(Request $request, PurchaseBill $purchaseBill)
    {
        $request->validate([
            'file' => 'required|file|max:10240',
        ]);

        $path = $request->file('file')->store('purchase-bill-attachments', 'public');

        $attachments = $purchaseBill->attachments ?? [];
        $attachments[] = [
            'name' => $request->file('file')->getClientOriginalName(),
            'path' => $path,
            'size' => $request->file('file')->getSize(),
            'uploaded_at' => now()->toIso8601String(),
        ];

        $purchaseBill->update(['attachments' => $attachments]);

        return response()->json($purchaseBill->fresh());
    }

    public function removeAttachment(Request $request, PurchaseBill $purchaseBill, int $index)
    {
        $attachments = $purchaseBill->attachments ?? [];
        if (isset($attachments[$index])) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($attachments[$index]['path']);
            unset($attachments[$index]);
            $purchaseBill->update(['attachments' => array_values($attachments)]);
        }

        return response()->json($purchaseBill->fresh());
    }

    /**
     * Next bill number, without persisting anything — e.g. for the create-form
     * to show what the number will be before the user saves.
     */
    public function previewNextNumber(Request $request)
    {
        return response()->json(['number' => $this->nextBillNumber()]);
    }

    /**
     * PB-{Ymd}-{3-digit sequence}, sequence based on today's created_at count
     * (mirrors the scheme originally inlined in store()).
     */
    private function nextBillNumber(): string
    {
        $date = Carbon::now()->format('Ymd');
        $count = PurchaseBill::whereDate('created_at', Carbon::today())->count() + 1;

        return 'PB-' . $date . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
    }
}
