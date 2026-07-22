import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { getBasePath } from '@/hooks/useBasePath';
import { ResourceListingPage } from '@/components/shared/ResourceListingPage';
import { ActionGroup } from '@/components/shared/ActionGroup';
import { PartySearch, type PartyOption } from '@/components/shared/PartySearch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Spinner } from '@/components/shared/Spinner';
import { Users, Star, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CustomerContact } from '@/types';

/**
 * Standalone, cross-company Contacts directory.
 * Backed by GET /admin/contacts (CustomerContactController@indexAll).
 * There is no flat /admin/contacts/{id} CRUD surface by design — every
 * create/update/delete/set-primary mutation targets the existing nested
 * /admin/customers/{customer_id}/contacts... endpoints.
 */
export const Contacts = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerContact | null>(null);
  const [deletingContact, setDeletingContact] = useState<CustomerContact | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<PartyOption | null>(null);

  const [form, setForm] = useState({
    customer_id: undefined as number | undefined,
    first_name: '', last_name: '', designation: '', department: '', email: '', phone: '', mobile: '',
  });

  // Invalidate both this page's own list and the company detail page's contacts panel.
  const invalidateAll = (customerId?: number) => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    if (customerId) {
      queryClient.invalidateQueries({ queryKey: ['customers', customerId, 'contacts'] });
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => api.post(`/admin/customers/${form.customer_id}/contacts`, form),
    onSuccess: () => { invalidateAll(form.customer_id); setDialogOpen(false); toast.success('Contact added'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to add contact'),
  });

  const updateMutation = useMutation({
    mutationFn: async () => api.put(`/admin/customers/${editing!.customer_id}/contacts/${editing!.id}`, form),
    onSuccess: () => { invalidateAll(editing?.customer_id); setDialogOpen(false); toast.success('Contact updated'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update contact'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (contact: CustomerContact) => api.delete(`/admin/customers/${contact.customer_id}/contacts/${contact.id}`),
    onSuccess: (_res, contact) => { invalidateAll(contact.customer_id); toast.success('Contact deleted'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to delete contact'),
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (contact: CustomerContact) => api.post(`/admin/customers/${contact.customer_id}/contacts/${contact.id}/set-primary`),
    onSuccess: (_res, contact) => { invalidateAll(contact.customer_id); toast.success('Primary contact updated'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update primary contact'),
  });

  const openAdd = () => {
    setEditing(null);
    setSelectedCompany(null);
    setForm({ customer_id: undefined, first_name: '', last_name: '', designation: '', department: '', email: '', phone: '', mobile: '' });
    setDialogOpen(true);
  };

  const openEdit = (contact: CustomerContact) => {
    setEditing(contact);
    setSelectedCompany(contact.customer ? {
      id: contact.customer.id,
      name: contact.customer.name,
      company: contact.customer.company,
    } : null);
    setForm({
      customer_id: contact.customer_id,
      first_name: contact.first_name,
      last_name: contact.last_name || '',
      designation: contact.designation || '',
      department: contact.department || '',
      email: contact.email || '',
      phone: contact.phone || '',
      mobile: contact.mobile || '',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  };

  const columns: ColumnDef<CustomerContact>[] = [
    {
      accessorKey: 'full_name',
      header: 'Contact',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-admin-text-primary truncate">{row.original.full_name}</p>
          {row.original.is_primary && (
            <span className="text-[10px] font-bold text-brand-accent bg-brand-accent-light px-1.5 py-0.5 rounded flex items-center gap-1 flex-shrink-0">
              <Star size={10} /> PRIMARY
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'designation',
      header: 'Designation',
      cell: ({ row }) => <span className="text-xs text-admin-text-secondary">{row.original.designation || '—'}</span>,
    },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: ({ row }) => <span className="text-xs text-admin-text-secondary">{row.original.department || '—'}</span>,
    },
    {
      id: 'company',
      header: 'Company',
      cell: ({ row }) => {
        const customer = row.original.customer;
        const label = customer?.company || customer?.name || '—';
        return (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); navigate(`${getBasePath()}/companies/${row.original.customer_id}`); }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zeronix-blue hover:underline"
          >
            <Building2 size={12} /> {label}
          </button>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => <span className="text-xs text-admin-text-secondary">{row.original.email || '—'}</span>,
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => <span className="text-xs text-admin-text-secondary">{row.original.phone || row.original.mobile || '—'}</span>,
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        row.original.is_active ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            ACTIVE
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider bg-admin-bg text-admin-text-muted border border-admin-border">
            INACTIVE
          </span>
        )
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {!row.original.is_primary && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPrimaryMutation.mutate(row.original)}
              className="h-8 px-2 text-[11px] rounded-lg"
            >
              Set Primary
            </Button>
          )}
          <ActionGroup
            onEdit={() => openEdit(row.original)}
            onDelete={() => { setDeletingContact(row.original); setDeleteOpen(true); }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <ResourceListingPage<CustomerContact>
        resource="contacts"
        title="Contacts Directory"
        subtitle="Every contact person across all companies, in one place."
        icon={<Users size={20} />}
        columns={columns}
        createLabel="Add Contact"
        createPath="#"
        onCreateClick={openAdd}
        searchPlaceholder="Search by name, email, designation, company..."
      />

      {/* Add / Edit Sheet */}
      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-admin-surface border-admin-border p-0 flex flex-col gap-0">
          <div className="p-6 border-b border-admin-border flex-shrink-0">
            <SheetHeader className="space-y-1 text-left">
              <SheetTitle className="text-xl font-bold text-admin-text-primary pr-6">
                {editing ? 'Update Contact' : 'Add Contact Person'}
              </SheetTitle>
              <SheetDescription className="text-sm text-admin-text-secondary">
                Select the company this contact belongs to, then fill in their details.
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-5 p-6">
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
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Phone</Label>
              <Input
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Mobile</Label>
              <Input
                value={form.mobile}
                onChange={e => setForm({ ...form, mobile: e.target.value })}
                className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl"
              />
            </div>
          </div>

          <div className="p-6 pt-4 border-t border-admin-border flex-shrink-0">
            <SheetFooter className="gap-2 sm:justify-end">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancel</Button>
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

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Contact?"
        description="This will permanently remove this contact person. This action is irreversible."
        confirmLabel="Yes, Delete"
        onConfirm={() => { if (deletingContact) deleteMutation.mutate(deletingContact); }}
        variant="destructive"
      />
    </div>
  );
};
