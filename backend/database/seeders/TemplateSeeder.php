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

        // 2. Modern Quote
        Template::updateOrCreate(
            ['key' => 'quote_modern'],
            [
                'name' => 'Modern Quote',
                'type' => 'quote',
                'subject' => 'New Quote Available: {quote_number}',
                'email_body' => "Hi {customer_name}!\n\nWe've prepared a new quotation for you: {quote_number}.\n\nView it online: {view_url}\n\nYou can also find the full details in the attached PDF.\n\nBest regards,\nZeronix",
                'is_default' => false,
                'content' => $this->getModernQuoteHtml(),
            ]
        );

        // 3. Standard Invoice
        Template::updateOrCreate(
            ['key' => 'invoice_standard'],
            [
                'name' => 'Standard Invoice',
                'type' => 'invoice',
                'subject' => 'Invoice from Zeronix: {invoice_number}',
                'email_body' => "Dear {customer_name},\n\nPlease find your invoice {invoice_number} attached.\n\nView it online: {view_url}\n\nDue Date: {due_date}\nTotal Amount: {total_amount}\n\nThanks,\nZeronix Team",
                'is_default' => true,
                'content' => $this->getStandardInvoiceHtml(),
            ]
        );

        // 4. Modern Invoice
        Template::updateOrCreate(
            ['key' => 'invoice_modern'],
            [
                'name' => 'Modern Invoice',
                'type' => 'invoice',
                'subject' => 'Payment Request: {invoice_number}',
                'email_body' => "Hello {customer_name},\n\nYour invoice {invoice_number} is now ready for payment.\n\nView Online: {view_url}\n\nTotal: {total_amount}\n\nPlease find the PDF attached.\n\nBest regards,\nZeronix",
                'is_default' => false,
                'content' => $this->getModernInvoiceHtml(),
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
        @page { size: A4; margin: 20px 30px; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 10px; color: #111827; margin: 0; padding: 0; line-height: 1.4; background: #fff; }
        .container { padding: 0; position: relative; }
        
        table { width: 100%; border-collapse: collapse; }
        
        .header-section { margin-bottom: 30px; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; }
        .logo-img { height: 60px; max-width: 250px; object-fit: contain; }
        
        .doc-info { text-align: right; vertical-align: bottom; }
        .doc-title { font-size: 28px; font-weight: 900; color: #1db14e; text-transform: uppercase; margin: 0; line-height: 1; }
        .doc-ref { font-size: 14px; font-weight: 700; color: #111827; margin-top: 5px; }
        .date-row { font-size: 9px; color: #6b7280; margin-top: 3px; font-weight: 600; }
        .date-label { color: #111827; text-transform: uppercase; margin-right: 5px; }
        
        .address-grid { margin-bottom: 30px; }
        .address-card-from { width: 45%; vertical-align: top; }
        .address-card-to { width: 45%; vertical-align: top; text-align: right; }
        .address-label { font-size: 9px; font-weight: 700; color: #9ca3af; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 1px; }
        .address-name { font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 4px; }
        .address-details { font-size: 10px; color: #4b5563; line-height: 1.5; }
        
        .item-table { margin-top: 15px; border-radius: 8px; overflow: hidden; border: 1px solid #f3f4f6; }
        .item-table th { background: #111827; color: #fff; padding: 10px 12px; text-align: left; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .item-table td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
        .item-row:nth-child(even) { background: #f9fafb; }
        
        .totals-section { margin-top: 20px; text-align: right; }
        .totals-box { display: inline-block; width: 260px; padding: 15px; background: #f9fafb; border-radius: 12px; border: 1px solid #f3f4f6; }
        .total-row { padding: 4px 0; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
        .total-row.grand { border-bottom: 0; padding-top: 10px; font-size: 16px; font-weight: 900; color: #1db14e; }
        
        .words-section { margin-top: 12px; font-size: 9px; font-style: italic; color: #6b7280; text-align: right; }
        
        .footer-content { position: fixed; bottom: -10px; width: 100%; border-top: 1px solid #f3f4f6; padding-top: 10px; text-align: center; }
        .footer-links { font-size: 10px; color: #111827; font-weight: 700; }
        .footer-links span { color: #1db14e; margin: 0 12px; font-weight: normal; }
        
        .bank-section { margin-top: 30px; border-top: 1px solid #f3f4f6; padding-top: 20px; }
        .bank-title { font-size: 10px; font-weight: 800; text-transform: uppercase; margin-bottom: 12px; color: #1db14e; border-left: 3px solid #1db14e; padding-left: 8px; }
        .bank-card { width: 48%; vertical-align: top; }
        .bank-name { font-size: 11px; font-weight: 700; color: #111827; margin-bottom: 4px; }
        .bank-details { font-size: 9px; line-height: 1.6; color: #4b5563; }
        
        .tax-summary-title { margin-top: 25px; font-size: 11px; font-weight: 800; color: #111827; margin-bottom: 8px; text-transform: uppercase; }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <table class="header-section">
            <tr>
                <td>
                    <img src="{logo_url}" class="logo-img" alt="Zeronix Logo">
                </td>
                <td class="doc-info">
                    <h1 class="doc-title">Quotation</h1>
                    <div class="doc-ref">#{quote_number}</div>
                    <div class="date-row">
                        <span class="date-label">Date:</span> {date}
                    </div>
                    <div class="date-row">
                        <span class="date-label">Valid Until:</span> {valid_until}
                    </div>
                </td>
            </tr>
        </table>

        <!-- Address Grid -->
        <table class="address-grid">
            <tr>
                <td class="address-card-from">
                    <div class="address-label">From</div>
                    <div class="address-name">Zeronix Technology LLC</div>
                    <div class="address-details">
                        #19 Khurram Building, Al-Raffa Street<br>
                        BurDubai, Dubai, UAE<br>
                        TRN: 104865090500003<br>
                        +971 50 981 1669 | info@zeronix.ae
                    </div>
                </td>
                <td style="width: 10%;"></td>
                <td class="address-card-to">
                    <div class="address-label">Bill To</div>
                    <div class="address-name">{customer_name}</div>
                    <div class="address-details">
                        <strong>{customer_company}</strong><br>
                        {customer_address}<br>
                        {customer_email}
                    </div>
                </td>
            </tr>
        </table>

        <!-- Items Table -->
        <table class="item-table">
            <thead>
                <tr>
                    <th style="width: 30px;">#</th>
                    <th>Description</th>
                    <th style="width: 40px; text-align: center;">Qty</th>
                    <th style="width: 70px; text-align: right;">Unit Price</th>
                    <th style="width: 60px; text-align: right;">Tax (5%)</th>
                    <th style="width: 80px; text-align: right;">Total</th>
                </tr>
            </thead>
            <tbody>
                {items}
            </tbody>
        </table>

        <!-- Totals & Words -->
        <div class="totals-section">
            <div class="totals-box">
                <table style="width: 100%;">
                    <tr class="total-row">
                        <td style="text-align: left; color: #6b7280;">Subtotal</td>
                        <td>{subtotal}</td>
                    </tr>
                    <tr class="total-row">
                        <td style="text-align: left; color: #6b7280;">VAT Total</td>
                        <td>{vat_amount}</td>
                    </tr>
                    <tr class="total-row grand">
                        <td style="text-align: left;">Total</td>
                        <td>{total_amount}</td>
                    </tr>
                </table>
            </div>
            <div class="words-section">
                AMOUNT IN WORDS: {total_in_words} ONLY
            </div>
        </div>

        <div class="tax-summary-title">Tax Summary</div>
        {tax_summary}

        <!-- Bank Details Section (Two Columns) -->
        <div class="bank-section">
            <div class="bank-title">Bank Account Details</div>
            <table>
                <tr>
                    <td class="bank-card">
                        <div class="bank-name">Abudhabi Commercial Bank (ADCB)</div>
                        <div class="bank-details">
                            Account Name: Zeronix Technology LLC<br>
                            Account No: 14175801820001<br>
                            IBAN: AE250030014175801820001
                        </div>
                    </td>
                    <td style="width: 4%;"></td>
                    <td class="bank-card">
                        <div class="bank-name">RAK BANK</div>
                        <div class="bank-details">
                            Account Name: Zeronix Technology LLC<br>
                            Account No: 0333543405001<br>
                            IBAN: AE700400000333543405001<br>
                            SWIFT CODE: NRAKAEAK
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <div style="font-size: 9px; color: #6b7280; margin-top: 15px;">
            <strong>Note:</strong> Looking forward for your business.
        </div>

        <!-- Fixed Footer (Even more bottom) -->
        <div class="footer-content">
            <div class="footer-links">
                info@zeronix.ae <span>|</span> www.zeronix.ae <span>|</span> Shop Now at www.zeronix.store
            </div>
        </div>
    </div>
</body>
</html>
HTML;
    }

    private function getModernQuoteHtml()
    {
        return <<<'HTML'
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; margin: 0; padding: 0; }
        .page { padding: 40px; }
        .banner { background: #1e40af; color: white; padding: 40px; margin-bottom: 40px; }
        .banner-title { font-size: 32px; font-weight: 300; letter-spacing: 2px; }
        .banner-meta { margin-top: 10px; font-size: 14px; opacity: 0.8; }
        .flex { display: flex; width: 100%; }
        .col { flex: 1; }
        .section-title { color: #1e40af; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; margin-bottom: 15px; font-size: 14px; font-weight: bold; }
        .item-row { border-bottom: 1px solid #f0f0f0; }
        .item-row:last-child { border-bottom: 0; }
        .table { width: 100%; border-collapse: collapse; margin: 30px 0; }
        .table th { text-align: left; color: #666; font-size: 12px; text-transform: uppercase; padding: 15px 10px; border-bottom: 2px solid #1e40af; }
        .table td { padding: 20px 10px; vertical-align: top; font-size: 14px; }
        .grand-total { background: #f8fafc; padding: 30px; text-align: right; border-radius: 8px; margin-top: 40px; }
    </style>
</head>
<body>
    <div class="banner">
        <div class="banner-title">QUOTATION</div>
        <div class="banner-meta">Reference: {quote_number} | Date: {date}</div>
    </div>

    <div class="page">
        <table style="width: 100%; margin-bottom: 40px;">
            <tr>
                <td style="width: 50%; vertical-align: top;">
                    <div class="section-title">ISSUED BY</div>
                    <div style="font-size: 16px; font-weight: bold;">ZERONIX CRM</div>
                    <div style="color: #666;">Business Bay, Dubai<br>United Arab Emirates</div>
                </td>
                <td style="width: 50%; vertical-align: top; text-align: right;">
                    <div class="section-title">ISSUED TO</div>
                    <div style="font-size: 16px; font-weight: bold;">{customer_name}</div>
                    <div style="color: #666;">{customer_company}<br>{customer_email}</div>
                </td>
            </tr>
        </table>

        <table class="table">
            <thead>
                <tr>
                    <th style="width: 60%">Item Description</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Unit Price</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                {items}
            </tbody>
        </table>

        <div class="grand-total">
            <div style="color: #666; font-size: 14px; margin-bottom: 5px;">Total Payable</div>
            <div style="font-size: 32px; font-weight: bold; color: #1e40af;">{total_amount} <span style="font-size: 14px; font-weight: normal; color: #666;">AED</span></div>
            <div style="font-size: 12px; color: #999; margin-top: 10px;">Including VAT of {vat_amount}</div>
        </div>

        <div style="margin-top: 60px; text-align: center; color: #999; font-size: 12px;">
            Thank you for your business. We look forward to working with you.
        </div>
    </div>
</body>
</html>
HTML;
    }

    private function getStandardInvoiceHtml()
    {
        // Replace all instances of Quote/Quotation with TAX INVOICE
        return str_replace(
            ['Quotation', 'QUOTATION', 'quotation', 'Quote', 'quote_number', 'valid_until'], 
            ['TAX INVOICE', 'TAX INVOICE', 'tax invoice', 'Tax Invoice', 'invoice_number', 'due_date'], 
            $this->getStandardQuoteHtml()
        );
    }

    private function getModernInvoiceHtml()
    {
        // Replace all instances of Quote/Quotation with TAX INVOICE
        return str_replace(
            ['Quotation', 'QUOTATION', 'quotation', 'Quote', 'quote_number', 'valid_until'], 
            ['TAX INVOICE', 'TAX INVOICE', 'tax invoice', 'Tax Invoice', 'invoice_number', 'due_date'], 
            $this->getModernQuoteHtml()
        );
    }
}
