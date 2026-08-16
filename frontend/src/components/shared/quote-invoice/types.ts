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

/**
 * Normalize raw API line items (Quote/Invoice/PurchaseBill items) into
 * editable rows. The input is trusted server JSON whose exact shape varies
 * by document type, so it's accepted loosely and the cast below reflects
 * that we're relying on the server to have supplied the QIALineItem fields
 * (description, product_id, etc.) verbatim — only the numeric fields are
 * actually normalized here.
 */
export const normalizeQIAItems = (items: Record<string, unknown>[] = []): QIALineItem[] =>
  items.map((item) => ({
    ...item,
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    total: Number(item.total),
    tax_percent: Number(item.tax_percent ?? 5),
    discount_percent: Number(item.discount_percent ?? 0),
  })) as QIALineItem[];
