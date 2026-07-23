import { useRef, useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProductSearch } from '@/components/shared/ProductSearch';
import { computeLineTotal } from '@/lib/lineItemMath';
import { Plus, Library, Package, MoreVertical, Trash2 } from 'lucide-react';
import type { Product } from '@/types';
import { emptyQIALine, type QIALineItem } from './types';

interface ItemsTableProps {
  items: QIALineItem[];
  onChange: (items: QIALineItem[]) => void;
  products: Product[];
  disabled?: boolean;
  onOpenLibrary: () => void;
  /** Purchase Bills only: adds a read-only "Stock" column showing current → projected stock per line. */
  showStock?: boolean;
  /** Purchase Bills only: product_id -> supplier cost price, preferred over Product.price when prefilling a line's unit_price. */
  costLookup?: Record<number, number>;
}

const TAX_OPTIONS = [0, 5, 10, 15, 20];

export const ItemsTable = ({ items, onChange, products, disabled, onOpenLibrary, showStock, costLookup }: ItemsTableProps) => {
  const refs = useRef<Record<string, HTMLInputElement | null>>({});
  const [focusTarget, setFocusTarget] = useState<string | null>(null);

  useEffect(() => {
    if (focusTarget && refs.current[focusTarget]) {
      refs.current[focusTarget]?.focus();
      setFocusTarget(null);
    }
  }, [focusTarget, items.length]);

  const update = (index: number, patch: Partial<QIALineItem>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addLine = () => {
    const newIndex = items.length;
    onChange([...items, emptyQIALine()]);
    setFocusTarget(`${newIndex}-desc`);
  };

  return (
    <div className="flex flex-col">
      <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-[14px] font-semibold text-brand-primary">Items</h3>
          <span className="bg-brand-bg text-brand-primary text-[11px] font-medium px-2 py-0.5 rounded-full">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenLibrary}
          disabled={disabled}
          className="flex items-center gap-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Library size={14} />
          Product Library
        </button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-transparent">
            <TableRow className="border-brand-border hover:bg-transparent">
              <TableHead className="w-10" />
              <TableHead className="min-w-[240px] text-[11px] font-semibold uppercase tracking-wider text-brand-subtle">Product / Description</TableHead>
              <TableHead className="text-center text-[11px] font-semibold uppercase tracking-wider text-brand-subtle w-16">Qty</TableHead>
              <TableHead className="text-center text-[11px] font-semibold uppercase tracking-wider text-brand-subtle w-14">Unit</TableHead>
              <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-brand-subtle w-28">Unit Price</TableHead>
              <TableHead className="text-center text-[11px] font-semibold uppercase tracking-wider text-brand-subtle w-20">Tax %</TableHead>
              <TableHead className="text-center text-[11px] font-semibold uppercase tracking-wider text-brand-subtle w-20">Disc %</TableHead>
              {showStock && (
                <TableHead className="text-center text-[11px] font-semibold uppercase tracking-wider text-brand-subtle w-24">Stock</TableHead>
              )}
              <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-brand-subtle w-28">Amount</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, i) => {
              const amount = computeLineTotal(item.quantity, item.unit_price, 0, item.discount_percent);
              return (
                <TableRow key={i} className="border-brand-border group hover:bg-brand-bg/40 transition-colors align-top">
                  <TableCell className="py-2.5 pl-3">
                    {item.product?.image ? (
                      <img src={item.product.image} alt="" className="w-9 h-9 rounded-md object-cover border border-brand-border" />
                    ) : (
                      <div className="w-9 h-9 rounded-md bg-brand-surface border border-brand-border flex items-center justify-center">
                        <Package size={15} className="text-brand-subtle" />
                      </div>
                    )}
                  </TableCell>
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
                        unit_price: costLookup ? (costLookup[product.id] ?? product.price ?? item.unit_price) : (product.price ?? item.unit_price),
                        product,
                      })}
                    />
                    <input
                      ref={(el) => { refs.current[`${i}-desc`] = el; }}
                      value={item.description}
                      disabled={disabled}
                      onChange={(e) => update(i, { description: e.target.value })}
                      placeholder="Description…"
                      className="w-full bg-transparent text-[12px] text-brand-muted placeholder:text-brand-subtle/70 outline-none px-1.5 py-0.5 mt-0.5 rounded focus:bg-brand-bg disabled:opacity-60"
                    />
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <input
                      type="number"
                      value={item.quantity}
                      disabled={disabled}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => update(i, { quantity: e.target.value === '' ? '' : Number(e.target.value) })}
                      onBlur={() => { if (item.quantity === '' || Number.isNaN(Number(item.quantity))) update(i, { quantity: 0 }); }}
                      className="w-full bg-transparent text-[13px] text-brand-primary text-center outline-none px-1 py-1 rounded focus:bg-brand-bg focus:ring-1 focus:ring-brand-accent/30 disabled:opacity-60"
                    />
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <span className="text-[12px] text-brand-subtle">Nos</span>
                  </TableCell>
                  <TableCell className="text-right py-2.5">
                    <input
                      type="number"
                      value={item.unit_price}
                      disabled={disabled}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => update(i, { unit_price: e.target.value === '' ? '' : Number(e.target.value) })}
                      onBlur={() => { if (item.unit_price === '' || Number.isNaN(Number(item.unit_price))) update(i, { unit_price: 0 }); }}
                      className="w-full bg-transparent text-[13px] text-brand-primary text-right font-mono outline-none px-1 py-1 rounded focus:bg-brand-bg focus:ring-1 focus:ring-brand-accent/30 disabled:opacity-60"
                    />
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <Select
                      value={String(Number(item.tax_percent) || 0)}
                      onValueChange={(v) => update(i, { tax_percent: Number(v) })}
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-8 text-[12px] bg-transparent border-brand-border rounded-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-brand-white border-brand-border rounded-lg">
                        {TAX_OPTIONS.map((t) => (
                          <SelectItem key={t} value={String(t)} className="text-[12px]">{t}%</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={item.discount_percent ?? 0}
                      disabled={disabled}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => update(i, { discount_percent: e.target.value === '' ? '' : Number(e.target.value) })}
                      onBlur={() => { if (item.discount_percent === '' || Number.isNaN(Number(item.discount_percent))) update(i, { discount_percent: 0 }); }}
                      className="w-full bg-transparent text-[13px] text-brand-primary text-center outline-none px-1 py-1 rounded focus:bg-brand-bg focus:ring-1 focus:ring-brand-accent/30 disabled:opacity-60"
                    />
                  </TableCell>
                  {showStock && (
                    <TableCell className="text-center py-2.5">
                      {item.product ? (
                        <span className="text-[11px] font-mono text-brand-muted whitespace-nowrap">
                          {item.product.stock_quantity ?? 0} <span className="text-brand-subtle">&rarr;</span> {(item.product.stock_quantity ?? 0) + (Number(item.quantity) || 0)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-brand-subtle">—</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-right text-[13px] font-mono font-semibold text-brand-primary py-2.5 pr-3">
                    {amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right py-2.5 pr-2">
                    {!disabled && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="h-7 w-7 inline-flex items-center justify-center text-brand-subtle hover:text-brand-primary hover:bg-brand-bg rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical size={14} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-brand-white border-brand-border rounded-lg">
                          <DropdownMenuItem onClick={() => remove(i)} className="text-brand-danger focus:text-brand-danger cursor-pointer">
                            <Trash2 size={13} className="mr-2" /> Remove line
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={showStock ? 10 : 9} className="h-32 text-center align-middle">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <span className="text-[13px] text-brand-subtle font-medium">No line items yet.</span>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={onOpenLibrary}
                        className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium text-brand-primary border border-brand-border hover:bg-brand-bg rounded-lg transition-colors bg-brand-white shadow-sm"
                      >
                        <Library size={14} /> Add from Library
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!disabled && (
        <div className="p-4 border-t border-brand-border bg-brand-white/50 flex flex-col gap-2">
          <button
            type="button"
            onClick={onOpenLibrary}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-semibold text-brand-accent hover:bg-brand-accent/5 border border-dashed border-brand-accent/30 rounded-lg transition-colors"
          >
            <Library size={15} /> Add from Library
          </button>
          <button
            type="button"
            onClick={addLine}
            className="w-full text-[11px] text-brand-subtle hover:text-brand-primary font-medium underline underline-offset-2 text-center transition-colors"
          >
            or add a blank row
          </button>
        </div>
      )}
    </div>
  );
};
