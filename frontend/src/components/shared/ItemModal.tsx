import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Package, Percent, DollarSign, Calculator, Tag, Hash, Search } from 'lucide-react';
import { ProductSearch } from './ProductSearch';
import type { Product, QuoteItem, InvoiceItem } from '@/types';
import { Separator } from '@/components/ui/separator';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: any) => void;
  item: QuoteItem | InvoiceItem | null;
  products: Product[];
}

export const ItemModal = ({ isOpen, onClose, onSave, item, products }: ItemModalProps) => {
  const [formData, setFormData] = useState({
    product_id: undefined as number | undefined,
    description: '',
    quantity: 1,
    unit_price: 0,
    tax_percent: 5,
    total: 0,
  });

  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('fixed');

  useEffect(() => {
    if (item) {
      setFormData({
        product_id: item.product_id ?? undefined,
        description: item.description || '',
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
        tax_percent: Number(item.tax_percent ?? 5),
        total: Number(item.total) || 0,
      });
    } else {
      setFormData({ product_id: undefined, description: '', quantity: 1, unit_price: 0, tax_percent: 5, total: 0 });
      setDiscount(0);
    }
  }, [item, isOpen]);

  const calc = () => {
    const qty = Number(formData.quantity) || 0;
    const price = Number(formData.unit_price) || 0;
    const tax = Number(formData.tax_percent) || 0;
    const sub = qty * price;
    const disc = discountType === 'percent' ? sub * (discount / 100) : Math.min(sub, discount);
    const after = sub - disc;
    const vatAmt = after * (tax / 100);
    return { sub, disc, vat: vatAmt, total: after + vatAmt };
  };

  const t = calc();

  const handleProductSelect = (product: any) => {
    setFormData({
      ...formData,
      product_id: product.id,
      description: product.id
        ? `${product.name}${product.description ? ' — ' + product.description : ''}`
        : product.name,
      unit_price: Number(product.price) || formData.unit_price || 0,
    });
  };

  const handleSave = () => {
    onSave({ ...formData, total: t.total });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[780px] w-[95vw] bg-admin-surface border-admin-border p-0 overflow-hidden rounded-md">
        <DialogHeader className="px-5 py-3 border-b border-admin-border bg-admin-bg/50">
          <DialogTitle className="text-sm font-medium text-admin-text-primary flex items-center gap-2">
            <Package size={16} className="text-zeronix-blue" />
            {item ? 'Edit Line Item' : 'Add Line Item'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row">
          {/* Form */}
          <div className="flex-1 p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-1.5">
              <Label className="text-xs text-admin-text-secondary flex items-center gap-1"><Search size={11} /> Product</Label>
              <ProductSearch products={products} selectedProductId={formData.product_id} onSelect={handleProductSelect} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-admin-text-secondary">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Item description…"
                className="bg-admin-bg border-admin-border rounded-md resize-none min-h-[70px] text-sm"
              />
            </div>

            <Separator className="bg-admin-border" />

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-admin-text-secondary flex items-center gap-1"><Hash size={11} /> Qty</Label>
                <Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })} className="h-9 bg-admin-bg border-admin-border rounded-md text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-admin-text-secondary flex items-center gap-1"><DollarSign size={11} /> Unit Price</Label>
                <Input type="number" value={formData.unit_price} onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })} className="h-9 bg-admin-bg border-admin-border rounded-md text-sm font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-admin-text-secondary flex items-center gap-1"><Percent size={11} /> VAT</Label>
                <Select value={String(formData.tax_percent)} onValueChange={(v) => setFormData({ ...formData, tax_percent: Number(v) })}>
                  <SelectTrigger className="h-9 bg-admin-bg border-admin-border rounded-md text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-admin-surface border-admin-border">
                    <SelectItem value="5">VAT 5%</SelectItem>
                    <SelectItem value="0">Zero (0%)</SelectItem>
                    <SelectItem value="0.1">Net</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Discount */}
            <div className="bg-admin-bg/50 p-3 rounded-md border border-dashed border-admin-border space-y-2">
              <p className="text-xs text-admin-text-muted flex items-center gap-1"><Tag size={11} /> Discount (optional)</p>
              <div className="flex gap-2">
                <Input type="number" value={discount || ''} onChange={(e) => setDiscount(Number(e.target.value))} placeholder="0" className="h-9 bg-admin-surface border-admin-border rounded-md flex-1 text-sm" />
                <div className="flex bg-admin-surface border border-admin-border rounded-md overflow-hidden h-9">
                  <button type="button" onClick={() => setDiscountType('fixed')} className={cn("px-2.5 text-xs transition-colors", discountType === 'fixed' ? "bg-zeronix-blue text-white" : "text-admin-text-muted")}>AED</button>
                  <button type="button" onClick={() => setDiscountType('percent')} className={cn("px-2.5 text-xs transition-colors", discountType === 'percent' ? "bg-zeronix-blue text-white" : "text-admin-text-muted")}>%</button>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="w-full md:w-56 bg-admin-bg/50 border-t md:border-t-0 md:border-l border-admin-border p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="text-xs text-admin-text-muted uppercase tracking-wide flex items-center gap-1"><Calculator size={11} /> Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-admin-text-muted">Subtotal</span><span className="font-mono text-admin-text-primary">{t.sub.toFixed(2)}</span></div>
                {t.disc > 0 && <div className="flex justify-between text-danger"><span>Discount</span><span className="font-mono">-{t.disc.toFixed(2)}</span></div>}
                <div className="flex justify-between"><span className="text-admin-text-muted">VAT</span><span className="font-mono text-admin-text-primary">{t.vat.toFixed(2)}</span></div>
              </div>
              <div className="pt-3 border-t border-admin-border">
                <div className="bg-zeronix-blue text-white p-3 rounded-md">
                  <p className="text-[11px] uppercase tracking-wide opacity-80">Total</p>
                  <p className="text-base font-semibold font-mono mt-0.5">{t.total.toFixed(2)} <span className="text-xs font-normal">AED</span></p>
                </div>
              </div>
            </div>
            <div className="pt-4 flex flex-col gap-2">
              <Button variant="ghost" onClick={onClose} className="w-full h-9 rounded-md text-sm text-admin-text-muted">Cancel</Button>
              <Button onClick={handleSave} className="w-full h-9 rounded-md bg-zeronix-blue hover:bg-zeronix-blue-hover text-white text-sm">{item ? 'Update' : 'Add Item'}</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
