import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useResourceMutation } from '@/hooks/useApi';
import { ResourceListingPage } from '@/components/shared/ResourceListingPage';
import { ActionGroup } from '@/components/shared/ActionGroup';

import type { Customer } from '@/types';
import { Users, Mail, Phone, Building2, Loader2, User } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

/**
 * Customers Module
 * Refactored to use the standardized State-Driven architecture.
 */
export const Customers = () => {
  const navigate = useNavigate();

  // Dialog States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form States
  const [form, setForm] = useState({ 
    name: '', company: '', email: '', phone: '', address: '', trn: '', is_portal_active: true 
  });

  // CRUD State Hooks
  const { create, update, remove } = useResourceMutation('customers');

  // Handlers
  const openAdd = () => {
    setEditingCustomer(null);
    setForm({ name: '', company: '', email: '', phone: '', address: '', trn: '', is_portal_active: true });
    setDialogOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name,
      company: customer.company || '',
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      trn: customer.trn || '',
      is_portal_active: customer.is_portal_active ?? true,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingCustomer) {
      await update.mutateAsync({ id: editingCustomer.id, data: form });
    } else {
      await create.mutateAsync(form);
    }
    setDialogOpen(false);
  };

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: 'customer_code',
      header: 'ID',
      cell: ({ row }) => (
        <span className="font-mono text-[11px] font-bold text-zeronix-blue bg-zeronix-blue/5 px-2 py-0.5 rounded border border-zeronix-blue/10">
          {row.original.customer_code || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Customer Details',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-admin-bg border border-admin-border flex items-center justify-center text-admin-text-secondary text-xs font-bold">
            {row.original.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-admin-text-primary truncate">{row.original.name}</p>
            {row.original.company && (
              <p className="text-[11px] text-admin-text-muted flex items-center gap-1 truncate font-medium">
                <Building2 size={10} /> {row.original.company}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'contact',
      header: 'Contact Info',
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="text-xs text-admin-text-primary flex items-center gap-1.5 font-medium">
            <Mail size={12} className="text-admin-text-muted" /> {row.original.email}
          </p>
          {row.original.phone && (
            <p className="text-[11px] text-admin-text-muted flex items-center gap-1.5">
              <Phone size={12} className="text-admin-text-muted" /> {row.original.phone}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'is_portal_active',
      header: 'Portal Access',
      cell: ({ row }) => (
        <div className="flex items-center">
          {row.original.is_portal_active ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              ACTIVE
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider bg-admin-bg text-admin-text-muted border border-admin-border">
              OFFLINE
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'quotes_count',
      header: 'Activity',
      cell: ({ row }) => (
        <div className="text-xs font-bold text-admin-text-secondary">
          {row.original.quotes_count || 0} <span className="text-[10px] text-admin-text-muted font-medium ml-0.5">Quotes</span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <ActionGroup
          onEdit={() => openEdit(row.original)}
          onDelete={() => { setDeletingId(row.original.id); setDeleteOpen(true); }}
          onView={() => navigate(`/admin/customers/${row.original.id}`)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <ResourceListingPage<Customer>
        resource="customers"
        title="Client Directory"
        subtitle="Manage customer profiles, portal access, and trade history."
        icon={<Users size={20} />}
        columns={columns}
        onRowClick={(row) => navigate(`/admin/customers/${row.id}`)}
        createLabel="Add Customer"
        createPath="#" // Using modal instead
        searchPlaceholder="Search by name, company, email, phone..."
      />

      {/* Manual Button for Add (Floating on Mobile) */}
      <div className="fixed bottom-8 right-8 z-50 lg:hidden">
        <Button onClick={openAdd} className="h-14 w-14 rounded-full bg-zeronix-blue shadow-xl text-white">
          <User size={24} />
        </Button>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-admin-surface border-admin-border sm:max-w-xl rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-admin-text-primary">
              {editingCustomer ? 'Update Client Profile' : 'Register New Client'}
            </DialogTitle>
            <DialogDescription className="text-sm text-admin-text-secondary">
              Configure contact information and portal access settings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Full Name *</Label>
              <Input 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl" 
                placeholder="Primary contact name" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Company Name</Label>
              <Input 
                value={form.company} 
                onChange={e => setForm({ ...form, company: e.target.value })} 
                className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl" 
                placeholder="Legal business name" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Email Address *</Label>
              <Input 
                type="email" 
                value={form.email} 
                onChange={e => setForm({ ...form, email: e.target.value })} 
                className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl" 
                placeholder="client@example.com" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Phone Number</Label>
              <Input 
                value={form.phone} 
                onChange={e => setForm({ ...form, phone: e.target.value })} 
                className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl" 
                placeholder="+971 -- --- ----" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">TRN / VAT Number</Label>
              <Input 
                value={form.trn} 
                onChange={e => setForm({ ...form, trn: e.target.value })} 
                className="h-11 bg-admin-bg border-admin-border text-admin-text-primary font-mono rounded-xl" 
                placeholder="100XXXXXXXXX" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Portal Status</Label>
              <div className="flex items-center gap-3 h-11 px-3 bg-admin-bg border border-admin-border rounded-xl">
                <Switch 
                  checked={form.is_portal_active} 
                  onCheckedChange={checked => setForm({ ...form, is_portal_active: checked })} 
                />
                <span className="text-xs text-admin-text-primary font-bold">
                  {form.is_portal_active ? 'PORTAL ENABLED' : 'PORTAL DISABLED'}
                </span>
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Billing Address</Label>
              <Textarea 
                value={form.address} 
                onChange={e => setForm({ ...form, address: e.target.value })} 
                className="bg-admin-bg border-admin-border text-admin-text-primary rounded-xl resize-none" 
                placeholder="Unit, Building, Street, City..." 
                rows={3} 
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button 
              onClick={handleSave} 
              disabled={!form.name || !form.email || create.isPending || update.isPending} 
              className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover min-w-[140px] rounded-xl font-bold shadow-lg shadow-zeronix-blue/20"
            >
              {(create.isPending || update.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingCustomer ? 'Update Profile' : 'Register Client')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog 
        open={deleteOpen} 
        onOpenChange={setDeleteOpen} 
        title="Delete Customer Profile?" 
        description="This will permanently delete the customer and all associated trade data. This action is irreversible." 
        confirmLabel="Yes, Delete Permanently" 
        onConfirm={() => deletingId && remove.mutate(deletingId)} 
        variant="destructive" 
      />
    </div>
  );
};
