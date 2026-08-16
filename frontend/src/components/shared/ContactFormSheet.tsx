import { useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { PartySearch, type PartyOption } from '@/components/shared/PartySearch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PhoneInput } from '@/components/shared/PhoneInput';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import { Spinner } from '@/components/shared/Spinner';
import { UserCircle2, Phone as PhoneIcon, StickyNote } from 'lucide-react';
import { toast } from 'sonner';
import type { CustomerContact } from '@/types';

const emptyForm = (customerId?: number) => ({
  customer_id: customerId,
  first_name: '', last_name: '', designation: '', department: '',
  email: '', phone: '', mobile: '', extension: '', notes: '', is_active: true,
});

interface ContactFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass the contact being edited, or null when adding a new one. */
  editing: CustomerContact | null;
  /**
   * When set, the contact is scoped to this company and the company picker
   * is hidden (e.g. a company profile's own Contacts tab). When omitted, the
   * company picker is shown so the contact can belong to any company (e.g.
   * the cross-company Contacts directory).
   */
  customerId?: number;
}

/**
 * Single source of truth for the Add/Edit Contact drawer, shared by the
 * cross-company Contacts directory and a company profile's own Contacts tab.
 * Both write through the same nested /admin/customers/{id}/contacts... API,
 * so centralizing the form keeps that write path consistent in one place.
 */
export const ContactFormSheet = ({ open, onOpenChange, editing, customerId }: ContactFormSheetProps) => {
  const queryClient = useQueryClient();
  const [selectedCompany, setSelectedCompany] = useState<PartyOption | null>(null);
  const [form, setForm] = useState(emptyForm(customerId));
  const showCompanyPicker = customerId === undefined;

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setSelectedCompany(editing.customer ? {
        id: editing.customer.id, name: editing.customer.name, company: editing.customer.company,
      } : null);
      setForm({
        customer_id: editing.customer_id,
        first_name: editing.first_name,
        last_name: editing.last_name || '',
        designation: editing.designation || '',
        department: editing.department || '',
        email: editing.email || '',
        phone: editing.phone || '',
        mobile: editing.mobile || '',
        extension: editing.extension || '',
        notes: editing.notes || '',
        is_active: editing.is_active ?? true,
      });
    } else {
      setSelectedCompany(null);
      setForm(emptyForm(customerId));
    }
  }, [open, editing, customerId]);

  const invalidate = (id?: number) => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    if (id) queryClient.invalidateQueries({ queryKey: ['customers', id, 'contacts'] });
  };

  const createMutation = useMutation({
    mutationFn: async () => api.post(`/admin/customers/${form.customer_id}/contacts`, form),
    onSuccess: () => { invalidate(form.customer_id); onOpenChange(false); toast.success('Contact added'); },
    onError: (e: AxiosError<{ message?: string }>) => toast.error(e.response?.data?.message || 'Failed to add contact'),
  });

  const updateMutation = useMutation({
    mutationFn: async () => api.put(`/admin/customers/${editing!.customer_id}/contacts/${editing!.id}`, form),
    onSuccess: () => { invalidate(editing?.customer_id); onOpenChange(false); toast.success('Contact updated'); },
    onError: (e: AxiosError<{ message?: string }>) => toast.error(e.response?.data?.message || 'Failed to update contact'),
  });

  const handleSave = () => (editing ? updateMutation.mutate() : createMutation.mutate());

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl bg-admin-surface border-admin-border p-0 flex flex-col gap-0">
        <div className="p-6 border-b border-admin-border flex-shrink-0">
          <SheetHeader className="space-y-1 text-left">
            <SheetTitle className="text-xl font-bold text-admin-text-primary pr-6">
              {editing ? 'Update Contact' : 'Add Contact Person'}
            </SheetTitle>
            <SheetDescription className="text-sm text-admin-text-secondary">
              {showCompanyPicker
                ? 'Select the company this contact belongs to, then fill in their details.'
                : "Fill in the contact's details below."}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-5 p-6">
          {showCompanyPicker && (
            <div className="md:col-span-2 space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Company *</Label>
              <PartySearch
                kind="customer"
                endpoint="/admin/customers"
                searchMode="server"
                value={form.customer_id}
                selected={selectedCompany || undefined}
                onSelect={(party) => { setSelectedCompany(party); setForm({ ...form, customer_id: party.id }); }}
                placeholder="Select company…"
                disabled={!!editing}
              />
            </div>
          )}

          <div className="md:col-span-2 flex items-center gap-2 pt-2">
            <UserCircle2 size={14} className="text-zeronix-blue flex-shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-admin-text-primary">Personal Details</span>
            <div className="flex-1 h-px bg-admin-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">First Name *</Label>
            <Input
              value={form.first_name}
              onChange={e => setForm({ ...form, first_name: e.target.value })}
              className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Last Name</Label>
            <Input
              value={form.last_name}
              onChange={e => setForm({ ...form, last_name: e.target.value })}
              className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Designation</Label>
            <Input
              value={form.designation}
              onChange={e => setForm({ ...form, designation: e.target.value })}
              className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl"
              placeholder="e.g. Sales Manager"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Department</Label>
            <Input
              value={form.department}
              onChange={e => setForm({ ...form, department: e.target.value })}
              className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl"
              placeholder="e.g. Procurement"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-2 pt-2">
            <PhoneIcon size={14} className="text-zeronix-blue flex-shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-admin-text-primary">Contact Information</span>
            <div className="flex-1 h-px bg-admin-border" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl"
              placeholder="name@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Phone</Label>
            <PhoneInput
              value={form.phone}
              onChange={val => setForm({ ...form, phone: val || '' })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Mobile</Label>
            <PhoneInput
              value={form.mobile}
              onChange={val => setForm({ ...form, mobile: val || '' })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Extension</Label>
            <Input
              value={form.extension}
              onChange={e => setForm({ ...form, extension: e.target.value })}
              className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl"
              placeholder="e.g. 204"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Status</Label>
            <div className="flex items-center gap-3 h-11 px-3 bg-admin-bg border border-admin-border rounded-xl">
              <Switch
                checked={form.is_active}
                onCheckedChange={checked => setForm({ ...form, is_active: checked })}
              />
              <span className="text-xs text-admin-text-primary font-bold">
                {form.is_active ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          </div>

          <div className="md:col-span-2 flex items-center gap-2 pt-2">
            <StickyNote size={14} className="text-zeronix-blue flex-shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-admin-text-primary">Additional Notes</span>
            <div className="flex-1 h-px bg-admin-border" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="bg-admin-bg border-admin-border text-admin-text-primary rounded-xl resize-none"
              placeholder="Any relevant notes about this contact…"
              rows={3}
            />
          </div>
        </div>

        <div className="p-6 pt-4 border-t border-admin-border flex-shrink-0">
          <SheetFooter className="gap-2 sm:justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.first_name || !form.customer_id || createMutation.isPending || updateMutation.isPending}
              className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover min-w-[140px] rounded-xl font-bold shadow-lg shadow-zeronix-blue/20"
            >
              {(createMutation.isPending || updateMutation.isPending) ? <Spinner size={16} /> : (editing ? 'Update Contact' : 'Add Contact')}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
};
