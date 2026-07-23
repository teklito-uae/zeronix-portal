import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Package, Search } from 'lucide-react';
import type { Product } from '@/types';
import { emptyQIALine, type QIALineItem } from './types';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { CurrencyAmount } from '@/components/shared/CurrencyAmount';

interface AddFromLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onAdd: (rows: QIALineItem[]) => void;
}

/** Small dialog for multi-selecting products to append to the items list in bulk. */
export const AddFromLibraryDialog = ({ open, onOpenChange, products, onAdd }: AddFromLibraryDialogProps) => {
  const currency = useCurrencyStore((s) => s.currency);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    const rows: QIALineItem[] = products
      .filter((p) => selected.has(p.id))
      .map((p) => ({
        ...emptyQIALine(),
        product_id: p.id,
        description: p.name,
        unit_price: p.price ?? 0,
        product: p,
      }));
    if (rows.length > 0) onAdd(rows);
    setSelected(new Set());
    setSearch('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-brand-white border-brand-border">
        <DialogHeader>
          <DialogTitle className="text-brand-primary text-[15px]">Add from Library</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-subtle" size={13} />
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-[13px] bg-brand-bg border-brand-border rounded-lg"
          />
        </div>

        <div className="max-h-[320px] overflow-y-auto space-y-1 -mx-1 px-1">
          {filtered.length === 0 ? (
            <p className="text-[12px] text-brand-subtle text-center py-6">No products found.</p>
          ) : (
            filtered.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-brand-bg cursor-pointer"
              >
                <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} />
                {p.image ? (
                  <img src={p.image} alt="" className="w-8 h-8 rounded-md object-cover border border-brand-border flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-md bg-brand-surface flex items-center justify-center flex-shrink-0">
                    <Package size={14} className="text-brand-subtle" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-brand-primary truncate">{p.name}</p>
                  {p.price != null && (
                    <p className="text-[11px] text-brand-subtle font-mono"><CurrencyAmount amount={p.price} currency={currency} /></p>
                  )}
                </div>
              </label>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-lg">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selected.size === 0} className="rounded-lg">
            Add {selected.size > 0 ? `${selected.size} item${selected.size > 1 ? 's' : ''}` : 'items'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
