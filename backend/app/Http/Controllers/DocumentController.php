<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Quote;
use App\Models\SalesOrder;
use App\Models\PaymentReceipt;
use App\Models\PurchaseBill;
use App\Models\Delivery;
use Illuminate\Http\Request;
use App\Traits\GeneratesPdf;

class DocumentController extends Controller
{
    use GeneratesPdf;

    /**
     * Download Invoice PDF
     */
    public function downloadInvoice($id)
    {
        return $this->handlePdfRequest($id, 'invoice', 'download', Invoice::class);
    }

    /**
     * Preview Invoice PDF
     */
    public function previewInvoice($id)
    {
        return $this->handlePdfRequest($id, 'invoice', 'stream', Invoice::class);
    }

    public function publicViewQuote($number)
    {
        $quote = Quote::where('quote_number', $number)->firstOrFail();
        return $this->handlePdfRequest($quote->id, 'quote', 'stream', Quote::class);
    }

    public function publicDownloadQuote($number)
    {
        $quote = Quote::where('quote_number', $number)->firstOrFail();
        return $this->handlePdfRequest($quote->id, 'quote', 'download', Quote::class);
    }

    public function publicViewInvoice($number)
    {
        $invoice = Invoice::where('invoice_number', $number)->firstOrFail();
        return $this->handlePdfRequest($invoice->id, 'invoice', 'stream', Invoice::class);
    }

    public function publicDownloadInvoice($number)
    {
        $invoice = Invoice::where('invoice_number', $number)->firstOrFail();
        return $this->handlePdfRequest($invoice->id, 'invoice', 'download', Invoice::class);
    }

    public function downloadQuote($id)
    {
        return $this->handlePdfRequest($id, 'quote', 'download', Quote::class);
    }

    public function previewQuote($id)
    {
        return $this->handlePdfRequest($id, 'quote', 'stream', Quote::class);
    }

    public function downloadReceipt($id)
    {
        return $this->handlePdfRequest($id, 'payment_slip', 'download', PaymentReceipt::class);
    }

    public function previewReceipt($id)
    {
        return $this->handlePdfRequest($id, 'payment_slip', 'stream', PaymentReceipt::class);
    }

    public function downloadSalesOrder($id)
    {
        return $this->handlePdfRequest($id, 'sales_order', 'download', SalesOrder::class);
    }

    public function previewSalesOrder($id)
    {
        return $this->handlePdfRequest($id, 'sales_order', 'stream', SalesOrder::class);
    }

    public function downloadPurchaseBill($id)
    {
        return $this->handlePdfRequest($id, 'purchase_bill', 'download', PurchaseBill::class);
    }

    public function previewPurchaseBill($id)
    {
        return $this->handlePdfRequest($id, 'purchase_bill', 'stream', PurchaseBill::class);
    }

    public function downloadDeliveryNote($id)
    {
        return $this->handlePdfRequest($id, 'delivery_note', 'download', Delivery::class);
    }

    public function previewDeliveryNote($id)
    {
        return $this->handlePdfRequest($id, 'delivery_note', 'stream', Delivery::class);
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
        return $this->handlePdfRequest($id, 'invoice', 'download', Invoice::class);
    }

    public function customerPreviewInvoice(Request $request, $id)
    {
        $invoice = Invoice::findOrFail($id);
        if ($invoice->customer_id != $request->user()->id) {
            abort(403, 'Unauthorized access to this document.');
        }
        return $this->handlePdfRequest($id, 'invoice', 'stream', Invoice::class);
    }

    public function customerDownloadQuote(Request $request, $id)
    {
        $quote = Quote::findOrFail($id);
        if ($quote->customer_id != $request->user()->id) {
            abort(403, 'Unauthorized access to this document.');
        }
        return $this->handlePdfRequest($id, 'quote', 'download', Quote::class);
    }

    public function customerPreviewQuote(Request $request, $id)
    {
        $quote = Quote::findOrFail($id);
        if ($quote->customer_id != $request->user()->id) {
            abort(403, 'Unauthorized access to this document.');
        }
        return $this->handlePdfRequest($id, 'quote', 'stream', Quote::class);
    }

    /**
     * Internal helper to load relations and generate PDF using the trait
     */
    private function handlePdfRequest($id, string $type, string $action, $modelClass)
    {
        // Load appropriate relations based on type
        $relations = ['company'];
        
        if ($type === 'purchase_bill') {
            $relations[] = 'supplier';
            $relations[] = 'items.product';
        } elseif ($type === 'payment_slip') {
            $relations[] = 'customer';
            $relations[] = 'invoice';
        } elseif ($type === 'delivery_note') {
            $relations[] = 'customer';
            $relations[] = 'items.product';
            $relations[] = 'salesOrder';
        } else {
            $relations[] = 'customer';
            $relations[] = 'items.product';
        }

        $model = $modelClass::with($relations)->findOrFail($id);

        try {
            return $this->generatePdfResponse($model, $type, $action);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'PDF Generation Failed',
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }
}
