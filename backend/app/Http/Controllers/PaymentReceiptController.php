<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\PaymentReceipt;
use App\Mail\PaymentReceiptMail;
use App\Traits\GeneratesPdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class PaymentReceiptController extends Controller
{
    use GeneratesPdf;

    public function index(Request $request)
    {
        $query = PaymentReceipt::with(['customer', 'invoice']);

        // Data Scoping: Salesmen see only receipts for their own customers
        if ($request->user() && $request->user()->role !== 'admin') {
            $query->whereHas('customer', function($q) use ($request) {
                $q->where('user_id', $request->user()->id);
            });
        }

        if ($request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('payment_method') && $request->payment_method !== 'all') {
            $query->where('payment_method', $request->payment_method);
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('receipt_number', 'like', "%{$request->search}%")
                  ->orWhereHas('customer', function($cq) use ($request) {
                      $cq->where('name', 'like', "%{$request->search}%")
                        ->orWhere('company', 'like', "%{$request->search}%");
                  })
                  ->orWhereHas('invoice', function($iq) use ($request) {
                      $iq->where('invoice_number', 'like', "%{$request->search}%");
                  });
            });
        }

        return $query->latest()->paginate($request->per_page ?? 15);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'invoice_id' => 'nullable|exists:invoices,id',
            'customer_id' => 'required|exists:customers,id',
            'amount' => 'required|numeric|min:0',
            'payment_date' => 'required|date',
            'payment_method' => 'required|in:cash,bank',
            'reference_id' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        if (!empty($validated['invoice_id'])) {
            $invoice = Invoice::find($validated['invoice_id']);
            if ($invoice && $validated['amount'] > $invoice->balance + 0.01) {
                return response()->json([
                    'message' => 'Payment amount exceeds the remaining balance on the linked invoice.',
                ], 422);
            }
        }

        $receipt = PaymentReceipt::create($validated);

        // Payment state (paid/partially_paid/overdue/unpaid) is computed from
        // receipts via Invoice::getPaymentStatusAttribute() — nothing to write
        // back to the invoice's workflow `status` here.

        // Notify Customer
        if ($receipt->customer) {
            $slug = \Illuminate\Support\Str::slug($receipt->customer->company ?? 'company');
            $currency = $receipt->company->settings['currency'] ?? 'USD';
            $receipt->customer->notify(new \App\Notifications\SystemNotification([
                'title' => 'Payment Received',
                'message' => "We have received your payment of " . number_format($receipt->amount, 2) . " {$currency}.",
                'type' => 'success',
                'action_url' => "/portal/{$slug}/invoices"
            ]));
        }

        return response()->json($receipt, 201);
    }

    public function show(Request $request, PaymentReceipt $receipt)
    {
        $receipt->load(['customer', 'invoice']);

        if ($request->user() && $request->user()->role === 'salesman') {
            if (!$receipt->customer->assigned_users()->where('users.id', $request->user()->id)->exists()) {
                abort(403);
            }
        }

        return $receipt;
    }

    public function update(Request $request, PaymentReceipt $paymentReceipt)
    {
        $validated = $request->validate([
            'amount' => 'sometimes|required|numeric|min:0',
            'payment_date' => 'sometimes|required|date',
            'payment_method' => 'sometimes|required|in:cash,bank',
            'reference_id' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        if ($paymentReceipt->invoice_id && array_key_exists('amount', $validated)) {
            $invoice = $paymentReceipt->invoice ?: Invoice::find($paymentReceipt->invoice_id);
            if ($invoice) {
                $availableHeadroom = $invoice->balance + $paymentReceipt->amount;
                if ($validated['amount'] > $availableHeadroom + 0.01) {
                    return response()->json([
                        'message' => 'Payment amount exceeds the remaining balance on the linked invoice.',
                    ], 422);
                }
            }
        }

        $paymentReceipt->update($validated);

        return response()->json($paymentReceipt);
    }

    public function destroy(PaymentReceipt $paymentReceipt)
    {
        $paymentReceipt->delete();
        return response()->json(null, 204);
    }

    public function sendEmail($id)
    {
        try {
            $receipt = is_numeric($id)
                ? PaymentReceipt::with(['customer', 'invoice', 'company'])->findOrFail($id)
                : PaymentReceipt::with(['customer', 'invoice', 'company'])->where('receipt_number', $id)->firstOrFail();
            \App\Services\MailConfigService::applyUserSmtp(request()->user());

            $pdfContent = $this->generatePdfOutput($receipt, 'payment_slip');
            $filename = $this->pdfFilename($receipt, 'payment_slip');

            Mail::to($receipt->customer->email)->send(new PaymentReceiptMail($receipt, $pdfContent, $filename));

            return response()->json(['message' => 'Email sent successfully.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to send email', 'error' => $e->getMessage()], 500);
        }
    }
}
