import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useResourceMutation } from '@/hooks/useApi';
import type { Product } from '@/types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: Product | null;
  brands: any[];
  categories: any[];
}

/**
 * Shared Product Modal for Add/Update
 * Reusable across Products inventory and Supplier catalogs.
 */
export const ProductModal = ({ isOpen, onClose, editingProduct, brands, categories }: ProductModalProps) => {
  const [form, setForm] = useState({
    name: '', model_code: '', brand_id: '', category_id: '', description: '', price: '',
  });
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([]);

  const { create, update } = useResourceMutation('products');

  useEffect(() => {
    if (editingProduct) {
      setForm({
        name: editingProduct.name,
        model_code: editingProduct.model_code || '',
        brand_id: String(editingProduct.brand_id || ''),
        category_id: String(editingProduct.category_id || ''),
        description: editingProduct.description || '',
        price: String(editingProduct.price || ''),
      });
      setSpecs(
        editingProduct.specs
          ? Object.entries(editingProduct.specs).map(([key, value]) => ({ key, value }))
          : [{ key: '', value: '' }]
      );
    } else {
      setForm({ name: '', model_code: '', brand_id: '', category_id: '', description: '', price: '' });
      setSpecs([{ key: '', value: '' }]);
    }
  }, [editingProduct, isOpen]);

  const handleSave = async () => {
    const specsObj = specs.filter(s => s.key.trim()).reduce((a, s) => ({ ...a, [s.key]: s.value }), {} as Record<string, string>);
    const payload = {
      ...form,
      brand_id: form.brand_id ? Number(form.brand_id) : null,
      category_id: form.category_id ? Number(form.category_id) : null,
      price: form.price ? Number(form.price) : 0,
      specs: specsObj,
    };

    if (editingProduct) {
      await update.mutateAsync({ id: editingProduct.id, data: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-admin-surface border-admin-border sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-admin-text-primary">
            {editingProduct ? 'Update Product' : 'Add New Product'}
          </DialogTitle>
          <DialogDescription className="text-sm text-admin-text-secondary">
            Fill in the details below to sync this item with your inventory.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Product Name *</Label>
            <Input 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })} 
              className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl focus:ring-zeronix-blue/10" 
              placeholder="e.g. HP ProBook 450 G10" 
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Model / Part Number</Label>
            <Input 
              value={form.model_code} 
              onChange={e => setForm({ ...form, model_code: e.target.value })} 
              className="h-11 bg-admin-bg border-admin-border text-admin-text-primary font-mono rounded-xl focus:ring-zeronix-blue/10" 
              placeholder="e.g. 9G2H5ET" 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Base Price (AED)</Label>
            <Input 
              type="number"
              value={form.price} 
              onChange={e => setForm({ ...form, price: e.target.value })} 
              className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl focus:ring-zeronix-blue/10 font-mono" 
              placeholder="0.00" 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Brand</Label>
            <Select value={form.brand_id} onValueChange={val => setForm({ ...form, brand_id: val })}>
              <SelectTrigger className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl">
                <SelectValue placeholder="Choose brand" />
              </SelectTrigger>
              <SelectContent className="bg-admin-surface border-admin-border rounded-xl shadow-xl">
                {brands.map((b: any) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Category</Label>
            <Select value={form.category_id} onValueChange={val => setForm({ ...form, category_id: val })}>
              <SelectTrigger className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl">
                <SelectValue placeholder="Choose category" />
              </SelectTrigger>
              <SelectContent className="bg-admin-surface border-admin-border rounded-xl shadow-xl">
                {categories.map((c: any) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.parent_id ? `  └ ${c.name}` : c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Technical Description</Label>
            <Textarea 
              value={form.description} 
              onChange={e => setForm({ ...form, description: e.target.value })} 
              className="bg-admin-bg border-admin-border text-admin-text-primary resize-none rounded-xl focus:ring-zeronix-blue/10" 
              placeholder="Key selling points or features..." 
              rows={3} 
            />
          </div>

          {/* Specifications Section */}
          <div className="md:col-span-2 space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold text-admin-text-primary ml-1">Technical Specifications</Label>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSpecs([...specs, { key: '', value: '' }])} className="text-zeronix-blue hover:bg-zeronix-blue/5 h-8 text-xs font-bold">
                <Plus size={14} className="mr-1" /> Add Row
              </Button>
            </div>
            
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin">
              {specs.map((spec, i) => (
                <div key={i} className="flex gap-2 items-center group/spec">
                  <Input 
                    value={spec.key} 
                    onChange={e => {
                      const newSpecs = [...specs];
                      newSpecs[i].key = e.target.value;
                      setSpecs(newSpecs);
                    }} 
                    placeholder="Label (e.g. RAM)" 
                    className="h-10 bg-admin-bg border-admin-border text-admin-text-primary text-sm flex-1 rounded-lg" 
                  />
                  <Input 
                    value={spec.value} 
                    onChange={e => {
                      const newSpecs = [...specs];
                      newSpecs[i].value = e.target.value;
                      setSpecs(newSpecs);
                    }} 
                    placeholder="Value (e.g. 16GB)" 
                    className="h-10 bg-admin-bg border-admin-border text-admin-text-primary text-sm flex-1 rounded-lg" 
                  />
                  {specs.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setSpecs(specs.filter((_, idx) => idx !== i))} 
                      className="h-10 w-10 text-admin-text-muted hover:text-danger opacity-0 group-hover/spec:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto text-admin-text-secondary rounded-xl order-2 sm:order-1">Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={!form.name || create.isPending || update.isPending} 
            className="w-full sm:w-auto bg-zeronix-blue text-white hover:bg-zeronix-blue-hover min-w-[120px] rounded-xl font-bold shadow-lg shadow-zeronix-blue/20 order-1 sm:order-2"
          >
            {(create.isPending || update.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingProduct ? 'Update Product' : 'Add Product')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
