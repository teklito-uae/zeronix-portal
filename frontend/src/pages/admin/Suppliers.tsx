import { getBasePath } from '@/hooks/useBasePath';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { Supplier } from '@/types';
import { Building2, Mail, Phone, Globe, Loader2, UserPlus } from 'lucide-react';
import { ResourceListingPage } from '@/components/shared/ResourceListingPage';
import { useResourceMutation } from '@/hooks/useApi';
import { ActionGroup } from '@/components/shared/ActionGroup';

/**
 * Suppliers Module
 * Refactored to use the standardized State-Driven architecture.
 */
export const Suppliers = () => {
  const navigate = useNavigate();

  // Dialog States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    website: '',
    address: '',
  });

  // CRUD State Hooks
  const { create, update } = useResourceMutation('suppliers');

  // Handlers
  const openAdd = () => {
    setEditingSupplier(null);
    setForm({ name: '', contact_person: '', email: '', phone: '', website: '', address: '' });
    setDialogOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      email: supplier.email,
      phone: supplier.phone || '',
      website: supplier.website || '',
      address: supplier.address || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingSupplier) {
      await update.mutateAsync({ id: editingSupplier.id, data: form });
    } else {
      await create.mutateAsync(form);
    }
    setDialogOpen(false);
  };

  const columns: ColumnDef<Supplier>[] = [
    {
      accessorKey: 'name',
      header: 'Supplier Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-zeronix-blue/5 border border-zeronix-blue/10 flex items-center justify-center text-zeronix-blue">
            <Building2 size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-admin-text-primary truncate">{row.original.name}</p>
            {row.original.website && (
              <p className="text-[10px] text-admin-text-muted flex items-center gap-1 font-medium uppercase tracking-wide mt-0.5">
                <Globe size={10} /> {row.original.website.replace(/^https?:\/\//, '')}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'contact_person',
      header: 'Contact Person',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-admin-text-primary">{row.original.contact_person || '—'}</span>
          <span className="text-[10px] text-admin-text-muted font-medium italic">Primary Representative</span>
        </div>
      ),
    },
    {
      accessorKey: 'contact_details',
      header: 'Connectivity',
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="text-xs font-bold text-admin-text-secondary flex items-center gap-2">
            <Mail size={12} className="opacity-40" /> {row.original.email}
          </p>
          {row.original.phone && (
            <p className="text-[11px] font-medium text-admin-text-muted flex items-center gap-2">
              <Phone size={12} className="opacity-40" /> {row.original.phone}
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'stats',
      header: 'Supply Chain',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-zeronix-blue/5 text-zeronix-blue border-0 text-[10px] font-semibold px-2 h-5">
            {row.original.brands_count || 0} BRANDS
          </Badge>
          <Badge variant="secondary" className="bg-admin-bg text-admin-text-secondary border border-admin-border text-[10px] font-semibold px-2 h-5">
            {row.original.products_count || 0} SKUS
          </Badge>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <ActionGroup
          onEdit={() => openEdit(row.original)}
          onView={() => navigate(`${getBasePath()}/suppliers/${row.original.id}`)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <ResourceListingPage<Supplier>
        resource="suppliers"
        title="Supplier Network"
        icon={<Building2 size={20} />}
        columns={columns}
        onRowClick={(row) => navigate(`${getBasePath()}/suppliers/${row.id}`)}
        createLabel="Add Partner"
        createPath="#"
        onCreateClick={openAdd}
        searchPlaceholder="Search by company name, contact, or email..."
      />

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-admin-surface border-admin-border sm:max-w-xl rounded-3xl shadow-2xl p-0 overflow-hidden">
          <div className="bg-admin-bg/30 p-6 border-b border-admin-border">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-admin-text-primary flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-zeronix-blue/10 flex items-center justify-center text-zeronix-blue">
                  {editingSupplier ? <Building2 size={24} /> : <UserPlus size={24} />}
                </div>
                {editingSupplier ? 'Update Supplier Profile' : 'Onboard New Supplier'}
              </DialogTitle>
              <DialogDescription className="text-xs font-bold text-admin-text-muted uppercase tracking-wider mt-1 ml-1">
                Maintain accurate procurement and contact data.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-admin-text-muted ml-1">Company Legal Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl font-bold"
                  placeholder="e.g. Teklito Distribution"
                />
              </div>
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-admin-text-muted ml-1">Primary Representative</Label>
                <Input
                  value={form.contact_person}
                  onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                  className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl"
                  placeholder="Contact person name"
                />
              </div>

              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-admin-text-muted ml-1">Corporate Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl"
                  placeholder="procurement@supplier.com"
                />
              </div>
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-admin-text-muted ml-1">Contact Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl"
                  placeholder="+971 -- --- ----"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-admin-text-muted ml-1">Official Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted h-4 w-4" />
                <Input
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="h-11 pl-10 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl"
                  placeholder="https://www.supplier-domain.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-admin-text-muted ml-1">Warehouse / Office Address</Label>
              <Textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="bg-admin-bg border-admin-border text-admin-text-primary rounded-2xl resize-none min-h-[80px]"
                placeholder="Full operational address..."
                rows={3}
              />
            </div>
          </div>

          <div className="p-6 pt-0">
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl font-bold">
                CANCEL
              </Button>
              <Button
                onClick={handleSave}
                disabled={!form.name || !form.email || create.isPending || update.isPending}
                className="flex-1 bg-zeronix-blue text-white hover:bg-zeronix-blue-hover h-12 rounded-xl font-bold shadow-lg shadow-zeronix-blue/20 transition-all active:scale-95"
              >
                {(create.isPending || update.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingSupplier ? 'UPDATE PROFILE' : 'REGISTER PARTNER')}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
