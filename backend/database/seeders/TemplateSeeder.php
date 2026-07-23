<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Template;

class TemplateSeeder extends Seeder
{
    /* ─── shared CSS for all A4 templates ─── */
    private function baseStyles(string $accent = '{brand_color}'): string
    {
        return <<<CSS
<style>
@page { size: A4; margin: 15mm 20mm; }
* { box-sizing: border-box; }
body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.5; margin: 0; padding: 0; font-size: 11px; width: 100%; }
.page-break { page-break-before: always; }
table { width: 100%; border-collapse: collapse; }
.accent { color: {$accent}; }
.bg-accent { background-color: {$accent}; }
.header-bar { background: {$accent}; color: #fff; padding: 12px 24px; }
.items-table th { background: {$accent}; color: #fff; padding: 8px 12px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
.items-table td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
.items-table tr:nth-child(even) td { background: #f9fafb; }
.totals-row td { padding: 6px 12px; font-size: 10px; }
.totals-row.grand td { font-size: 13px; font-weight: bold; color: {$accent}; border-top: 2px solid {$accent}; padding-top: 10px; }
.section { page-break-inside: avoid; }
.footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 8px; color: #9ca3af; padding: 8px 0; border-top: 1px solid #e5e7eb; }
.label { font-size: 8px; text-transform: uppercase; letter-spacing: 0.8px; color: #6b7280; font-weight: 700; margin-bottom: 2px; }
.value { font-size: 11px; font-weight: 600; }
</style>
CSS;
    }

    /* ═══════════════════════════════════════
       QUOTE TEMPLATES
       ═══════════════════════════════════════ */

    private function quoteClassic(): string
    {
        return $this->baseStyles() . <<<'HTML'
<div style="padding: 0;">
  <!-- Header -->
  <table style="margin-bottom: 20px;">
    <tr>
      <td style="width: 50%; vertical-align: top;">{logo}</td>
      <td style="width: 50%; text-align: right; vertical-align: top;">
        <h1 style="color: {brand_color}; margin: 0; font-size: 28px; letter-spacing: 2px;">QUOTATION</h1>
        <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">#{quote_number}</p>
      </td>
    </tr>
  </table>

  <!-- Divider -->
  <div style="height: 3px; background: {brand_color}; margin-bottom: 20px;"></div>

  <!-- From / To -->
  <div class="section">
    <table style="margin-bottom: 20px;">
      <tr>
        <td style="width: 50%; vertical-align: top; padding-right: 20px;">
          <div class="label">From</div>
          <div class="value">{company_name}</div>
          <div style="font-size: 10px; color: #4b5563; line-height: 1.6;">
            {company_address}<br>
            {company_email}<br>
            {company_phone}<br>
            {tax_number_label}: {tax_number}
          </div>
        </td>
        <td style="width: 50%; vertical-align: top;">
          <div class="label">To</div>
          <div class="value">{customer_name}</div>
          <div style="font-size: 10px; color: #4b5563; line-height: 1.6;">
            {customer_company}<br>
            {customer_address}<br>
            {customer_email}
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Meta Info -->
  <div class="section" style="margin-bottom: 20px;">
    <table style="background: #f3f4f6; border-radius: 6px;">
      <tr>
        <td style="padding: 10px 16px;"><span class="label">Date</span><br><span class="value">{date}</span></td>
        <td style="padding: 10px 16px;"><span class="label">Valid Until</span><br><span class="value">{valid_until}</span></td>
        <td style="padding: 10px 16px;"><span class="label">Reference</span><br><span class="value">{quote_number}</span></td>
      </tr>
    </table>
  </div>

  <!-- Items -->
  <div style="margin-bottom: 20px;">
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 5%; text-align: center;">#</th>
          <th style="width: 45%;">Description</th>
          <th style="width: 12%; text-align: center;">Qty</th>
          <th style="width: 15%; text-align: right;">Unit Price</th>
          <th style="width: 10%; text-align: right;">VAT</th>
          <th style="width: 13%; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        {items}
      </tbody>
    </table>
  </div>

  <!-- Tax Summary -->
  <div class="section" style="margin-bottom: 20px;">
    {tax_summary}
  </div>

  <!-- Totals -->
  <div class="section">
    <table style="width: 280px; margin-left: auto;">
      <tr class="totals-row"><td>Subtotal</td><td style="text-align: right;">{subtotal}</td></tr>
      <tr class="totals-row"><td>VAT (5%)</td><td style="text-align: right;">{vat_amount}</td></tr>
      <tr class="totals-row grand"><td>Total</td><td style="text-align: right;">{total_amount}</td></tr>
    </table>
  </div>

  <!-- Amount in Words -->
  <div class="section" style="margin-top: 16px; padding: 10px 16px; background: #f9fafb; border-left: 3px solid {brand_color}; font-size: 10px;">
    <span class="label">Amount in Words</span><br>
    <strong>{total_in_words}</strong>
  </div>

  <!-- Terms & Bank Details -->
  <div class="section" style="margin-bottom: 20px; border-top: 1px solid #e5e7eb; padding-top: 15px; page-break-inside: avoid;">
    <table style="width: 100%;">
      <tr>
        <td style="width: 50%; vertical-align: top; padding-right: 20px;">
          <div class="label" style="color: {brand_color}; font-size: 10px;">Bank Details</div>
          <div style="font-size: 9px; color: #4b5563; line-height: 1.5; margin-top: 4px;">{bank_details}</div>
        </td>
        <td style="width: 50%; vertical-align: top;">
          <div class="label" style="color: {brand_color}; font-size: 10px;">Terms & Conditions</div>
          <div style="font-size: 9px; color: #4b5563; line-height: 1.5; margin-top: 4px;">{terms_conditions}</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Footer -->
  <div class="footer">
    {company_name} &bull; {company_email} &bull; {company_phone}
  </div>
</div>
HTML;
    }

    private function quoteModern(): string
    {
        return $this->baseStyles() . <<<'HTML'
<div style="padding: 0;">
  <!-- Full-width accent banner -->
  <div class="header-bar" style="padding: 20px 30px; margin-bottom: 24px;">
    <table>
      <tr>
        <td style="vertical-align: middle;">{logo}</td>
        <td style="text-align: right; vertical-align: middle;">
          <div style="font-size: 24px; font-weight: 800; letter-spacing: 3px;">QUOTATION</div>
          <div style="font-size: 12px; opacity: 0.85; margin-top: 4px;">#{quote_number}</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Info Cards -->
  <div class="section">
    <table style="margin-bottom: 20px;">
      <tr>
        <td style="width: 48%; vertical-align: top; background: #f9fafb; padding: 16px; border-radius: 8px;">
          <div class="label" style="color: {brand_color};">Billed From</div>
          <div class="value" style="margin-top: 4px;">{company_name}</div>
          <div style="font-size: 10px; color: #4b5563; margin-top: 6px; line-height: 1.6;">
            {company_address}<br>{company_email}<br>{company_phone}<br>{tax_number_label}: {tax_number}
          </div>
        </td>
        <td style="width: 4%;"></td>
        <td style="width: 48%; vertical-align: top; background: #f9fafb; padding: 16px; border-radius: 8px;">
          <div class="label" style="color: {brand_color};">Billed To</div>
          <div class="value" style="margin-top: 4px;">{customer_name}</div>
          <div style="font-size: 10px; color: #4b5563; margin-top: 6px; line-height: 1.6;">
            {customer_company}<br>{customer_address}<br>{customer_email}
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Date row -->
  <div class="section" style="margin-bottom: 20px;">
    <table>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><span class="label">Issue Date</span><br><span class="value">{date}</span></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: center;"><span class="label">Valid Until</span><br><span class="value">{valid_until}</span></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;"><span class="label">Currency</span><br><span class="value">AED</span></td>
      </tr>
    </table>
  </div>

  <!-- Items Table -->
  <div style="margin-bottom: 20px;">
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 5%; text-align: center;">#</th>
          <th style="width: 45%;">Item / Description</th>
          <th style="width: 12%; text-align: center;">Qty</th>
          <th style="width: 15%; text-align: right;">Rate</th>
          <th style="width: 10%; text-align: right;">VAT</th>
          <th style="width: 13%; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        {items}
      </tbody>
    </table>
  </div>

  <!-- Tax Summary -->
  <div class="section" style="margin-bottom: 20px;">
    {tax_summary}
  </div>

  <!-- Totals Block -->
  <div class="section" style="margin-bottom: 20px;">
    <table style="width: 300px; margin-left: auto; background: {brand_color}; color: #fff; border-radius: 8px;">
      <tr><td style="padding: 8px 16px; font-size: 10px; opacity: 0.8;">Subtotal</td><td style="padding: 8px 16px; text-align: right; font-size: 10px;">{subtotal}</td></tr>
      <tr><td style="padding: 8px 16px; font-size: 10px; opacity: 0.8;">VAT</td><td style="padding: 8px 16px; text-align: right; font-size: 10px;">{vat_amount}</td></tr>
      <tr><td style="padding: 12px 16px; font-size: 15px; font-weight: 800; border-top: 1px solid rgba(255,255,255,0.3);">TOTAL</td><td style="padding: 12px 16px; text-align: right; font-size: 15px; font-weight: 800; border-top: 1px solid rgba(255,255,255,0.3);">{total_amount}</td></tr>
    </table>
  </div>

  <!-- Amount in Words -->
  <div class="section" style="padding: 10px 16px; background: #f9fafb; border-radius: 6px; font-size: 10px;">
    <span class="label">Total in Words</span><br><strong>{total_in_words}</strong>
  </div>

  <!-- Terms & Bank Details -->
  <div class="section" style="margin-bottom: 20px; border-top: 1px solid #e5e7eb; padding-top: 15px; page-break-inside: avoid;">
    <table style="width: 100%;">
      <tr>
        <td style="width: 50%; vertical-align: top; padding-right: 20px;">
          <div class="label" style="color: {brand_color}; font-size: 10px;">Bank Details</div>
          <div style="font-size: 9px; color: #4b5563; line-height: 1.5; margin-top: 4px;">{bank_details}</div>
        </td>
        <td style="width: 50%; vertical-align: top;">
          <div class="label" style="color: {brand_color}; font-size: 10px;">Terms & Conditions</div>
          <div style="font-size: 9px; color: #4b5563; line-height: 1.5; margin-top: 4px;">{terms_conditions}</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Footer -->
  <div class="footer">
    {company_name} &bull; {company_email} &bull; {company_phone}
  </div>
</div>
HTML;
    }

    /* ═══════════════════════════════════════
       INVOICE TEMPLATES
       ═══════════════════════════════════════ */

    private function invoiceClassic(): string
    {
        return $this->baseStyles() . <<<'HTML'
<div style="padding: 0;">
  <table style="margin-bottom: 20px;">
    <tr>
      <td style="width: 50%; vertical-align: top;">{logo}</td>
      <td style="width: 50%; text-align: right; vertical-align: top;">
        <h1 style="color: {brand_color}; margin: 0; font-size: 28px; letter-spacing: 2px;">INVOICE</h1>
        <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">#{invoice_number}</p>
      </td>
    </tr>
  </table>

  <div style="height: 3px; background: {brand_color}; margin-bottom: 20px;"></div>

  <div class="section">
    <table style="margin-bottom: 20px;">
      <tr>
        <td style="width: 50%; vertical-align: top; padding-right: 20px;">
          <div class="label">From</div>
          <div class="value">{company_name}</div>
          <div style="font-size: 10px; color: #4b5563; line-height: 1.6;">{company_address}<br>{company_email}<br>{company_phone}<br>{tax_number_label}: {tax_number}</div>
        </td>
        <td style="width: 50%; vertical-align: top;">
          <div class="label">Bill To</div>
          <div class="value">{customer_name}</div>
          <div style="font-size: 10px; color: #4b5563; line-height: 1.6;">{customer_company}<br>{customer_address}<br>{customer_email}</div>
        </td>
      </tr>
    </table>
  </div>

  <div class="section" style="margin-bottom: 20px;">
    <table style="background: #f3f4f6; border-radius: 6px;">
      <tr>
        <td style="padding: 10px 16px;"><span class="label">Invoice Date</span><br><span class="value">{date}</span></td>
        <td style="padding: 10px 16px;"><span class="label">Due Date</span><br><span class="value">{due_date}</span></td>
        <td style="padding: 10px 16px;"><span class="label">Invoice #</span><br><span class="value">{invoice_number}</span></td>
      </tr>
    </table>
  </div>

  <div class="section" style="margin-bottom: 20px;">
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 5%; text-align: center;">#</th>
          <th style="width: 45%;">Description</th>
          <th style="width: 12%; text-align: center;">Qty</th>
          <th style="width: 15%; text-align: right;">Unit Price</th>
          <th style="width: 10%; text-align: right;">VAT</th>
          <th style="width: 13%; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>{items}</tbody>
    </table>
  </div>

  <div class="section" style="margin-bottom: 20px;">{tax_summary}</div>

  <div class="section">
    <table style="width: 280px; margin-left: auto;">
      <tr class="totals-row"><td>Subtotal</td><td style="text-align: right;">{subtotal}</td></tr>
      <tr class="totals-row"><td>VAT (5%)</td><td style="text-align: right;">{vat_amount}</td></tr>
      <tr class="totals-row grand"><td>Total Due</td><td style="text-align: right;">{total_amount}</td></tr>
    </table>
  </div>

  <div class="section" style="margin-top: 16px; padding: 10px 16px; background: #f9fafb; border-left: 3px solid {brand_color}; font-size: 10px;">
    <span class="label">Amount in Words</span><br><strong>{total_in_words}</strong>
  </div>

  <div class="footer">{company_name} &bull; {company_email} &bull; {company_phone}</div>
</div>
HTML;
    }

    private function invoiceModern(): string
    {
        return $this->baseStyles() . <<<'HTML'
<div style="padding: 0;">
  <div class="header-bar" style="padding: 20px 30px; margin-bottom: 24px;">
    <table>
      <tr>
        <td style="vertical-align: middle;">{logo}</td>
        <td style="text-align: right; vertical-align: middle;">
          <div style="font-size: 24px; font-weight: 800; letter-spacing: 3px;">TAX INVOICE</div>
          <div style="font-size: 12px; opacity: 0.85; margin-top: 4px;">#{invoice_number}</div>
        </td>
      </tr>
    </table>
  </div>

  <div class="section">
    <table style="margin-bottom: 20px;">
      <tr>
        <td style="width: 48%; vertical-align: top; background: #f9fafb; padding: 16px; border-radius: 8px;">
          <div class="label" style="color: {brand_color};">From</div>
          <div class="value" style="margin-top: 4px;">{company_name}</div>
          <div style="font-size: 10px; color: #4b5563; margin-top: 6px; line-height: 1.6;">{company_address}<br>{company_email}<br>{company_phone}<br>{tax_number_label}: {tax_number}</div>
        </td>
        <td style="width: 4%;"></td>
        <td style="width: 48%; vertical-align: top; background: #f9fafb; padding: 16px; border-radius: 8px;">
          <div class="label" style="color: {brand_color};">Bill To</div>
          <div class="value" style="margin-top: 4px;">{customer_name}</div>
          <div style="font-size: 10px; color: #4b5563; margin-top: 6px; line-height: 1.6;">{customer_company}<br>{customer_address}<br>{customer_email}</div>
        </td>
      </tr>
    </table>
  </div>

  <div class="section" style="margin-bottom: 20px;">
    <table>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><span class="label">Invoice Date</span><br><span class="value">{date}</span></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: center;"><span class="label">Payment Due</span><br><span class="value">{due_date}</span></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;"><span class="label">Currency</span><br><span class="value">AED</span></td>
      </tr>
    </table>
  </div>

  <div class="section" style="margin-bottom: 20px;">
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 5%; text-align: center;">#</th>
          <th style="width: 45%;">Item / Description</th>
          <th style="width: 12%; text-align: center;">Qty</th>
          <th style="width: 15%; text-align: right;">Rate</th>
          <th style="width: 10%; text-align: right;">VAT</th>
          <th style="width: 13%; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>{items}</tbody>
    </table>
  </div>

  <div class="section" style="margin-bottom: 20px;">{tax_summary}</div>

  <div class="section" style="margin-bottom: 20px;">
    <table style="width: 300px; margin-left: auto; background: {brand_color}; color: #fff; border-radius: 8px;">
      <tr><td style="padding: 8px 16px; font-size: 10px; opacity: 0.8;">Subtotal</td><td style="padding: 8px 16px; text-align: right; font-size: 10px;">{subtotal}</td></tr>
      <tr><td style="padding: 8px 16px; font-size: 10px; opacity: 0.8;">VAT</td><td style="padding: 8px 16px; text-align: right; font-size: 10px;">{vat_amount}</td></tr>
      <tr><td style="padding: 12px 16px; font-size: 15px; font-weight: 800; border-top: 1px solid rgba(255,255,255,0.3);">TOTAL DUE</td><td style="padding: 12px 16px; text-align: right; font-size: 15px; font-weight: 800; border-top: 1px solid rgba(255,255,255,0.3);">{total_amount}</td></tr>
    </table>
  </div>

  <div class="section" style="padding: 10px 16px; background: #f9fafb; border-radius: 6px; font-size: 10px;">
    <span class="label">Total in Words</span><br><strong>{total_in_words}</strong>
  </div>

  <div class="footer">{company_name} &bull; {company_email} &bull; {company_phone}</div>
</div>
HTML;
    }

    /* ═══════════════════════════════════════
       SALES ORDER TEMPLATES
       ═══════════════════════════════════════ */

    private function salesOrderClassic(): string
    {
        return $this->baseStyles() . <<<'HTML'
<div style="padding: 0;">
  <table style="margin-bottom: 20px;">
    <tr>
      <td style="width: 50%; vertical-align: top;">{logo}</td>
      <td style="width: 50%; text-align: right; vertical-align: top;">
        <h1 style="color: {brand_color}; margin: 0; font-size: 28px; letter-spacing: 2px;">SALES ORDER</h1>
        <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">#{order_number}</p>
      </td>
    </tr>
  </table>

  <div style="height: 3px; background: {brand_color}; margin-bottom: 20px;"></div>

  <div class="section">
    <table style="margin-bottom: 20px;">
      <tr>
        <td style="width: 50%; vertical-align: top; padding-right: 20px;">
          <div class="label">From</div>
          <div class="value">{company_name}</div>
          <div style="font-size: 10px; color: #4b5563; line-height: 1.6;">{company_address}<br>{company_email}<br>{company_phone}<br>{tax_number_label}: {tax_number}</div>
        </td>
        <td style="width: 50%; vertical-align: top;">
          <div class="label">Ship To</div>
          <div class="value">{customer_name}</div>
          <div style="font-size: 10px; color: #4b5563; line-height: 1.6;">{customer_company}<br>{customer_address}<br>{customer_email}</div>
        </td>
      </tr>
    </table>
  </div>

  <div class="section" style="margin-bottom: 20px;">
    <table style="background: #f3f4f6; border-radius: 6px;">
      <tr>
        <td style="padding: 10px 16px;"><span class="label">Order Date</span><br><span class="value">{date}</span></td>
        <td style="padding: 10px 16px;"><span class="label">Order #</span><br><span class="value">{order_number}</span></td>
        <td style="padding: 10px 16px;"><span class="label">Status</span><br><span class="value" style="color: {brand_color};">Confirmed</span></td>
      </tr>
    </table>
  </div>

  <div class="section" style="margin-bottom: 20px;">
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 5%; text-align: center;">#</th>
          <th style="width: 50%;">Description</th>
          <th style="width: 15%; text-align: center;">Qty</th>
          <th style="width: 15%; text-align: right;">Unit Price</th>
          <th style="width: 15%; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>{items}</tbody>
    </table>
  </div>

  <div class="section">
    <table style="width: 280px; margin-left: auto;">
      <tr class="totals-row"><td>Subtotal</td><td style="text-align: right;">{subtotal}</td></tr>
      <tr class="totals-row"><td>VAT (5%)</td><td style="text-align: right;">{vat_amount}</td></tr>
      <tr class="totals-row grand"><td>Total</td><td style="text-align: right;">{total_amount}</td></tr>
    </table>
  </div>

  <div class="footer">{company_name} &bull; {company_email} &bull; {company_phone}</div>
</div>
HTML;
    }

    private function salesOrderModern(): string
    {
        return $this->baseStyles() . <<<'HTML'
<div style="padding: 0;">
  <div class="header-bar" style="padding: 20px 30px; margin-bottom: 24px;">
    <table>
      <tr>
        <td style="vertical-align: middle;">{logo}</td>
        <td style="text-align: right; vertical-align: middle;">
          <div style="font-size: 24px; font-weight: 800; letter-spacing: 3px;">SALES ORDER</div>
          <div style="font-size: 12px; opacity: 0.85; margin-top: 4px;">#{order_number}</div>
        </td>
      </tr>
    </table>
  </div>

  <div class="section">
    <table style="margin-bottom: 20px;">
      <tr>
        <td style="width: 48%; vertical-align: top; background: #f9fafb; padding: 16px; border-radius: 8px;">
          <div class="label" style="color: {brand_color};">From</div>
          <div class="value" style="margin-top: 4px;">{company_name}</div>
          <div style="font-size: 10px; color: #4b5563; margin-top: 6px; line-height: 1.6;">{company_address}<br>{company_email}<br>{company_phone}<br>{tax_number_label}: {tax_number}</div>
        </td>
        <td style="width: 4%;"></td>
        <td style="width: 48%; vertical-align: top; background: #f9fafb; padding: 16px; border-radius: 8px;">
          <div class="label" style="color: {brand_color};">Ship To</div>
          <div class="value" style="margin-top: 4px;">{customer_name}</div>
          <div style="font-size: 10px; color: #4b5563; margin-top: 6px; line-height: 1.6;">{customer_company}<br>{customer_address}<br>{customer_email}</div>
        </td>
      </tr>
    </table>
  </div>

  <div class="section" style="margin-bottom: 20px;">
    <table>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><span class="label">Order Date</span><br><span class="value">{date}</span></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;"><span class="label">Order #</span><br><span class="value">{order_number}</span></td>
      </tr>
    </table>
  </div>

  <div class="section" style="margin-bottom: 20px;">
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 5%; text-align: center;">#</th>
          <th style="width: 50%;">Item / Description</th>
          <th style="width: 15%; text-align: center;">Qty</th>
          <th style="width: 15%; text-align: right;">Rate</th>
          <th style="width: 15%; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>{items}</tbody>
    </table>
  </div>

  <div class="section" style="margin-bottom: 20px;">
    <table style="width: 300px; margin-left: auto; background: {brand_color}; color: #fff; border-radius: 8px;">
      <tr><td style="padding: 8px 16px; font-size: 10px; opacity: 0.8;">Subtotal</td><td style="padding: 8px 16px; text-align: right; font-size: 10px;">{subtotal}</td></tr>
      <tr><td style="padding: 8px 16px; font-size: 10px; opacity: 0.8;">VAT</td><td style="padding: 8px 16px; text-align: right; font-size: 10px;">{vat_amount}</td></tr>
      <tr><td style="padding: 12px 16px; font-size: 15px; font-weight: 800; border-top: 1px solid rgba(255,255,255,0.3);">TOTAL</td><td style="padding: 12px 16px; text-align: right; font-size: 15px; font-weight: 800; border-top: 1px solid rgba(255,255,255,0.3);">{total_amount}</td></tr>
    </table>
  </div>

  <div class="footer">{company_name} &bull; {company_email} &bull; {company_phone}</div>
</div>
HTML;
    }

    /* ═══════════════════════════════════════
       PAYMENT SLIP TEMPLATES
       ═══════════════════════════════════════ */

    private function paymentSlipClassic(): string
    {
        return $this->baseStyles() . <<<'HTML'
<div style="padding: 0;">
  <table style="margin-bottom: 20px;">
    <tr>
      <td style="width: 50%; vertical-align: top;">{logo}</td>
      <td style="width: 50%; text-align: right; vertical-align: top;">
        <h1 style="color: {brand_color}; margin: 0; font-size: 28px; letter-spacing: 2px;">PAYMENT RECEIPT</h1>
        <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">#{receipt_number}</p>
      </td>
    </tr>
  </table>

  <div style="height: 3px; background: {brand_color}; margin-bottom: 20px;"></div>

  <div class="section">
    <table style="margin-bottom: 20px;">
      <tr>
        <td style="width: 50%; vertical-align: top; padding-right: 20px;">
          <div class="label">Received From</div>
          <div class="value">{customer_name}</div>
          <div style="font-size: 10px; color: #4b5563; line-height: 1.6;">{customer_company}<br>{customer_email}</div>
        </td>
        <td style="width: 50%; vertical-align: top;">
          <div class="label">Received By</div>
          <div class="value">{company_name}</div>
          <div style="font-size: 10px; color: #4b5563; line-height: 1.6;">{company_address}<br>{company_email}<br>{company_phone}</div>
        </td>
      </tr>
    </table>
  </div>

  <div class="section" style="margin-bottom: 20px;">
    <table style="background: #f3f4f6; border-radius: 6px;">
      <tr>
        <td style="padding: 10px 16px;"><span class="label">Payment Date</span><br><span class="value">{payment_date}</span></td>
        <td style="padding: 10px 16px;"><span class="label">Payment Method</span><br><span class="value">{payment_method}</span></td>
        <td style="padding: 10px 16px;"><span class="label">Reference</span><br><span class="value">{reference_id}</span></td>
      </tr>
    </table>
  </div>

  <div class="section" style="margin-bottom: 20px; padding: 20px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
    <table>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span class="label">In Settlement Of</span><br>
          <span class="value">Invoice #{invoice_number}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span class="label">Notes</span><br>
          <span style="font-size: 10px; color: #4b5563;">{notes}</span>
        </td>
      </tr>
    </table>
  </div>

  <!-- Amount -->
  <div class="section" style="text-align: right; margin-bottom: 20px;">
    <div class="label">Total Amount Received</div>
    <div style="font-size: 28px; font-weight: 800; color: {brand_color}; margin-top: 4px;">{amount}</div>
  </div>

  <div class="section" style="padding: 10px 16px; background: #f9fafb; border-left: 3px solid {brand_color}; font-size: 10px;">
    <span class="label">Amount in Words</span><br><strong>{amount_in_words}</strong>
  </div>

  <div class="footer">{company_name} &bull; {company_email} &bull; {company_phone}</div>
</div>
HTML;
    }

    private function paymentSlipModern(): string
    {
        return $this->baseStyles() . <<<'HTML'
<div style="padding: 0;">
  <div class="header-bar" style="padding: 20px 30px; margin-bottom: 24px;">
    <table>
      <tr>
        <td style="vertical-align: middle;">{logo}</td>
        <td style="text-align: right; vertical-align: middle;">
          <div style="font-size: 24px; font-weight: 800; letter-spacing: 3px;">PAYMENT RECEIPT</div>
          <div style="font-size: 12px; opacity: 0.85; margin-top: 4px;">#{receipt_number}</div>
        </td>
      </tr>
    </table>
  </div>

  <div class="section">
    <table style="margin-bottom: 20px;">
      <tr>
        <td style="width: 48%; vertical-align: top; background: #f9fafb; padding: 16px; border-radius: 8px;">
          <div class="label" style="color: {brand_color};">Received From</div>
          <div class="value" style="margin-top: 4px;">{customer_name}</div>
          <div style="font-size: 10px; color: #4b5563; margin-top: 6px; line-height: 1.6;">{customer_company}<br>{customer_email}</div>
        </td>
        <td style="width: 4%;"></td>
        <td style="width: 48%; vertical-align: top; background: #f9fafb; padding: 16px; border-radius: 8px;">
          <div class="label" style="color: {brand_color};">Company</div>
          <div class="value" style="margin-top: 4px;">{company_name}</div>
          <div style="font-size: 10px; color: #4b5563; margin-top: 6px; line-height: 1.6;">{company_address}<br>{company_email}<br>{company_phone}</div>
        </td>
      </tr>
    </table>
  </div>

  <div class="section" style="margin-bottom: 20px;">
    <table>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><span class="label">Date</span><br><span class="value">{payment_date}</span></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: center;"><span class="label">Method</span><br><span class="value">{payment_method}</span></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;"><span class="label">Invoice</span><br><span class="value">#{invoice_number}</span></td>
      </tr>
    </table>
  </div>

  <div class="section" style="margin-bottom: 20px;">
    <table style="width: 100%; background: {brand_color}; color: #fff; border-radius: 8px;">
      <tr>
        <td style="padding: 20px 24px;">
          <div style="font-size: 10px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px;">Total Amount Received</div>
          <div style="font-size: 32px; font-weight: 800; margin-top: 6px;">{amount}</div>
        </td>
      </tr>
    </table>
  </div>

  <div class="section" style="padding: 12px 16px; background: #f9fafb; border-radius: 6px; margin-bottom: 16px;">
    <span class="label">Reference</span><br><span class="value">{reference_id}</span>
  </div>

  <div class="section" style="padding: 12px 16px; background: #f9fafb; border-radius: 6px;">
    <span class="label">Notes</span><br><span style="font-size: 10px; color: #4b5563;">{notes}</span>
  </div>

  <div class="footer">{company_name} &bull; {company_email} &bull; {company_phone}</div>
</div>
HTML;
    }

    /* ═══════════════════════════════════════
       PURCHASE BILL TEMPLATES
       ═══════════════════════════════════════ */

    private function purchaseBillClassic(): string
    {
        return $this->baseStyles() . <<<'HTML'
<div style="padding: 0;">
  <table style="margin-bottom: 20px;">
    <tr>
      <td style="width: 50%; vertical-align: top;">{logo}</td>
      <td style="width: 50%; text-align: right; vertical-align: top;">
        <h1 style="color: {brand_color}; margin: 0; font-size: 28px; letter-spacing: 2px;">PURCHASE BILL</h1>
        <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">#{bill_number}</p>
      </td>
    </tr>
  </table>

  <div style="height: 3px; background: {brand_color}; margin-bottom: 20px;"></div>

  <div class="section">
    <table style="margin-bottom: 20px;">
      <tr>
        <td style="width: 50%; vertical-align: top; padding-right: 20px;">
          <div class="label">Our Company</div>
          <div class="value">{company_name}</div>
          <div style="font-size: 10px; color: #4b5563; line-height: 1.6;">{company_address}<br>{company_email}<br>{company_phone}<br>{tax_number_label}: {tax_number}</div>
        </td>
        <td style="width: 50%; vertical-align: top;">
          <div class="label">Supplier</div>
          <div class="value">{supplier_name}</div>
          <div style="font-size: 10px; color: #4b5563; line-height: 1.6;">{supplier_email}<br>{supplier_phone}<br>{supplier_address}</div>
        </td>
      </tr>
    </table>
  </div>

  <div class="section" style="margin-bottom: 20px;">
    <table style="background: #f3f4f6; border-radius: 6px;">
      <tr>
        <td style="padding: 10px 16px;"><span class="label">Bill Date</span><br><span class="value">{date}</span></td>
        <td style="padding: 10px 16px;"><span class="label">Due Date</span><br><span class="value">{due_date}</span></td>
        <td style="padding: 10px 16px;"><span class="label">Bill #</span><br><span class="value">{bill_number}</span></td>
      </tr>
    </table>
  </div>

  <div class="section" style="margin-bottom: 20px;">
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 5%; text-align: center;">#</th>
          <th style="width: 45%;">Description</th>
          <th style="width: 15%; text-align: center;">Qty</th>
          <th style="width: 15%; text-align: right;">Unit Price</th>
          <th style="width: 20%; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>{items}</tbody>
    </table>
  </div>

  <div class="section">
    <table style="width: 280px; margin-left: auto;">
      <tr class="totals-row"><td>Subtotal</td><td style="text-align: right;">{subtotal}</td></tr>
      <tr class="totals-row"><td>VAT (5%)</td><td style="text-align: right;">{vat_amount}</td></tr>
      <tr class="totals-row grand"><td>Total</td><td style="text-align: right;">{total_amount}</td></tr>
    </table>
  </div>

  <div class="footer">{company_name} &bull; {company_email} &bull; {company_phone}</div>
</div>
HTML;
    }

    private function purchaseBillModern(): string
    {
        return $this->baseStyles() . <<<'HTML'
<div style="padding: 0;">
  <div class="header-bar" style="padding: 20px 30px; margin-bottom: 24px;">
    <table>
      <tr>
        <td style="vertical-align: middle;">{logo}</td>
        <td style="text-align: right; vertical-align: middle;">
          <div style="font-size: 24px; font-weight: 800; letter-spacing: 3px;">PURCHASE BILL</div>
          <div style="font-size: 12px; opacity: 0.85; margin-top: 4px;">#{bill_number}</div>
        </td>
      </tr>
    </table>
  </div>

  <div class="section">
    <table style="margin-bottom: 20px;">
      <tr>
        <td style="width: 48%; vertical-align: top; background: #f9fafb; padding: 16px; border-radius: 8px;">
          <div class="label" style="color: {brand_color};">Our Company</div>
          <div class="value" style="margin-top: 4px;">{company_name}</div>
          <div style="font-size: 10px; color: #4b5563; margin-top: 6px; line-height: 1.6;">{company_address}<br>{company_email}<br>{company_phone}<br>{tax_number_label}: {tax_number}</div>
        </td>
        <td style="width: 4%;"></td>
        <td style="width: 48%; vertical-align: top; background: #f9fafb; padding: 16px; border-radius: 8px;">
          <div class="label" style="color: {brand_color};">Supplier</div>
          <div class="value" style="margin-top: 4px;">{supplier_name}</div>
          <div style="font-size: 10px; color: #4b5563; margin-top: 6px; line-height: 1.6;">{supplier_email}<br>{supplier_phone}<br>{supplier_address}</div>
        </td>
      </tr>
    </table>
  </div>

  <div class="section" style="margin-bottom: 20px;">
    <table>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><span class="label">Bill Date</span><br><span class="value">{date}</span></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: center;"><span class="label">Due Date</span><br><span class="value">{due_date}</span></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;"><span class="label">Bill #</span><br><span class="value">{bill_number}</span></td>
      </tr>
    </table>
  </div>

  <div class="section" style="margin-bottom: 20px;">
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 5%; text-align: center;">#</th>
          <th style="width: 45%;">Item / Description</th>
          <th style="width: 15%; text-align: center;">Qty</th>
          <th style="width: 15%; text-align: right;">Rate</th>
          <th style="width: 20%; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>{items}</tbody>
    </table>
  </div>

  <div class="section" style="margin-bottom: 20px;">
    <table style="width: 300px; margin-left: auto; background: {brand_color}; color: #fff; border-radius: 8px;">
      <tr><td style="padding: 8px 16px; font-size: 10px; opacity: 0.8;">Subtotal</td><td style="padding: 8px 16px; text-align: right; font-size: 10px;">{subtotal}</td></tr>
      <tr><td style="padding: 8px 16px; font-size: 10px; opacity: 0.8;">VAT</td><td style="padding: 8px 16px; text-align: right; font-size: 10px;">{vat_amount}</td></tr>
      <tr><td style="padding: 12px 16px; font-size: 15px; font-weight: 800; border-top: 1px solid rgba(255,255,255,0.3);">TOTAL</td><td style="padding: 12px 16px; text-align: right; font-size: 15px; font-weight: 800; border-top: 1px solid rgba(255,255,255,0.3);">{total_amount}</td></tr>
    </table>
  </div>

  <div class="footer">{company_name} &bull; {company_email} &bull; {company_phone}</div>
</div>
HTML;
    }

    /* ═══════════════════════════════════════
       DELIVERY NOTE TEMPLATES
       ═══════════════════════════════════════ */

    private function deliveryNoteClassic(): string
    {
        return $this->baseStyles() . <<<'HTML'
<div style="padding: 0;">
  <table style="margin-bottom: 20px;">
    <tr>
      <td style="width: 50%; vertical-align: top;">{logo}</td>
      <td style="width: 50%; text-align: right; vertical-align: top;">
        <h1 style="color: {brand_color}; margin: 0; font-size: 28px; letter-spacing: 2px;">DELIVERY NOTE</h1>
        <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">#{delivery_number}</p>
      </td>
    </tr>
  </table>

  <div style="height: 3px; background: {brand_color}; margin-bottom: 20px;"></div>

  <div class="section">
    <table style="margin-bottom: 20px;">
      <tr>
        <td style="width: 50%; vertical-align: top; padding-right: 20px;">
          <div class="label">From</div>
          <div class="value">{company_name}</div>
          <div style="font-size: 10px; color: #4b5563; line-height: 1.6;">{company_address}<br>{company_email}<br>{company_phone}</div>
        </td>
        <td style="width: 50%; vertical-align: top;">
          <div class="label">Deliver To</div>
          <div class="value">{customer_name}</div>
          <div style="font-size: 10px; color: #4b5563; line-height: 1.6;">{customer_company}<br>{customer_address}<br>{customer_email}</div>
        </td>
      </tr>
    </table>
  </div>

  <div class="section" style="margin-bottom: 20px;">
    <table style="background: #f3f4f6; border-radius: 6px;">
      <tr>
        <td style="padding: 10px 16px;"><span class="label">Delivery Date</span><br><span class="value">{delivery_date}</span></td>
        <td style="padding: 10px 16px;"><span class="label">Delivery #</span><br><span class="value">{delivery_number}</span></td>
        <td style="padding: 10px 16px;"><span class="label">Order Ref</span><br><span class="value">{order_reference}</span></td>
      </tr>
    </table>
  </div>

  <div class="section" style="margin-bottom: 20px;">
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 5%; text-align: center;">#</th>
          <th style="width: 55%;">Description</th>
          <th style="width: 20%; text-align: center;">Qty</th>
          <th style="width: 20%; text-align: center;">Delivered</th>
        </tr>
      </thead>
      <tbody>{items}</tbody>
    </table>
  </div>

  <div class="section" style="margin-top: 40px;">
    <table>
      <tr>
        <td style="width: 50%; padding: 20px; border-top: 1px solid #e5e7eb;">
          <div class="label">Delivered By (Signature)</div>
          <div style="height: 50px;"></div>
          <div style="border-top: 1px solid #9ca3af; width: 200px; margin-top: 10px;"></div>
        </td>
        <td style="width: 50%; padding: 20px; border-top: 1px solid #e5e7eb;">
          <div class="label">Received By (Signature)</div>
          <div style="height: 50px;"></div>
          <div style="border-top: 1px solid #9ca3af; width: 200px; margin-top: 10px;"></div>
        </td>
      </tr>
    </table>
  </div>

  <div class="footer">{company_name} &bull; {company_email} &bull; {company_phone}</div>
</div>
HTML;
    }

    private function deliveryNoteModern(): string
    {
        return $this->baseStyles() . <<<'HTML'
<div style="padding: 0;">
  <div class="header-bar" style="padding: 20px 30px; margin-bottom: 24px;">
    <table>
      <tr>
        <td style="vertical-align: middle;">{logo}</td>
        <td style="text-align: right; vertical-align: middle;">
          <div style="font-size: 24px; font-weight: 800; letter-spacing: 3px;">DELIVERY NOTE</div>
          <div style="font-size: 12px; opacity: 0.85; margin-top: 4px;">#{delivery_number}</div>
        </td>
      </tr>
    </table>
  </div>

  <div class="section">
    <table style="margin-bottom: 20px;">
      <tr>
        <td style="width: 48%; vertical-align: top; background: #f9fafb; padding: 16px; border-radius: 8px;">
          <div class="label" style="color: {brand_color};">From</div>
          <div class="value" style="margin-top: 4px;">{company_name}</div>
          <div style="font-size: 10px; color: #4b5563; margin-top: 6px; line-height: 1.6;">{company_address}<br>{company_email}<br>{company_phone}</div>
        </td>
        <td style="width: 4%;"></td>
        <td style="width: 48%; vertical-align: top; background: #f9fafb; padding: 16px; border-radius: 8px;">
          <div class="label" style="color: {brand_color};">Deliver To</div>
          <div class="value" style="margin-top: 4px;">{customer_name}</div>
          <div style="font-size: 10px; color: #4b5563; margin-top: 6px; line-height: 1.6;">{customer_company}<br>{customer_address}<br>{customer_email}</div>
        </td>
      </tr>
    </table>
  </div>

  <div class="section" style="margin-bottom: 20px;">
    <table>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><span class="label">Delivery Date</span><br><span class="value">{delivery_date}</span></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: center;"><span class="label">D/N #</span><br><span class="value">{delivery_number}</span></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;"><span class="label">Order Ref</span><br><span class="value">{order_reference}</span></td>
      </tr>
    </table>
  </div>

  <div class="section" style="margin-bottom: 20px;">
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 5%; text-align: center;">#</th>
          <th style="width: 55%;">Item / Description</th>
          <th style="width: 20%; text-align: center;">Qty</th>
          <th style="width: 20%; text-align: center;">Delivered</th>
        </tr>
      </thead>
      <tbody>{items}</tbody>
    </table>
  </div>

  <div class="section" style="margin-top: 40px;">
    <table>
      <tr>
        <td style="width: 50%; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <div class="label" style="color: {brand_color};">Delivered By</div>
          <div style="height: 50px;"></div>
          <div style="border-top: 2px solid {brand_color}; width: 180px; margin-top: 10px;"></div>
          <div style="font-size: 8px; color: #9ca3af; margin-top: 4px;">Signature & Stamp</div>
        </td>
        <td style="width: 4%;"></td>
        <td style="width: 50%; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <div class="label" style="color: {brand_color};">Received By</div>
          <div style="height: 50px;"></div>
          <div style="border-top: 2px solid {brand_color}; width: 180px; margin-top: 10px;"></div>
          <div style="font-size: 8px; color: #9ca3af; margin-top: 4px;">Signature & Stamp</div>
        </td>
      </tr>
    </table>
  </div>

  <div class="footer">{company_name} &bull; {company_email} &bull; {company_phone}</div>
</div>
HTML;
    }

    /* ═══════════════════════════════════════
       SEED METHOD
       ═══════════════════════════════════════ */

    public function run()
    {
        $templates = [
            // Quotes
            ['key' => 'quote_classic',        'name' => 'Classic Professional',  'type' => 'quote',         'is_default' => true,  'content' => $this->quoteClassic(),        'subject' => 'Quotation #{quote_number} from {company_name}', 'email_body' => "Dear {customer_name},\n\nPlease find attached our quotation #{quote_number}.\n\nBest regards,\n{company_name}"],
            ['key' => 'quote_modern',         'name' => 'Modern Minimal',        'type' => 'quote',         'is_default' => false, 'content' => $this->quoteModern(),         'subject' => 'Your Quote #{quote_number}', 'email_body' => "Hi {customer_name},\n\nHere's your quotation #{quote_number}.\n\nThanks,\n{company_name}"],

            // Invoices
            ['key' => 'invoice_classic',      'name' => 'Classic Professional',  'type' => 'invoice',       'is_default' => true,  'content' => $this->invoiceClassic(),      'subject' => 'Invoice #{invoice_number} from {company_name}', 'email_body' => "Dear {customer_name},\n\nPlease find attached invoice #{invoice_number}.\n\nBest regards,\n{company_name}"],
            ['key' => 'invoice_modern',       'name' => 'Modern Minimal',        'type' => 'invoice',       'is_default' => false, 'content' => $this->invoiceModern(),       'subject' => 'Invoice #{invoice_number}', 'email_body' => "Hi {customer_name},\n\nHere's invoice #{invoice_number}.\n\nThanks,\n{company_name}"],

            // Sales Orders
            ['key' => 'sales_order_classic',  'name' => 'Classic Professional',  'type' => 'sales_order',   'is_default' => true,  'content' => $this->salesOrderClassic(),   'subject' => 'Sales Order #{order_number}', 'email_body' => "Dear {customer_name},\n\nYour sales order #{order_number} is confirmed.\n\nBest regards,\n{company_name}"],
            ['key' => 'sales_order_modern',   'name' => 'Modern Minimal',        'type' => 'sales_order',   'is_default' => false, 'content' => $this->salesOrderModern(),   'subject' => 'Order Confirmation #{order_number}', 'email_body' => "Hi {customer_name},\n\nOrder #{order_number} confirmed.\n\nThanks,\n{company_name}"],

            // Payment Slips
            ['key' => 'payment_slip_classic', 'name' => 'Classic Professional',  'type' => 'payment_slip',  'is_default' => true,  'content' => $this->paymentSlipClassic(), 'subject' => 'Payment Receipt #{receipt_number}', 'email_body' => "Dear {customer_name},\n\nThank you for your payment. Receipt #{receipt_number} is attached.\n\nBest regards,\n{company_name}"],
            ['key' => 'payment_slip_modern',  'name' => 'Modern Minimal',        'type' => 'payment_slip',  'is_default' => false, 'content' => $this->paymentSlipModern(),  'subject' => 'Receipt #{receipt_number}', 'email_body' => "Hi {customer_name},\n\nPayment received — receipt #{receipt_number} attached.\n\nThanks,\n{company_name}"],

            // Purchase Bills
            ['key' => 'purchase_bill_classic', 'name' => 'Classic Professional', 'type' => 'purchase_bill', 'is_default' => true,  'content' => $this->purchaseBillClassic(), 'subject' => 'Purchase Bill #{bill_number}', 'email_body' => null],
            ['key' => 'purchase_bill_modern',  'name' => 'Modern Minimal',       'type' => 'purchase_bill', 'is_default' => false, 'content' => $this->purchaseBillModern(),  'subject' => 'Purchase Bill #{bill_number}', 'email_body' => null],

            // Delivery Notes
            ['key' => 'delivery_note_classic', 'name' => 'Classic Professional', 'type' => 'delivery_note', 'is_default' => true,  'content' => $this->deliveryNoteClassic(), 'subject' => 'Delivery Note #{delivery_number}', 'email_body' => "Dear {customer_name},\n\nDelivery note #{delivery_number} is attached for your reference.\n\nBest regards,\n{company_name}"],
            ['key' => 'delivery_note_modern',  'name' => 'Modern Minimal',       'type' => 'delivery_note', 'is_default' => false, 'content' => $this->deliveryNoteModern(),  'subject' => 'Delivery #{delivery_number}', 'email_body' => "Hi {customer_name},\n\nDelivery note #{delivery_number} attached.\n\nThanks,\n{company_name}"],
        ];

        foreach ($templates as $tpl) {
            Template::updateOrCreate(
                ['key' => $tpl['key']],
                $tpl
            );
        }
    }
}
