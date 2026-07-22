import type { EditableLineItem } from '@/components/shared/LineItemsEditor';

export interface LineItemLike {
  quantity: number | string;
  unit_price: number | string;
  tax_percent?: number | string;
  discount_percent?: number | string;
}

export const computeLineTotal = (
  quantity: number | string,
  unitPrice: number | string,
  taxPercent: number | string = 0,
  discountPercent: number | string = 0
): number => {
  const qty = Number(quantity) || 0;
  const price = Number(unitPrice) || 0;
  const tax = Number(taxPercent) || 0;
  const discount = Number(discountPercent) || 0;
  const subtotal = qty * price;
  const discountAmt = subtotal * (discount / 100);
  const taxable = subtotal - discountAmt;
  return taxable + taxable * (tax / 100);
};

export interface DocTotals {
  subtotal: number;
  discountAmount: number;
  vat: number;
  shippingAmount: number;
  total: number;
}

export interface DocTotalsOptions {
  /** Header-level discount, applied on top of any per-line discount_percent. */
  discountPercent?: number;
  shippingAmount?: number;
}

export const computeDocTotals = (
  items: LineItemLike[],
  { discountPercent = 0, shippingAmount = 0 }: DocTotalsOptions = {}
): DocTotals => {
  let subtotal = 0;
  let vat = 0;

  items.forEach((item) => {
    const lineSubtotal = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
    const lineDiscountAmt = lineSubtotal * ((Number(item.discount_percent) || 0) / 100);
    const lineTaxable = lineSubtotal - lineDiscountAmt;
    const lineTax = lineTaxable * ((Number(item.tax_percent) || 0) / 100);
    subtotal += lineTaxable;
    vat += lineTax;
  });

  const discountAmount = subtotal * (discountPercent / 100);
  const total = subtotal - discountAmount + vat + shippingAmount;

  return { subtotal, discountAmount, vat, shippingAmount, total };
};

export const normalizeLineItems = (items: any[]): EditableLineItem[] =>
  items.map((item: any) => ({
    ...item,
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    total: Number(item.total),
    tax_percent: Number(item.tax_percent ?? 5),
  }));
