import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/shared/Spinner';
import { useCreateSbVendor, useSbCategories, useUpdateSbVendor } from '@/hooks/useSupplierBroadcast';
import type { SbVendor } from '@/types';
import { isAxiosError } from 'axios';

const NONE = 'none';

interface VendorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: SbVendor | null;
}

const emptyForm = {
  name: '',
  company_name: '',
  phone_raw: '',
  email: '',
  address: '',
  category_id: NONE,
  notes: '',
  is_active: true,
};

export const VendorFormDialog = ({ open, onOpenChange, vendor }: VendorFormDialogProps) => {
  const [form, setForm] = useState(emptyForm);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const { data: categories = [] } = useSbCategories();
  const createVendor = useCreateSbVendor();
  const updateVendor = useUpdateSbVendor();

  useEffect(() => {
    if (!open) return;
    if (vendor) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: this persistent dialog instance resets/seeds its form each time it opens or a different vendor is passed in to edit; no mount/unmount to hook into instead.
      setForm({
        name: vendor.name,
        company_name: vendor.company_name || '',
        phone_raw: vendor.phone_raw || '',
        email: vendor.email || '',
        address: vendor.address || '',
        category_id: vendor.category_id ? String(vendor.category_id) : NONE,
        notes: vendor.notes || '',
        is_active: vendor.is_active,
      });
    } else {
      setForm(emptyForm);
    }
    setPhoneError(null);
  }, [open, vendor]);

  const handleSave = () => {
    setPhoneError(null);
    const payload = {
      name: form.name,
      company_name: form.company_name || null,
      phone_raw: form.phone_raw,
      email: form.email || null,
      address: form.address || null,
      category_id: form.category_id === NONE ? null : Number(form.category_id),
      notes: form.notes || null,
      is_active: form.is_active,
    };

    const onError = (err: unknown) => {
      // Backend returns 422 with a duplicate-phone validation error for
      // unique(company_id, phone_e164) violations — surface it inline
      // rather than only as a toast.
      type ValidationErrorBody = { message?: string; errors?: Record<string, string[]> };
      if (isAxiosError<ValidationErrorBody>(err) && err.response?.status === 422) {
        const message =
          err.response?.data?.errors?.phone_raw?.[0] ||
          err.response?.data?.errors?.phone_e164?.[0] ||
          err.response?.data?.message;
        if (message) setPhoneError(message);
      }
    };

    if (vendor) {
      updateVendor.mutate(
        { id: vendor.id, data: payload },
        { onSuccess: () => onOpenChange(false), onError }
      );
    } else {
      createVendor.mutate(payload, { onSuccess: () => onOpenChange(false), onError });
    }
  };

  const isPending = createVendor.isPending || updateVendor.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vendor ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
          <DialogDescription>Vendors are used to tag and filter broadcast products.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label className="text-[12px] font-medium text-brand-secondary">Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contact / chat name" />
            </div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label className="text-[12px] font-medium text-brand-secondary">Company Name</Label>
              <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder="Optional" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-brand-secondary">Phone *</Label>
            <Input
              value={form.phone_raw}
              onChange={(e) => { setForm({ ...form, phone_raw: e.target.value }); setPhoneError(null); }}
              placeholder="+971 -- --- ----"
            />
            <p className="text-[11px] text-brand-subtle">Will be normalized to a standard international format on save.</p>
            {phoneError && <p className="text-[11px] text-brand-danger font-medium">{phoneError}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label className="text-[12px] font-medium text-brand-secondary">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Optional" />
            </div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label className="text-[12px] font-medium text-brand-secondary">Category</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger className="h-[36px] text-[13px] rounded-lg">
                  <SelectValue placeholder="Uncategorized" />
                </SelectTrigger>
                <SelectContent className="max-h-[260px]">
                  <SelectItem value={NONE}>Uncategorized</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-brand-secondary">Address</Label>
            <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className="resize-none" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-brand-secondary">Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none" />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-brand-border/50 bg-brand-surface">
            <div>
              <Label className="text-[13px] font-medium text-brand-primary">Active</Label>
              <p className="text-[11px] text-brand-subtle mt-0.5">Inactive vendors are hidden from selection lists.</p>
            </div>
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.name || !form.phone_raw || isPending}>
            {isPending ? <Spinner size={16} className="mr-2" /> : null}
            {vendor ? 'Save Changes' : 'Add Vendor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
