<?php

namespace App\Traits;

use App\Models\Template;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Carbon;

trait GeneratesPdf
{
    /**
     * Replaces placeholders in the HTML string with actual values.
     *
     * @param string $html
     * @param mixed $model
     * @param string $type ('quote', 'invoice', 'sales_order', 'payment_slip', 'purchase_bill', 'delivery_note')
     * @return string
     */
    protected function renderPdfHtml(string $html, $model, string $type)
    {
        $company = $model->company;
        $settings = $company ? $company->settings : [];

        // Formatting currency
        $currency = $settings['currency'] ?? 'USD';

        // Determine if it's a supplier document or customer document
        $isSupplier = $type === 'purchase_bill';
        
        // Find relation
        $contact = $isSupplier ? $model->supplier : ($model->customer ?? null);

        // Base mappings
        $replace = [
            // Company / Brand Settings overrides
            '{brand_color}' => $settings['primary_color'] ?? '#0F52BA',
            '{company_name}' => $settings['company_name'] ?? ($company->name ?? 'Zeronix Portal'),
            '{company_email}' => $settings['company_email'] ?? ($company->email ?? ''),
            '{company_phone}' => $settings['company_phone'] ?? ($company->phone ?? ''),
            '{company_address}' => $settings['company_address'] ?? '',
            '{tax_number_label}' => $settings['tax_number_label'] ?? 'TRN',
            '{tax_number}' => $settings['tax_number'] ?? ($company->tax_number ?? ''),
            '{bank_details}' => nl2br(htmlspecialchars($settings['bank_details'] ?? '')),
            '{terms_conditions}' => nl2br(htmlspecialchars($settings['terms_conditions'] ?? '')),

            // Customer
            '{customer_name}' => $contact ? $contact->name : 'N/A',
            '{customer_company}' => $contact ? $contact->company : 'N/A',
            '{customer_email}' => $contact ? $contact->email : 'N/A',
            '{customer_address}' => $contact && isset($contact->address) ? $contact->address : 'N/A',

            // Supplier
            '{supplier_name}' => $contact ? $contact->name : 'N/A',
            '{supplier_company}' => $contact ? $contact->company : 'N/A',
            '{supplier_email}' => $contact ? $contact->email : 'N/A',
            '{supplier_phone}' => $contact && isset($contact->phone) ? $contact->phone : 'N/A',
            '{supplier_address}' => $contact && isset($contact->address) ? $contact->address : 'N/A',

            // Common Data
            '{date}' => isset($model->date) ? Carbon::parse($model->date)->format('M d, Y') : '',
            '{subtotal}' => isset($model->subtotal) ? number_format($model->subtotal, 2) . ' ' . $currency : '0.00 ' . $currency,
            '{vat_amount}' => isset($model->vat_amount) ? number_format($model->vat_amount, 2) . ' ' . $currency : (isset($model->tax_amount) ? number_format($model->tax_amount, 2) . ' ' . $currency : '0.00 ' . $currency),
            '{total_amount}' => isset($model->total) ? number_format($model->total, 2) . ' ' . $currency : '0.00 ' . $currency,
            '{total_in_words}' => isset($model->total) ? \App\Helpers\NumberHelper::toWords($model->total) : '',
        ];

        // Logo
        $logoBase64 = '';
        if (!empty($settings['logo_path'])) {
            try {
                // Correctly resolve the path from storage/app/public directly
                $relativePath = str_replace('/storage/', '', $settings['logo_path']);
                $path = storage_path('app/public/' . $relativePath);
                // Ensure correct directory separators for DomPDF on Windows
                $path = str_replace('\\', '/', $path);
                if (file_exists($path)) {
                    // Use absolute local file path instead of base64
                    // This is much faster and more reliable for DomPDF
                    $replace['{logo}'] = '<img src="' . $path . '" style="max-height:60px; max-width:200px;" alt="Logo" />';
                    $replace['{logo_url}'] = $path;
                } else {
                    $replace['{logo}'] = '<h2 style="color:'.$replace['{brand_color}'].'; margin:0;">' . $replace['{company_name}'] . '</h2>';
                    $replace['{logo_url}'] = '';
                }
            } catch (\Exception $e) {
                $replace['{logo}'] = '<h2 style="color:'.$replace['{brand_color}'].'; margin:0;">' . $replace['{company_name}'] . '</h2>';
                $replace['{logo_url}'] = '';
            }
        } else {
            $replace['{logo}'] = '<h2 style="color:'.$replace['{brand_color}'].'; margin:0;">' . $replace['{company_name}'] . '</h2>';
            $replace['{logo_url}'] = '';
        }

        // Type specific mappings
        if ($type === 'quote') {
            $replace['{quote_number}'] = $model->quote_number;
            $replace['{valid_until}'] = $model->valid_until ? Carbon::parse($model->valid_until)->format('M d, Y') : 'N/A';
        } elseif ($type === 'invoice') {
            $replace['{invoice_number}'] = $model->invoice_number;
            $replace['{due_date}'] = $model->due_date ? Carbon::parse($model->due_date)->format('M d, Y') : 'N/A';
        } elseif ($type === 'sales_order') {
            $replace['{order_number}'] = $model->order_number;
        } elseif ($type === 'payment_slip') {
            $replace['{receipt_number}'] = $model->receipt_number;
            $replace['{payment_date}'] = $model->payment_date ? Carbon::parse($model->payment_date)->format('M d, Y') : 'N/A';
            $replace['{payment_method}'] = $model->payment_method;
            $replace['{reference_id}'] = $model->reference_id ?? 'N/A';
            $replace['{amount}'] = number_format($model->amount, 2) . ' ' . $currency;
            $replace['{amount_in_words}'] = \App\Helpers\NumberHelper::toWords($model->amount);
            $replace['{invoice_number}'] = $model->invoice ? $model->invoice->invoice_number : 'N/A';
            $replace['{notes}'] = $model->notes ?? '';
        } elseif ($type === 'purchase_bill') {
            $replace['{bill_number}'] = $model->bill_number;
            $replace['{due_date}'] = $model->due_date ? Carbon::parse($model->due_date)->format('M d, Y') : 'N/A';
        } elseif ($type === 'delivery_note') {
            $replace['{delivery_number}'] = $model->delivery_number;
            $replace['{delivery_date}'] = $model->delivery_date ? Carbon::parse($model->delivery_date)->format('M d, Y') : 'N/A';
            $replace['{order_reference}'] = $model->salesOrder ? $model->salesOrder->order_number : 'N/A';
        }

        // Generate Items HTML (just the rows)
        $itemsHtml = '';
        if (isset($model->items)) {
            foreach ($model->items as $index => $item) {
                // Determine item name based on relation or field
                $itemName = $item->product_name ?? ($item->product->name ?? 'Product');
                $desc = nl2br(htmlspecialchars($item->description ?? ''));
                $qty = isset($item->quantity) ? number_format($item->quantity, 2) : (isset($item->delivered_quantity) ? $item->delivered_quantity : 1);
                $price = isset($item->unit_price) ? number_format($item->unit_price, 2) : 0.00;
                $vat = isset($item->tax_amount) ? number_format($item->tax_amount, 2) : (isset($item->total) ? number_format($item->total * 0.05, 2) : 0.00);
                $total = isset($item->total) ? number_format($item->total, 2) : 0.00;
                
                if ($type === 'delivery_note') {
                    $itemsHtml .= '<tr class="item-row" style="page-break-inside: avoid;">
                        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 10px;">' . ($index + 1) . '</td>
                        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 10px;">
                            <div style="font-weight: 700; color: #111827;">' . $itemName . '</div>
                            <div style="font-size: 9px; color: #6b7280; line-height: 1.2;">' . $desc . '</div>
                        </td>
                        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 10px;">' . $qty . '</td>
                        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 10px;">' . $qty . '</td>
                    </tr>';
                } else {
                    $itemsHtml .= '<tr class="item-row" style="page-break-inside: avoid;">
                        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 10px;">' . ($index + 1) . '</td>
                        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 10px;">
                            <div style="font-weight: 700; color: #111827;">' . $itemName . '</div>
                            <div style="font-size: 9px; color: #6b7280; line-height: 1.2;">' . $desc . '</div>
                        </td>
                        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 10px;">' . $qty . '</td>
                        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 10px;">' . $price . '</td>
                        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 10px;">' . $vat . '</td>
                        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 10px;">' . $total . '</td>
                    </tr>';
                }
            }
        }
        $replace['{items}'] = $itemsHtml;

        // Prepare Tax Summary Table
        if (isset($model->subtotal)) {
            $taxSummaryHtml = '<table style="width: 100%; margin-top: 15px; page-break-inside: avoid;">
                <thead>
                    <tr style="background: #f9fafb;">
                        <th style="padding: 6px 12px; text-align: left; border-bottom: 2px solid #eee; font-size: 9px;">Tax Details</th>
                        <th style="padding: 6px 12px; text-align: right; border-bottom: 2px solid #eee; font-size: 9px;">Taxable Amount</th>
                        <th style="padding: 10px 12px; text-align: right; border-bottom: 2px solid #eee; font-size: 9px;">Tax Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding: 6px 12px; border-bottom: 1px solid #eee; font-size: 9px;">Standard Rate (5%)</td>
                        <td style="padding: 6px 12px; border-bottom: 1px solid #eee; text-align: right; font-size: 9px;">' . number_format($model->subtotal, 2) . ' ' . $currency . '</td>
                        <td style="padding: 6px 12px; border-bottom: 1px solid #eee; text-align: right; font-size: 9px;">' . number_format($model->vat_amount ?? ($model->tax_amount ?? 0), 2) . ' ' . $currency . '</td>
                    </tr>
                </tbody>
            </table>';
            $replace['{tax_summary}'] = $taxSummaryHtml;
        } else {
            $replace['{tax_summary}'] = '';
        }

        foreach ($replace as $key => $val) {
            $html = str_replace($key, $val, $html);
        }

        return $html;
    }

    protected function generatePdfResponse($model, string $type, string $action)
    {
        $template = Template::where('type', $type)->where('is_default', true)->first();
        if (!$template) {
            $template = Template::where('type', $type)->first();
        }

        $htmlContent = $template ? $template->content : '<h1>{company_name}</h1><p>Missing template for ' . $type . '</p>';
        $html = $this->renderPdfHtml($htmlContent, $model, $type);

        $pdf = Pdf::loadHTML($html)->setPaper('a4', 'portrait');

        if ($type === 'quote') {
            $filename = "Quote-{$model->quote_number}.pdf";
        } elseif ($type === 'invoice') {
            $filename = "Invoice-{$model->invoice_number}.pdf";
        } elseif ($type === 'sales_order') {
            $filename = "Sales-Order-{$model->order_number}.pdf";
        } elseif ($type === 'payment_slip') {
            $filename = "Receipt-{$model->receipt_number}.pdf";
        } elseif ($type === 'purchase_bill') {
            $filename = "Purchase-Bill-{$model->bill_number}.pdf";
        } elseif ($type === 'delivery_note') {
            $filename = "Delivery-Note-{$model->delivery_number}.pdf";
        } else {
            $filename = "Document.pdf";
        }

        if ($action === 'download') {
            return $pdf->download($filename);
        }

        return $pdf->stream($filename);
    }
}
