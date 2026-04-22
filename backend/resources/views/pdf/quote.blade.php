<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Quote #{{ $quote->quote_number }}</title>
    <style>
        @page { size: A4; margin: 1cm; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11px; color: #333; margin: 0; padding: 0; line-height: 1.5; }
        table { width: 100%; border-collapse: collapse; }
        
        .header-section { margin-bottom: 30px; }
        .logo-img { width: 150px; margin-bottom: 5px; }
        .company-info { font-size: 11px; color: #444; }
        
        .doc-type { font-size: 32px; color: #000; text-align: right; font-weight: normal; margin: 0; }
        .doc-number { font-size: 13px; text-align: right; font-weight: bold; margin-top: 5px; }
        
        .bill-to-section { margin-bottom: 30px; }
        .label { color: #666; font-size: 11px; margin-bottom: 4px; }
        .customer-name { font-weight: bold; font-size: 12px; text-transform: uppercase; }
        
        .item-table { margin-top: 20px; width: 100%; }
        .item-table th { background: #444; color: #fff; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: normal; }
        .item-table td { padding: 12px 10px; border-bottom: 1px solid #eee; vertical-align: top; }
        
        .totals-section { margin-top: 5px; }
        .totals-table td { padding: 6px 10px; text-align: right; }
        .total-row { background: #f9f9f9; font-weight: bold; font-size: 12px; }
        .words-total { text-align: right; font-style: italic; margin-top: 15px; font-size: 11px; }

        .tax-summary { margin-top: 40px; }
        .tax-summary h4 { margin: 0 0 10px 0; font-size: 12px; color: #444; font-weight: normal; }
        .tax-table th { background: #444; color: #fff; padding: 6px 10px; font-weight: normal; text-align: right; }
        .tax-table th:first-child { text-align: left; }
        .tax-table td { padding: 8px 10px; border-bottom: 1px solid #eee; text-align: right; font-size: 11px; }
        .tax-table td:first-child { text-align: left; }

        .bank-details { margin-top: 40px; }
        .bank-details h4 { margin: 0 0 10px 0; font-size: 10px; text-transform: uppercase; }
        
        .footer-page { position: fixed; bottom: 0; right: 0; font-size: 9px; color: #999; }
    </style>
</head>
<body>
    <div class="header-section">
        <table style="width: 100%;">
            <tr>
                <td style="vertical-align: top;">
                    <div style="font-size: 24px; font-weight: bold; color: #001f3f;">
                        <span style="color: #10b981;">Z</span>ERONIX
                        <div style="font-size: 8px; font-weight: normal; letter-spacing: 2px; color: #666; margin-top: -5px;">TECHNOLOGY</div>
                    </div>
                    <div class="company-info" style="margin-top: 10px;">
                        <strong>Zeronix Technology LLC</strong><br>
                        #19 Khurram Building, Al-Raffa Street<br>
                        BurDubai Dubai<br>
                        United Arab Emirates<br>
                        TRN 104865090500003<br>
                        +971509811669<br>
                        info@zeronix.ae<br>
                        https://zeronix.ae
                    </div>
                </td>
                <td style="vertical-align: top; text-align: right;">
                    <h1 class="doc-type">Quote</h1>
                    <div class="doc-number"># {{ $quote->quote_number }}</div>
                </td>
            </tr>
        </table>
    </div>

    <div class="bill-to-section">
        <table style="width: 100%;">
            <tr>
                <td style="width: 60%;">
                    <div class="label">Bill To</div>
                    <div class="customer-name">{{ $quote->customer->name }}</div>
                    <div style="margin-top: 2px;">{{ $quote->customer->company }}</div>
                    <div>{{ $quote->customer->address }}</div>
                </td>
                <td style="text-align: right; vertical-align: bottom;">
                    <span style="color: #666;">Quote Date :</span> &nbsp;&nbsp;&nbsp;&nbsp; {{ date('d M Y', strtotime($quote->date)) }}
                </td>
            </tr>
        </table>
    </div>

    <table class="item-table">
        <thead>
            <tr>
                <th style="width: 20px;">#</th>
                <th>Item & Description</th>
                <th style="width: 50px; text-align: center;">Qty</th>
                <th style="width: 80px; text-align: right;">Rate</th>
                <th style="width: 60px; text-align: right;">Tax</th>
                <th style="width: 90px; text-align: right;">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($quote->items as $index => $item)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>
                    <strong>{{ $item->product_name }}</strong><br>
                    <span style="color: #666; font-size: 8px;">{{ $item->description }}</span>
                </td>
                <td style="text-align: center;">{{ number_format($item->quantity, 2) }}</td>
                <td style="text-align: right;">{{ number_format($item->unit_price, 2) }}</td>
                <td style="text-align: right;">{{ number_format($item->total * 0.05, 2) }}<br><span style="font-size: 7px; color: #999;">5.00%</span></td>
                <td style="text-align: right;">{{ number_format($item->total, 2) }}</td>
            </tr>
            @endforeach
            <tr>
                <td colspan="4" style="border: 0;"></td>
                <td style="text-align: right; font-weight: bold; border-bottom: 0;">Sub Total</td>
                <td style="text-align: right; font-weight: bold; border-bottom: 0;">{{ number_format($quote->subtotal, 2) }}</td>
            </tr>
            <tr class="total-row">
                <td colspan="2" style="border: 0; background: white;">Items in Total {{ count($quote->items) }}.00</td>
                <td colspan="2" style="border: 0; background: white;"></td>
                <td style="text-align: right; padding: 10px 8px;">Total</td>
                <td style="text-align: right; padding: 10px 8px;">AED{{ number_format($quote->total, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <div class="words-total">
        Total In Words: &nbsp;&nbsp; <strong>UAE Dirham {{ \App\Helpers\NumberHelper::toWords($quote->total) }}</strong>
    </div>

    <div class="tax-summary">
        <h4>Tax Summary</h4>
        <table class="tax-table" style="width: 100%;">
            <thead>
                <tr>
                    <th>Tax Details</th>
                    <th>Taxable Amount (AED)</th>
                    <th>Tax Amount (AED)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Standard Rate (5%)</td>
                    <td>{{ number_format($quote->subtotal, 2) }}</td>
                    <td>{{ number_format($quote->vat_amount, 2) }}</td>
                </tr>
                <tr style="font-weight: bold; border-top: 1px solid #eee;">
                    <td>Total</td>
                    <td>AED{{ number_format($quote->subtotal, 2) }}</td>
                    <td>AED{{ number_format($quote->vat_amount, 2) }}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="bank-details">
        <div style="color: #666; margin-bottom: 5px;">Notes</div>
        <div style="font-size: 9px; margin-bottom: 15px;">Looking forward for your business.</div>
        
        <h4>BANK ACCOUNT DETAILS :</h4>
        <div style="font-weight: bold; margin-bottom: 2px;">Abudhabi Commercial Bank (ADCB)</div>
        <div>Zeronix Technology LLC</div>
        <div>Account No: 14175801820001</div>
        <div>IBAN: AE250030014175801820001</div>
    </div>

    <div class="footer-page">
        1
    </div>
</body>
</html>
