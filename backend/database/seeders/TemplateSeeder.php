<?php

namespace Database\Seeders;

use App\Models\Template;
use Illuminate\Database\Seeder;

class TemplateSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Standard Quote
        Template::updateOrCreate(
            ['key' => 'quote_standard'],
            [
                'name' => 'Standard Quote',
                'type' => 'quote',
                'subject' => 'Quotation from Zeronix: {quote_number}',
                'email_body' => "Dear {customer_name},\n\nPlease find the requested quotation {quote_number} attached to this email.\n\nYou can also view it online here: {view_url}\n\nTotal Amount: {total_amount}\n\nThanks,\nZeronix Team",
                'is_default' => true,
                'content' => $this->getStandardQuoteHtml(),
            ]
        );

        // 2. Standard Invoice
        Template::updateOrCreate(
            ['key' => 'invoice_standard'],
            [
                'name' => 'Standard Invoice',
                'type' => 'invoice',
                'subject' => 'Invoice from Zeronix: {invoice_number}',
                'email_body' => "Dear {customer_name},\n\nPlease find your invoice {invoice_number} attached to this email.\n\nYou can also view it online here: {view_url}\n\nTotal Amount: {total_amount}\n\nThanks,\nZeronix Team",
                'is_default' => true,
                'content' => $this->getStandardInvoiceHtml(),
            ]
        );
    }

    private function getStandardQuoteHtml()
    {
        return <<<'HTML'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Quote #{quote_number}</title>
    <style>
        @page { size: A4; margin: 0; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11px; color: #1f2937; margin: 0; padding: 0; line-height: 1.5; background: #fff; }
        .p-50 { padding: 40px 50px; }
        .bg-theme { background-color: #1db14e; color: #fff; }
        .text-theme { color: #1db14e; }
        
        table { width: 100%; border-collapse: collapse; }
        
        .header { padding: 40px 50px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
        .logo-container { width: 50%; }
        .logo-img { height: 50px; }
        .doc-type-container { width: 50%; text-align: right; }
        .doc-type { font-size: 32px; font-weight: 800; text-transform: uppercase; margin: 0; letter-spacing: 1px; }
        
        .info-section { margin: 30px 0; }
        .info-table td { vertical-align: top; width: 33.33%; }
        .label { font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 5px; }
        .value { font-size: 12px; font-weight: 600; }
        
        .items-table { margin-top: 30px; }
        .items-table th { background: #111827; color: #fff; padding: 12px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; }
        .items-table td { padding: 12px; border-bottom: 1px solid #f3f4f6; }
        .item-row:nth-child(even) { background: #f9fafb; }
        
        .totals-section { margin-top: 30px; }
        .totals-table { width: 300px; margin-left: auto; }
        .totals-table td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
        .totals-table .grand-total { background: #1db14e; color: #fff; font-size: 16px; font-weight: 800; border-bottom: 0; border-radius: 4px; }
        
        .bank-details { margin-top: 50px; padding: 20px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #1db14e; }
        .bank-title { font-size: 12px; font-weight: 800; margin-bottom: 10px; text-transform: uppercase; }
        .bank-grid td { width: 50%; vertical-align: top; font-size: 10px; }
        
        .footer { position: fixed; bottom: 0; width: 100%; padding: 20px 50px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 10px; color: #6b7280; }
        .view-online { margin-top: 15px; font-weight: 700; }
        .view-online a { color: #1db14e; text-decoration: none; }
    </style>
</head>
<body>
    <div class="header">
        <table>
            <tr>
                <td class="logo-container">
                    <img src="{logo_url}" class="logo-img">
                </td>
                <td class="doc-type-container">
                    <h1 class="doc-type text-theme">Quotation</h1>
                    <div style="font-size: 14px; font-weight: 700; margin-top: 5px;">#{quote_number}</div>
                </td>
            </tr>
        </table>
    </div>

    <div class="p-50">
        <div class="info-section">
            <table class="info-table">
                <tr>
                    <td>
                        <div class="label">From</div>
                        <div class="value">Zeronix Technology LLC</div>
                        <div style="color: #4b5563;">BurDubai, Dubai, UAE</div>
                        <div style="color: #4b5563;">TRN: 104865090500003</div>
                    </td>
                    <td>
                        <div class="label">Bill To</div>
                        <div class="value">{customer_name}</div>
                        <div style="color: #4b5563;">{customer_company}</div>
                        <div style="color: #4b5563;">{customer_email}</div>
                    </td>
                    <td style="text-align: right;">
                        <div class="label">Date & Validity</div>
                        <div class="value">Issued: {date}</div>
                        <div class="value" style="color: #dc2626;">Expires: {valid_until}</div>
                    </td>
                </tr>
            </table>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 40px;">#</th>
                    <th>Description</th>
                    <th style="width: 60px; text-align: center;">Qty</th>
                    <th style="width: 100px; text-align: right;">Unit Price</th>
                    <th style="width: 100px; text-align: right;">Total (AED)</th>
                </tr>
            </thead>
            <tbody>
                {items}
            </tbody>
        </table>

        <div class="totals-section">
            <table class="totals-table">
                <tr>
                    <td class="label">Subtotal</td>
                    <td style="text-align: right; font-weight: 600;">{subtotal}</td>
                </tr>
                <tr>
                    <td class="label">VAT (5%)</td>
                    <td style="text-align: right; font-weight: 600;">{vat_amount}</td>
                </tr>
                <tr class="grand-total">
                    <td style="padding: 15px 12px;">TOTAL AMOUNT</td>
                    <td style="text-align: right; padding: 15px 12px;">{total_amount}</td>
                </tr>
            </table>
            <div style="text-align: right; margin-top: 10px; font-size: 10px; font-style: italic; color: #6b7280;">
                Amount in Words: {total_in_words} ONLY
            </div>
        </div>

        <div class="view-online">
            View this document online: <a href="{view_url}">{view_url}</a>
        </div>

        <div class="bank-details">
            <div class="bank-title text-theme">Bank Account Details</div>
            <table class="bank-grid">
                <tr>
                    <td>
                        <div style="font-weight: 700;">ADCB Bank</div>
                        <div>Account Name: Zeronix Technology LLC</div>
                        <div>Account No: 14175801820001</div>
                        <div>IBAN: AE250030014175801820001</div>
                    </td>
                    <td>
                        <div style="font-weight: 700;">RAK BANK</div>
                        <div>Account Name: Zeronix Technology LLC</div>
                        <div>Account No: 0333543405001</div>
                        <div>IBAN: AE700400000333543405001</div>
                    </td>
                </tr>
            </table>
        </div>
    </div>

    <div class="footer">
        Zeronix Technology LLC | Business Bay, Dubai, UAE | info@zeronix.ae | www.zeronixtech.com
    </div>
</body>
</html>
HTML;
    }

    private function getStandardInvoiceHtml()
    {
        return <<<'HTML'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice #{invoice_number}</title>
    <style>
        @page { size: A4; margin: 0; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11px; color: #1f2937; margin: 0; padding: 0; line-height: 1.5; background: #fff; }
        .p-50 { padding: 40px 50px; }
        .bg-theme { background-color: #1db14e; color: #fff; }
        .text-theme { color: #1db14e; }
        
        table { width: 100%; border-collapse: collapse; }
        
        .header { padding: 40px 50px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
        .logo-container { width: 50%; }
        .logo-img { height: 50px; }
        .doc-type-container { width: 50%; text-align: right; }
        .doc-type { font-size: 32px; font-weight: 800; text-transform: uppercase; margin: 0; letter-spacing: 1px; }
        
        .info-section { margin: 30px 0; }
        .info-table td { vertical-align: top; width: 33.33%; }
        .label { font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 5px; }
        .value { font-size: 12px; font-weight: 600; }
        
        .items-table { margin-top: 30px; }
        .items-table th { background: #111827; color: #fff; padding: 12px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; }
        .items-table td { padding: 12px; border-bottom: 1px solid #f3f4f6; }
        .item-row:nth-child(even) { background: #f9fafb; }
        
        .totals-section { margin-top: 30px; }
        .totals-table { width: 300px; margin-left: auto; }
        .totals-table td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
        .totals-table .grand-total { background: #1db14e; color: #fff; font-size: 16px; font-weight: 800; border-bottom: 0; border-radius: 4px; }
        
        .bank-details { margin-top: 50px; padding: 20px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #1db14e; }
        .bank-title { font-size: 12px; font-weight: 800; margin-bottom: 10px; text-transform: uppercase; }
        .bank-grid td { width: 50%; vertical-align: top; font-size: 10px; }
        
        .footer { position: fixed; bottom: 0; width: 100%; padding: 20px 50px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 10px; color: #6b7280; }
        .view-online { margin-top: 15px; font-weight: 700; }
        .view-online a { color: #1db14e; text-decoration: none; }
    </style>
</head>
<body>
    <div class="header">
        <table>
            <tr>
                <td class="logo-container">
                    <img src="{logo_url}" class="logo-img">
                </td>
                <td class="doc-type-container">
                    <h1 class="doc-type text-theme">TAX INVOICE</h1>
                    <div style="font-size: 14px; font-weight: 700; margin-top: 5px;">#{invoice_number}</div>
                </td>
            </tr>
        </table>
    </div>

    <div class="p-50">
        <div class="info-section">
            <table class="info-table">
                <tr>
                    <td>
                        <div class="label">From</div>
                        <div class="value">Zeronix Technology LLC</div>
                        <div style="color: #4b5563;">BurDubai, Dubai, UAE</div>
                        <div style="color: #4b5563;">TRN: 104865090500003</div>
                    </td>
                    <td>
                        <div class="label">Bill To</div>
                        <div class="value">{customer_name}</div>
                        <div style="color: #4b5563;">{customer_company}</div>
                        <div style="color: #4b5563;">{customer_email}</div>
                    </td>
                    <td style="text-align: right;">
                        <div class="label">Invoice Details</div>
                        <div class="value">Date: {date}</div>
                        <div class="value" style="color: #dc2626;">Due Date: {due_date}</div>
                    </td>
                </tr>
            </table>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 40px;">#</th>
                    <th>Description</th>
                    <th style="width: 60px; text-align: center;">Qty</th>
                    <th style="width: 100px; text-align: right;">Unit Price</th>
                    <th style="width: 100px; text-align: right;">Total (AED)</th>
                </tr>
            </thead>
            <tbody>
                {items}
            </tbody>
        </table>

        <div class="totals-section">
            <table class="totals-table">
                <tr>
                    <td class="label">Subtotal</td>
                    <td style="text-align: right; font-weight: 600;">{subtotal}</td>
                </tr>
                <tr>
                    <td class="label">VAT (5%)</td>
                    <td style="text-align: right; font-weight: 600;">{vat_amount}</td>
                </tr>
                <tr class="grand-total">
                    <td style="padding: 15px 12px;">TOTAL AMOUNT</td>
                    <td style="text-align: right; padding: 15px 12px;">{total_amount}</td>
                </tr>
            </table>
            <div style="text-align: right; margin-top: 10px; font-size: 10px; font-style: italic; color: #6b7280;">
                Amount in Words: {total_in_words} ONLY
            </div>
        </div>

        <div class="view-online">
            View this document online: <a href="{view_url}">{view_url}</a>
        </div>

        <div class="bank-details">
            <div class="bank-title text-theme">Bank Account Details</div>
            <table class="bank-grid">
                <tr>
                    <td>
                        <div style="font-weight: 700;">ADCB Bank</div>
                        <div>Account Name: Zeronix Technology LLC</div>
                        <div>Account No: 14175801820001</div>
                        <div>IBAN: AE250030014175801820001</div>
                    </td>
                    <td>
                        <div style="font-weight: 700;">RAK BANK</div>
                        <div>Account Name: Zeronix Technology LLC</div>
                        <div>Account No: 0333543405001</div>
                        <div>IBAN: AE700400000333543405001</div>
                    </td>
                </tr>
            </table>
        </div>
    </div>

    <div class="footer">
        Zeronix Technology LLC | Business Bay, Dubai, UAE | info@zeronix.ae | www.zeronixtech.com
    </div>
</body>
</html>
HTML;
    }
}
