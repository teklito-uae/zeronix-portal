<?php

namespace App\Http\Controllers;

use App\Models\SupplierPaymentReceipt;
use App\Models\PurchaseBill;
use Illuminate\Http\Request;

class SupplierPaymentReceiptController extends Controller
{
    public function index(Request $request)
    {
        $query = SupplierPaymentReceipt::with(['supplier', 'purchaseBill']);

        if ($request->supplier_id) {
            $query->where('supplier_id', $request->supplier_id);
        }

        if ($request->search) {
            $query->where('receipt_number', 'like', "%{$request->search}%")
                  ->orWhereHas('supplier', function ($q) use ($request) {
                      $q->where('name', 'like', "%{$request->search}%");
                  });
        }

        return $query->latest()->paginate($request->per_page ?? 15);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'purchase_bill_id' => 'nullable|exists:purchase_bills,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'amount' => 'required|numeric|min:0',
            'payment_date' => 'required|date',
            'payment_method' => 'required|in:cash,bank',
            'reference_id' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $receipt = SupplierPaymentReceipt::create($validated);

        if ($receipt->purchase_bill_id) {
            $bill = PurchaseBill::find($receipt->purchase_bill_id);
            if ($bill) {
                $totalPaid = SupplierPaymentReceipt::where('purchase_bill_id', $bill->id)->sum('amount');
                if ($totalPaid >= $bill->total) {
                    $bill->update(['status' => 'paid']);
                } else {
                    $bill->update(['status' => 'partial']);
                }
            }
        }

        return response()->json($receipt, 201);
    }

    public function show(Request $request, SupplierPaymentReceipt $supplierPaymentReceipt)
    {
        return $supplierPaymentReceipt->load(['supplier', 'purchaseBill']);
    }

    public function update(Request $request, SupplierPaymentReceipt $supplierPaymentReceipt)
    {
        $validated = $request->validate([
            'amount' => 'sometimes|required|numeric|min:0',
            'payment_date' => 'sometimes|required|date',
            'payment_method' => 'sometimes|required|in:cash,bank',
            'reference_id' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $supplierPaymentReceipt->update($validated);

        return response()->json($supplierPaymentReceipt);
    }

    public function destroy(SupplierPaymentReceipt $supplierPaymentReceipt)
    {
        $supplierPaymentReceipt->delete();
        return response()->json(null, 204);
    }
}
