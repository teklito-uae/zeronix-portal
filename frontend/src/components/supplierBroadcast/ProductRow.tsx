import { useState } from 'react';
import { Pencil, Trash2, Cpu, MemoryStick, HardDrive } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/shared/Spinner';
import { useDeleteSbProduct, useUpdateSbProduct } from '@/hooks/useSupplierBroadcast';
import type { SbProduct } from '@/types';

const CONFIDENCE_VARIANT: Record<SbProduct['parse_confidence'], 'success' | 'warning' | 'secondary'> = {
  high: 'success',
  medium: 'warning',
  low: 'secondary',
};

interface ProductRowProps {
  product: SbProduct;
  canEdit: boolean;
  canDelete: boolean;
}

export const ProductRow = ({ product, canEdit, canDelete }: ProductRowProps) => {
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    product_name: product.product_name || '',
    price: product.price !== null ? String(product.price) : '',
  });

  const updateProduct = useUpdateSbProduct();
  const deleteProduct = useDeleteSbProduct();

  const openEdit = () => {
    setForm({
      product_name: product.product_name || '',
      price: product.price !== null ? String(product.price) : '',
    });
    setEditOpen(true);
  };

  const handleSave = () => {
    updateProduct.mutate(
      {
        id: product.id,
        data: {
          product_name: form.product_name || null,
          price: form.price.trim() === '' ? null : Number(form.price),
        },
      },
      { onSuccess: () => setEditOpen(false) }
    );
  };

  const handleDelete = () => {
    if (!window.confirm('Delete this product row? This cannot be undone.')) return;
    deleteProduct.mutate(product.id);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-brand-border/40 hover:bg-brand-surface/50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-brand-primary truncate">
          {product.product_name || product.raw_line}
        </p>
        <p className="text-[11px] text-brand-subtle truncate mt-0.5">
          {product.vendor?.name || 'Unknown vendor'}
          {product.category?.name ? ` · ${product.category.name}` : ''}
        </p>
      </div>

      <div className="hidden sm:flex items-center gap-1.5 flex-wrap max-w-[220px]">
        {product.spec_ram && (
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <MemoryStick size={10} /> {product.spec_ram}
          </Badge>
        )}
        {product.spec_storage && (
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <HardDrive size={10} /> {product.spec_storage}
          </Badge>
        )}
        {product.spec_cpu && (
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <Cpu size={10} /> {product.spec_cpu}
          </Badge>
        )}
      </div>

      <div className="w-24 text-right shrink-0">
        {product.price !== null ? (
          <span className="text-[13px] font-semibold text-brand-primary">
            {product.currency ? `${product.currency} ` : ''}{product.price.toLocaleString()}
          </span>
        ) : (
          <Badge variant="secondary" className="text-[10px]">No price</Badge>
        )}
      </div>

      <div className="w-20 shrink-0">
        <Badge variant={CONFIDENCE_VARIANT[product.parse_confidence]} className="text-[10px] capitalize">
          {product.parse_confidence}
        </Badge>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {canEdit && (
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-brand-subtle hover:text-brand-primary" onClick={openEdit}>
            <Pencil size={14} />
          </Button>
        )}
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-brand-subtle hover:text-brand-danger"
            onClick={handleDelete}
            disabled={deleteProduct.isPending}
          >
            <Trash2 size={14} />
          </Button>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-brand-secondary">Product Name</Label>
              <Input
                value={form.product_name}
                onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                placeholder="Product name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-brand-secondary">Price</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="Leave blank if unknown"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-brand-secondary">Raw Line (reference)</Label>
              <p className="text-[12px] text-brand-subtle bg-brand-surface rounded-lg p-2 break-words">
                {product.raw_line}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateProduct.isPending}>
              {updateProduct.isPending ? <Spinner size={16} className="mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
