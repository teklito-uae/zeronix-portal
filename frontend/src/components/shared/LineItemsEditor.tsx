import { useRef, useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ProductSearch } from './ProductSearch';
import { computeLineTotal, computeDocTotals } from '@/lib/lineItemMath';
import { Plus, Trash2 } from 'lucide-react';
import type { Product } from '@/types';

export interface EditableLineItem {
  id?: number;
  product_id?: number | null;
  description: string;
  quantity: number | string;
  unit_price: number | string;
  tax_percent: number | string;
  total?: number;
  product?: Product;
}

interface LineItemsEditorProps {
  items: EditableLineItem[];
  onChange: (items: EditableLineItem[]) => void;
  products: Product[];
  disabled?: boolean;
  currency?: string;
}

const emptyRow = (): EditableLineItem => ({
  product_id: undefined,
  description: '',
  quantity: 1,
  unit_price: 0,
  tax_percent: 5,
});

const FIELD_ORDER = ['desc', 'qty', 'price', 'tax'] as const;

/**
 * Spreadsheet-style line items table — every cell is editable in place,
 * no dialog. The last row is a standing "add line" affordance.
 */
export const LineItemsEditor = ({ items, onChange, products, disabled, currency = 'AED' }: LineItemsEditorProps) => {
  const totals = computeDocTotals(items);
  const refs = useRef<Record<string, HTMLInputElement | HTMLButtonElement | null>>({});
  const [focusTarget, setFocusTarget] = useState<string | null>(null);

  useEffect(() => {
    if (focusTarget && refs.current[focusTarget]) {
      refs.current[focusTarget]?.focus();
      setFocusTarget(null);
    }
  }, [focusTarget, items.length]);

  const update = (index: number, patch: Partial<EditableLineItem>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addLine = () => {
    const newIndex = items.length;
    onChange([...items, emptyRow()]);
    setFocusTarget(`${newIndex}-desc`);
  };

  const focusNext = (index: number, field: (typeof FIELD_ORDER)[number]) => {
    const fi = FIELD_ORDER.indexOf(field);
    if (fi < FIELD_ORDER.length - 1) {
      setFocusTarget(`${index}-${FIELD_ORDER[fi + 1]}`);
    } else if (index < items.length - 1) {
      setFocusTarget(`${index + 1}-${FIELD_ORDER[0]}`);
    } else {
      addLine();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, field: (typeof FIELD_ORDER)[number]) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      focusNext(index, field);
    }
  };

  const numericCellClass = "w-full bg-transparent text-sm text-admin-text-primary outline-none px-1 py-1 rounded focus:bg-admin-bg focus:ring-1 focus:ring-zeronix-blue/30 disabled:opacity-60";

  return (
    <div className="bg-admin-surface border border-admin-border rounded-lg overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-admin-bg/30">
            <TableRow className="border-admin-border hover:bg-transparent">
              <TableHead className="w-10 text-center text-[11px] font-semibold uppercase tracking-wider text-admin-text-muted">#</TableHead>
              <TableHead className="min-w-[280px] text-[11px] font-semibold uppercase tracking-wider text-admin-text-muted">Product / Description</TableHead>
              <TableHead className="text-center text-[11px] font-semibold uppercase tracking-wider text-admin-text-muted w-20">Qty</TableHead>
              <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-admin-text-muted w-28">Unit Price</TableHead>
              <TableHead className="text-center text-[11px] font-semibold uppercase tracking-wider text-admin-text-muted w-16">Tax %</TableHead>
              <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-admin-text-muted w-32">Total</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, i) => {
              const lineTotal = computeLineTotal(item.quantity, item.unit_price, item.tax_percent);
              return (
                <TableRow key={i} className="border-admin-border group hover:bg-admin-surface-hover/40 transition-colors align-top">
                  <TableCell className="text-center text-xs text-admin-text-muted font-medium pt-3.5">{i + 1}</TableCell>
                  <TableCell className="py-2">
                    <ProductSearch
                      size="cell"
                      products={products}
                      selectedProductId={item.product_id ?? undefined}
                      disabled={disabled}
                      placeholder="Pick a product…"
                      onSelect={(product) => update(i, {
                        product_id: product.id,
                        description: item.description || product.name,
                        unit_price: product.price ?? item.unit_price,
                      })}
                    />
                    <input
                      ref={(el) => { refs.current[`${i}-desc`] = el; }}
                      value={item.description}
                      disabled={disabled}
                      onChange={(e) => update(i, { description: e.target.value })}
                      onKeyDown={(e) => handleKeyDown(e, i, 'desc')}
                      placeholder="Description…"
                      className="w-full bg-transparent text-xs text-admin-text-secondary placeholder:text-admin-text-muted/60 outline-none px-1.5 py-0.5 mt-0.5 rounded focus:bg-admin-bg disabled:opacity-60"
                    />
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <input
                      ref={(el) => { refs.current[`${i}-qty`] = el; }}
                      type="number"
                      value={item.quantity}
                      disabled={disabled}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => update(i, { quantity: e.target.value === '' ? '' : Number(e.target.value) })}
                      onBlur={() => { if (item.quantity === '' || Number.isNaN(Number(item.quantity))) update(i, { quantity: 0 }); }}
                      onKeyDown={(e) => handleKeyDown(e, i, 'qty')}
                      className={`${numericCellClass} text-center`}
                    />
                  </TableCell>
                  <TableCell className="text-right py-2">
                    <input
                      ref={(el) => { refs.current[`${i}-price`] = el; }}
                      type="number"
                      value={item.unit_price}
                      disabled={disabled}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => update(i, { unit_price: e.target.value === '' ? '' : Number(e.target.value) })}
                      onBlur={() => { if (item.unit_price === '' || Number.isNaN(Number(item.unit_price))) update(i, { unit_price: 0 }); }}
                      onKeyDown={(e) => handleKeyDown(e, i, 'price')}
                      className={`${numericCellClass} text-right font-mono`}
                    />
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <input
                      ref={(el) => { refs.current[`${i}-tax`] = el; }}
                      type="number"
                      value={item.tax_percent}
                      disabled={disabled}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => update(i, { tax_percent: e.target.value === '' ? '' : Number(e.target.value) })}
                      onBlur={() => { if (item.tax_percent === '' || Number.isNaN(Number(item.tax_percent))) update(i, { tax_percent: 0 }); }}
                      onKeyDown={(e) => handleKeyDown(e, i, 'tax')}
                      className={`${numericCellClass} text-center`}
                    />
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono font-semibold text-admin-text-primary py-2 pt-3.5">
                    {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right py-2 pt-3">
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        className="h-7 w-7 inline-flex items-center justify-center text-admin-text-muted hover:text-danger hover:bg-danger/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {!disabled && (
              <TableRow className="border-admin-border hover:bg-admin-surface-hover/30 transition-colors">
                <TableCell colSpan={7} className="p-0">
                  <button
                    ref={(el) => { refs.current['add-line'] = el; }}
                    type="button"
                    onClick={addLine}
                    className="w-full flex items-center gap-2 px-4 py-3 text-xs font-medium text-admin-text-muted hover:text-zeronix-blue border-t border-dashed border-admin-border transition-colors"
                  >
                    <Plus size={14} /> Add line
                  </button>
                </TableCell>
              </TableRow>
            )}
            {items.length === 0 && disabled && (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-xs text-admin-text-muted opacity-50">
                  No line items.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="border-t border-admin-border bg-admin-bg/20 px-6 py-4 flex justify-end">
        <div className="w-full max-w-xs space-y-2">
          <div className="flex justify-between text-xs text-admin-text-secondary">
            <span>Subtotal</span>
            <span className="font-mono">{totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-xs text-admin-text-secondary">
            <span>VAT</span>
            <span className="font-mono">{totals.vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-baseline pt-2 border-t border-admin-border">
            <span className="text-xs font-semibold uppercase tracking-wide text-admin-text-primary">Total</span>
            <span className="text-lg font-bold font-mono text-zeronix-blue">
              {totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}{' '}
              <span className="text-[11px] font-semibold text-admin-text-muted">{currency}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
