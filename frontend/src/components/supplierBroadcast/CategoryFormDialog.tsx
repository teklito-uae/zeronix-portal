import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared/Spinner';
import { useCreateSbCategory, useUpdateSbCategory } from '@/hooks/useSupplierBroadcast';
import type { SbCategory } from '@/types';

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: SbCategory | null;
}

const emptyForm = { name: '', description: '', sort_order: '0' };

export const CategoryFormDialog = ({ open, onOpenChange, category }: CategoryFormDialogProps) => {
  const [form, setForm] = useState(emptyForm);

  const createCategory = useCreateSbCategory();
  const updateCategory = useUpdateSbCategory();

  useEffect(() => {
    if (!open) return;
    if (category) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: this persistent dialog instance resets/seeds its form each time it opens or a different category is passed in to edit; no mount/unmount to hook into instead.
      setForm({
        name: category.name,
        description: category.description || '',
        sort_order: String(category.sort_order ?? 0),
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, category]);

  const handleSave = () => {
    const payload = {
      name: form.name,
      description: form.description || null,
      sort_order: Number(form.sort_order) || 0,
    };

    if (category) {
      updateCategory.mutate({ id: category.id, data: payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      createCategory.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isPending = createCategory.isPending || updateCategory.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? 'Edit Category' : 'Add Category'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-brand-secondary">Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Laptops" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-brand-secondary">Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="resize-none" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-brand-secondary">Sort Order</Label>
            <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.name || isPending}>
            {isPending ? <Spinner size={16} className="mr-2" /> : null}
            {category ? 'Save Changes' : 'Add Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
