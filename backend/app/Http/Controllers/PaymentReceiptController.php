<?php

namespace App\Http\Controllers;

use App\Models\PaymentReceipt;
use App\Models\Invoice;
use App\Mail\PaymentReceiptMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Barryvdh\DomPDF\Facade\Pdf;

class PaymentReceiptController extends Controller
{
    public function index(Request $request)
    {
        $query = PaymentReceipt::with(['customer', 'invoice']);

        if ($request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->search) {
            $query->where('receipt_number', 'like', "%{$request->search}%")
                  ->orWhereHas('customer', function($q) use ($request) {
                      $q->where('name', 'like', "%{$request->search}%")
                        ->orWhere('company', 'like', "%{$request->search}%");
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

        $receipt = PaymentReceipt::create($validated);

        // If invoice_id is provided, update invoice status if fully paid
        if ($receipt->invoice_id) {
            $invoice = Invoice::find($receipt->invoice_id);
            if ($invoice) {
                $totalPaid = PaymentReceipt::where('invoice_id', $invoice->id)->sum('amount');
                if ($totalPaid >= $invoice->total) {
                    $invoice->update(['status' => 'paid']);
                } else {
                    $invoice->update(['status' => 'partial']); // Optional: add partial status
                }
            }
        }

        // Notify Customer
        if ($receipt->customer) {
            $slug = \Illuminate\Support\Str::slug($receipt->customer->company ?? 'company');
            $receipt->customer->notify(new \App\Notifications\SystemNotification([
                'title' => 'Payment Received',
                'message' => "We have received your payment of " . number_format($receipt->amount, 2) . " AED.",
                'type' => 'success',
                'action_url' => "/portal/{$slug}/invoices"
            ]));
        }

        return response()->json($receipt, 201);
    }

    public function show(PaymentReceipt $paymentReceipt)
    {
        return $paymentReceipt->load(['customer', 'invoice']);
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
            $receipt = PaymentReceipt::with(['customer', 'invoice'])->findOrFail($id);
            
            $logoPath = public_path('images/logo.png');
            $logoBase64 = '';
            if (file_exists($logoPath)) {
                $logoData = file_get_contents($logoPath);
                $logoBase64 = 'data:image/png;base64,' . base64_encode($logoData);
            }

            $html = "
            <html>
            <head>
                <style>
                    body { font-family: 'Helvetica', sans-serif; color: #333; line-height: 1.6; }
                    .header { border-bottom: 2px solid #10B981; padding-bottom: 20px; margin-bottom: 30px; }
                    .logo { height: 60px; }
                    .title { font-size: 28px; font-weight: bold; color: #10B981; text-transform: uppercase; float: right; margin-top: 10px; }
                    .info-grid { width: 100%; margin-bottom: 40px; }
                    .info-box { width: 48%; display: inline-block; vertical-align: top; }
                    .label { font-size: 10px; font-weight: bold; color: #666; text-transform: uppercase; margin-bottom: 4px; }
                    .value { font-size: 14px; font-weight: bold; }
                    .receipt-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
                    .amount-box { border-top: 2px solid #e2e8f0; padding-top: 20px; margin-top: 20px; text-align: right; }
                    .amount-label { font-size: 12px; font-weight: bold; color: #666; }
                    .amount-value { font-size: 24px; font-weight: bold; color: #10B981; }
                    .footer { position: absolute; bottom: 0; width: 100%; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
                </style>
            </head>
            <body>
                <div class='header'>
                    <img src='{$logoBase64}' class='logo'>
                    <div class='title'>Payment Receipt</div>
                    <div style='clear: both;'></div>
                </div>

                <div class='info-grid'>
                    <div class='info-box'>
                        <div class='label'>Received From</div>
                        <div class='value'>{$receipt->customer->name}</div>
                        <div style='font-size: 12px; color: #64748b;'>{$receipt->customer->company}</div>
                    </div>
                    <div class='info-box' style='text-align: right;'>
                        <div class='label'>Receipt Details</div>
                        <div class='value'># {$receipt->receipt_number}</div>
                        <div style='font-size: 12px; color: #64748b;'>Date: " . \Carbon\Carbon::parse($receipt->payment_date)->format('d M Y') . "</div>
                    </div>
                </div>

                <div class='receipt-box'>
                    <table style='width: 100%;'>
                        <tr>
                            <td style='padding-bottom: 15px;'>
                                <div class='label'>Payment Method</div>
                                <div class='value' style='text-transform: capitalize;'>{$receipt->payment_method}</div>
                            </td>
                            <td style='padding-bottom: 15px; text-align: right;'>
                                <div class='label'>Reference Number</div>
                                <div class='value'>" . ($receipt->reference_id ?? 'N/A') . "</div>
                            </td>
                        </tr>
                        <tr>
                            <td colspan='2' style='padding-top: 15px; border-top: 1px solid #e2e8f0;'>
                                <div class='label'>In Settlement of</div>
                                <div class='value'>" . ($receipt->invoice ? "Invoice # " . $receipt->invoice->invoice_number : "Account Payment") . "</div>
                            </td>
                        </tr>
                    </table>

                    <div class='amount-box'>
                        <div class='amount-label'>Total Amount Received</div>
                        <div class='amount-value'>" . number_format($receipt->amount, 2) . " AED</div>
                    </div>
                </div>

                <div style='margin-top: 50px;'>
                    <div class='label'>Notes</div>
                    <div style='font-size: 12px; color: #475569;'>" . nl2br(e($receipt->notes ?? 'Thank you for your business.')) . "</div>
                </div>

                <div class='footer'>
                    info@zeronix.ae | www.zeronix.ae | Shop Now at www.zeronix.store
                </div>
            </body>
            </html>";

            $pdf = Pdf::loadHTML($html)->setPaper('a4', 'portrait');
            $pdfContent = $pdf->output();
            $filename = "Receipt-{$receipt->receipt_number}.pdf";

            Mail::to($receipt->customer->email)->send(new PaymentReceiptMail($receipt, $pdfContent, $filename));

            return response()->json(['message' => 'Email sent successfully.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to send email', 'error' => $e->getMessage()], 500);
        }
    }
}
