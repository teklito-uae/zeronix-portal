<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Quote;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    /**
     * Download Invoice PDF
     */
    public function downloadInvoice($id)
    {
        return $this->generatePdf($id, 'invoice', 'download');
    }

    /**
     * Preview Invoice PDF
     */
    public function previewInvoice($id)
    {
        return $this->generatePdf($id, 'invoice', 'stream');
    }

    public function publicViewQuote($number)
    {
        $quote = Quote::where('quote_number', $number)->firstOrFail();
        return $this->generatePdf($quote->id, 'quote', 'stream');
    }

    public function publicDownloadQuote($number)
    {
        $quote = Quote::where('quote_number', $number)->firstOrFail();
        return $this->generatePdf($quote->id, 'quote', 'download');
    }

    public function publicViewInvoice($number)
    {
        $invoice = Invoice::where('invoice_number', $number)->firstOrFail();
        return $this->generatePdf($invoice->id, 'invoice', 'stream');
    }

    public function publicDownloadInvoice($number)
    {
        $invoice = Invoice::where('invoice_number', $number)->firstOrFail();
        return $this->generatePdf($invoice->id, 'invoice', 'download');
    }

    /**
     * Download Quotation PDF
     */
    public function downloadQuote($id)
    {
        return $this->generatePdf($id, 'quote', 'download');
    }

    /**
     * Preview Quotation PDF
     */
    public function previewQuote($id)
    {
        return $this->generatePdf($id, 'quote', 'stream');
    }

    public function downloadReceipt($id)
    {
        return $this->generateReceiptPdf($id, 'download');
    }

    public function previewReceipt($id)
    {
        return $this->generateReceiptPdf($id, 'stream');
    }

    /**
     * Customer side secure download
     */
    public function customerDownloadInvoice(Request $request, $id)
    {
        $invoice = Invoice::findOrFail($id);
        if ($invoice->customer_id != $request->user()->id) {
            abort(403, 'Unauthorized access to this document.');
        }
        return $this->generatePdf($id, 'invoice', 'download');
    }

    public function customerPreviewInvoice(Request $request, $id)
    {
        $invoice = Invoice::findOrFail($id);
        if ($invoice->customer_id != $request->user()->id) {
            abort(403, 'Unauthorized access to this document.');
        }
        return $this->generatePdf($id, 'invoice', 'stream');
    }

    public function customerDownloadQuote(Request $request, $id)
    {
        $quote = Quote::findOrFail($id);
        if ($quote->customer_id != $request->user()->id) {
            abort(403, 'Unauthorized access to this document.');
        }
        return $this->generatePdf($id, 'quote', 'download');
    }

    public function customerPreviewQuote(Request $request, $id)
    {
        $quote = Quote::findOrFail($id);
        if ($quote->customer_id != $request->user()->id) {
            abort(403, 'Unauthorized access to this document.');
        }
        return $this->generatePdf($id, 'quote', 'stream');
    }

    /**
     * Internal helper to generate PDF
     */
    private function generatePdf($id, $type, $action)
    {
        if ($type === 'invoice') {
            $model = Invoice::with(['customer', 'items.product'])->findOrFail($id);
            $template = \App\Models\Template::where('type', 'invoice')->where('is_default', true)->first() 
                ?? \App\Models\Template::where('type', 'invoice')->first();
            $filename = "Zeronix-Invoice-{$model->invoice_number}.pdf";
        } else {
            $model = Quote::with(['customer', 'items.product'])->findOrFail($id);
            $template = \App\Models\Template::where('type', 'quote')->where('is_default', true)->first() 
                ?? \App\Models\Template::where('type', 'quote')->first();
            $filename = "Zeronix-Quote-{$model->quote_number}.pdf";
        }

        $html = $template->content;
        
        // Prepare items HTML
        $itemsHtml = '';
        foreach ($model->items as $index => $item) {
            $itemVat = $item->total * 0.05;
            $itemsHtml .= "<tr class='item-row'>
                <td style='padding: 6px 12px; border-bottom: 1px solid #eee;'>" . ($index + 1) . "</td>
                <td style='padding: 6px 12px; border-bottom: 1px solid #eee;'>
                    <div style='font-weight: 700; color: #111827;'>" . ($item->product_name ?? ($item->product->name ?? 'Product')) . "</div>
                    <div style='font-size: 9px; color: #6b7280; line-height: 1.2;'>" . nl2br(e($item->description)) . "</div>
                </td>
                <td style='padding: 6px 12px; border-bottom: 1px solid #eee; text-align: center;'>" . number_format($item->quantity, 2) . "</td>
                <td style='padding: 6px 12px; border-bottom: 1px solid #eee; text-align: right;'>" . number_format($item->unit_price, 2) . "</td>
                <td style='padding: 6px 12px; border-bottom: 1px solid #eee; text-align: right;'>" . number_format($itemVat, 2) . "</td>
                <td style='padding: 6px 12px; border-bottom: 1px solid #eee; text-align: right;'>" . number_format($item->total, 2) . "</td>
            </tr>";
        }

        // Prepare Tax Summary Table
        $taxSummaryHtml = "<table style='width: 100%; margin-top: 15px;'>
            <thead>
                <tr style='background: #f9fafb;'>
                    <th style='padding: 6px 12px; text-align: left; border-bottom: 2px solid #eee; font-size: 9px;'>Tax Details</th>
                    <th style='padding: 6px 12px; text-align: right; border-bottom: 2px solid #eee; font-size: 9px;'>Taxable Amount</th>
                    <th style='padding: 10px 12px; text-align: right; border-bottom: 2px solid #eee; font-size: 9px;'>Tax Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style='padding: 6px 12px; border-bottom: 1px solid #eee; font-size: 9px;'>Standard Rate (5%)</td>
                    <td style='padding: 6px 12px; border-bottom: 1px solid #eee; text-align: right; font-size: 9px;'>" . number_format($model->subtotal, 2) . " AED</td>
                    <td style='padding: 6px 12px; border-bottom: 1px solid #eee; text-align: right; font-size: 9px;'>" . number_format($model->vat_amount, 2) . " AED</td>
                </tr>
                <tr style='font-weight: bold;'>
                    <td style='padding: 6px 12px; font-size: 9px;'>Total</td>
                    <td style='padding: 6px 12px; text-align: right; font-size: 9px;'>" . number_format($model->subtotal, 2) . " AED</td>
                    <td style='padding: 6px 12px; text-align: right; font-size: 9px;'>" . number_format($model->vat_amount, 2) . " AED</td>
                </tr>
            </tbody>
        </table>";

        // Prepare Logo
        $logoPath = public_path('images/logo.png');
        $logoBase64 = '';
        if (file_exists($logoPath)) {
            $logoData = file_get_contents($logoPath);
            $logoBase64 = 'data:image/png;base64,' . base64_encode($logoData);
        }

        // Prepare View URL
        $docNumber = $model->quote_number ?? $model->invoice_number;
        $docType = $type === 'quote' ? 'quote' : 'invoice';
        $viewUrl = url("/api/view/{$docType}/{$docNumber}");

        // Replace placeholders
        $replacements = [
            '{logo_url}' => $logoBase64,
            '{view_url}' => $viewUrl,
            '{quote_number}' => $model->quote_number ?? '',
            '{invoice_number}' => $model->invoice_number ?? '',
            '{customer_name}' => $model->customer->name ?? '',
            '{customer_company}' => $model->customer->company ?? '',
            '{customer_email}' => $model->customer->email ?? '',
            '{customer_address}' => nl2br(e($model->customer->address ?? '')),
            '{date}' => \Carbon\Carbon::parse($model->date)->format('d M Y'),
            '{valid_until}' => isset($model->valid_until) ? \Carbon\Carbon::parse($model->valid_until)->format('d M Y') : '',
            '{due_date}' => isset($model->due_date) ? \Carbon\Carbon::parse($model->due_date)->format('d M Y') : '',
            '{subtotal}' => number_format($model->subtotal, 2) . ' AED',
            '{vat_amount}' => number_format($model->vat_amount, 2) . ' AED',
            '{total_amount}' => number_format($model->total, 2) . ' AED',
            '{total_in_words}' => \App\Helpers\NumberHelper::toWords($model->total),
            '{items}' => $itemsHtml,
            '{tax_summary}' => $taxSummaryHtml,
        ];

        foreach ($replacements as $key => $value) {
            $html = str_replace($key, $value, $html);
        }

        try {
            $pdf = Pdf::loadHTML($html)->setPaper('a4', 'portrait');

            if ($action === 'stream' || $action === 'view') {
                return $pdf->stream($filename);
            }

            return $pdf->download($filename);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'PDF Generation Failed',
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    private function generateReceiptPdf($id, $action)
    {
        $receipt = \App\Models\PaymentReceipt::with(['customer', 'invoice'])->findOrFail($id);
        
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
        $filename = "Receipt-{$receipt->receipt_number}.pdf";

        if ($action === 'stream') {
            return $pdf->stream($filename);
        }
        return $pdf->download($filename);
    }
}
