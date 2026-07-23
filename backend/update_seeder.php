<?php
$file = __DIR__ . '/database/seeders/TemplateSeeder.php';
$content = file_get_contents($file);

// 1. Fix the items table wrapper to not have 'section' (which avoids page breaks)
$findItems1 = '<!-- Items -->
  <div class="section" style="margin-bottom: 20px;">
    <table class="items-table">';
$replaceItems1 = '<!-- Items -->
  <div style="margin-bottom: 20px;">
    <table class="items-table">';
$content = str_replace($findItems1, $replaceItems1, $content);

$findItems2 = '<!-- Items Table -->
  <div class="section" style="margin-bottom: 20px;">
    <table class="items-table">';
$replaceItems2 = '<!-- Items Table -->
  <div style="margin-bottom: 20px;">
    <table class="items-table">';
$content = str_replace($findItems2, $replaceItems2, $content);

// 2. Insert Bank Details & Terms just before Footer
$findFooter = '  <!-- Footer -->';
$replaceFooter = '  <!-- Terms & Bank Details -->
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

  <!-- Footer -->';
$content = str_replace($findFooter, $replaceFooter, $content);

file_put_contents($file, $content);
echo "TemplateSeeder updated!\n";
