<?php

namespace App\Http\Controllers;

use App\Models\SupplierPaymentReceipt;
use App\Models\PurchaseBill;
use App\Mail\SupplierPaymentReceiptMail;
use App\Traits\GeneratesPdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class SupplierPaymentReceiptController extends Controller
{
    use GeneratesPdf;

    public function index(Request $request)
    {
        $query = SupplierPaymentReceipt::with(['supplier', 'purchaseBill']);

        if ($request->supplier_id) {
            $query->where('supplier_id', $request->supplier_id);
        }

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('receipt_number', 'like', "%{$search}%")
                  ->orWhereHas('supplier', function ($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%");
                  });
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

        if (!empty($validated['purchase_bill_id'])) {
            $bill = PurchaseBill::find($validated['purchase_bill_id']);
            if ($bill && $validated['amount'] > $bill->balance + 0.01) {
                return response()->json([
                    'message' => 'Payment amount exceeds the outstanding balance on this bill.',
                    'errors' => ['amount' => ['Payment amount exceeds the outstanding balance on this bill.']],
                ], 422);
            }
        }

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

        if ($supplierPaymentReceipt->purchase_bill_id && array_key_exists('amount', $validated)) {
            $bill = PurchaseBill::find($supplierPaymentReceipt->purchase_bill_id);
            if ($bill) {
                $availableBalance = $bill->balance + $supplierPaymentReceipt->amount;
                if ($validated['amount'] > $availableBalance + 0.01) {
                    return response()->json([
                        'message' => 'Payment amount exceeds the outstanding balance on this bill.',
                        'errors' => ['amount' => ['Payment amount exceeds the outstanding balance on this bill.']],
                    ], 422);
                }
            }
        }

        $supplierPaymentReceipt->update($validated);

        return response()->json($supplierPaymentReceipt);
    }

    public function destroy(SupplierPaymentReceipt $supplierPaymentReceipt)
    {
        $supplierPaymentReceipt->delete();
        return response()->json(null, 204);
    }

    public function sendEmail($id)
    {
        try {
            $receipt = SupplierPaymentReceipt::with(['supplier', 'purchaseBill', 'company'])->findOrFail($id);
            \App\Services\MailConfigService::applyUserSmtp(request()->user());

            $pdfContent = $this->generatePdfOutput($receipt, 'supplier_payment_slip');
            $filename = $this->pdfFilename($receipt, 'supplier_payment_slip');

            Mail::to($receipt->supplier->email)->send(new SupplierPaymentReceiptMail($receipt, $pdfContent, $filename));

            return response()->json(['message' => 'Email sent successfully.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to send email', 'error' => $e->getMessage()], 500);
        }
    }
}
