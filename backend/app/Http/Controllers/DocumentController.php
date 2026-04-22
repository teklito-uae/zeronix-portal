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

    /**
     * Internal helper to generate PDF
     */
    private function generatePdf($id, $type, $action)
    {
        error_reporting(0);
        if (ob_get_length()) ob_end_clean();

        if ($type === 'invoice') {
            $model = Invoice::with(['customer', 'items'])->findOrFail($id);
            $view = 'pdf.invoice';
            $filename = "Zeronix-Invoice-{$model->invoice_number}.pdf";
            $data = ['invoice' => $model];
        } else {
            $model = Quote::with(['customer', 'items'])->findOrFail($id);
            $view = 'pdf.quote';
            $filename = "Zeronix-Quote-{$model->quote_number}.pdf";
            $data = ['quote' => $model];
        }

        $pdf = Pdf::loadView($view, $data)->setPaper('a4', 'portrait');

        if ($action === 'stream') {
            return $pdf->stream($filename);
        }

        return $pdf->download($filename);
    }
}
