import { useMemo } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { LineItemsEditor, type EditableLineItem } from '@/components/shared/LineItemsEditor';
import type { Product } from '@/types';
import type { CreateDealFormValues } from '../CreateDealDialog.schema';

interface LineItemsSectionProps {
  products: Product[];
}

/**
 * Thin wrapper around the shared `LineItemsEditor` (already used by
 * Quote/Invoice/PurchaseBill editors — see
 * frontend/src/components/shared/TransactionEditor.tsx for the reference
 * usage) wired to react-hook-form's `useFieldArray` for the deal's `items`.
 *
 * `LineItemsEditor`'s `EditableLineItem` shape doesn't carry
 * `discount_percent` (its own UI has no field for it), so that value is
 * preserved from the existing field-array entry rather than exposed for
 * editing here — matching the current "New Deal" sheet, whose line items UI
 * also has no discount input and defaults it to 0.
 */
export function LineItemsSection({ products }: LineItemsSectionProps) {
  const { control } = useFormContext<CreateDealFormValues>();
  const { fields, replace } = useFieldArray({ control, name: 'items' });

  const editableItems: EditableLineItem[] = useMemo(
    () =>
      fields.map((item) => ({
        product_id: item.product_id,
        description: products.find((p) => p.id === item.product_id)?.name ?? '',
        quantity: item.quantity,
        unit_price: item.unit_price ?? 0,
        tax_percent: item.tax_percent ?? 5,
      })),
    [fields, products]
  );

  const handleChange = (next: EditableLineItem[]) => {
    replace(
      next.map((row, index) => ({
        product_id: row.product_id ?? undefined,
        quantity: Number(row.quantity) || 1,
        unit_price: row.unit_price === '' || row.unit_price === undefined ? undefined : Number(row.unit_price),
        tax_percent: row.tax_percent === '' || row.tax_percent === undefined ? undefined : Number(row.tax_percent),
        discount_percent: fields[index]?.discount_percent ?? 0,
      }))
    );
  };

  return <LineItemsEditor items={editableItems} onChange={handleChange} products={products} />;
}
