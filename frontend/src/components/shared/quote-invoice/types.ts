import type { EditableLineItem } from '@/components/shared/LineItemsEditor';

/**
 * Line item shape used across the Quote/Invoice editor — the same fields
 * LineItemsEditor's EditableLineItem uses, plus the new per-line discount.
 */
export interface QIALineItem extends EditableLineItem {
  discount_percent?: number | string;
}

export const emptyQIALine = (): QIALineItem => ({
  product_id: undefined,
  description: '',
  quantity: 1,
  unit_price: 0,
  tax_percent: 5,
  discount_percent: 0,
});

/** Normalize raw API line items (Quote/Invoice items) into editable rows. */
export const normalizeQIAItems = (items: any[] = []): QIALineItem[] =>
  items.map((item) => ({
    ...item,
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    total: Number(item.total),
    tax_percent: Number(item.tax_percent ?? 5),
    discount_percent: Number(item.discount_percent ?? 0),
  }));
