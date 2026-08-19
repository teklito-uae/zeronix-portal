<?php

namespace App\Support;

/**
 * Money math for document line items (quotes, invoices, purchase bills,
 * sales orders, deals). Mirrors frontend/src/lib/lineItemMath.ts so client
 * previews and persisted totals always agree.
 */
class LineItemMath
{
    /**
     * Per-line breakdown for a validated line-item payload.
     *
     * @param  array  $item  ['quantity', 'unit_price', 'discount_percent'?, 'tax_percent'?]
     * @return array{subtotal: float, discount_percent: float, discount_amount: float, taxable: float, tax_percent: float, tax_amount: float, total: float}
     */
    public static function line(array $item, float $defaultTaxPercent = 5): array
    {
        $quantity = (float) ($item['quantity'] ?? 0);
        $unitPrice = (float) ($item['unit_price'] ?? 0);
        $discountPercent = (float) ($item['discount_percent'] ?? 0);
        $taxPercent = (float) ($item['tax_percent'] ?? $defaultTaxPercent);

        $subtotal = $quantity * $unitPrice;
        $discountAmount = $subtotal * ($discountPercent / 100);
        $taxable = $subtotal - $discountAmount;
        $taxAmount = $taxable * ($taxPercent / 100);

        return [
            'subtotal' => $subtotal,
            'discount_percent' => $discountPercent,
            'discount_amount' => $discountAmount,
            'taxable' => $taxable,
            'tax_percent' => $taxPercent,
            'tax_amount' => $taxAmount,
            'total' => $taxable + $taxAmount,
        ];
    }

    /**
     * Document-level totals across line items, with an optional header-level
     * discount (applied on top of per-line discounts) and shipping amount.
     *
     * @param  array<int, array>  $items
     * @return array{subtotal: float, vat_amount: float, total: float}
     */
    public static function totals(
        array $items,
        float $discountPercent = 0,
        float $shippingAmount = 0,
        float $defaultTaxPercent = 5
    ): array {
        $subtotal = 0.0;
        $vatAmount = 0.0;

        foreach ($items as $item) {
            $line = self::line($item, $defaultTaxPercent);
            $subtotal += $line['taxable'];
            $vatAmount += $line['tax_amount'];
        }

        $headerDiscount = $subtotal * ($discountPercent / 100);

        return [
            'subtotal' => $subtotal,
            'vat_amount' => $vatAmount,
            'total' => $subtotal - $headerDiscount + $vatAmount + $shippingAmount,
        ];
    }
}
