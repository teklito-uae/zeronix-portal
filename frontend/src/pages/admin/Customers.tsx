import { getBasePath } from '@/hooks/useBasePath';
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
import { UserPlus, Download, Upload, Search, Building2, MoreHorizontal, ArrowRight, Users, Mail, Phone, Loader2, User as UserIcon } from 'lucide-react';
import { ResourceListingPage } from '@/components/shared/ResourceListingPage';
import Avatar from 'boring-avatars';
import { ActionGroup } from '@/components/shared/ActionGroup';
import { LabelBadge } from '@/components/shared/LabelBadge';
import { LabelSelector } from '@/components/shared/LabelSelector';

import type { Customer, User, CustomerLabel } from '@/types';
import { PhoneFlag } from '@/components/shared/PhoneFlag';
import { Switch } from '@/components/ui/switch';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useThemeStore } from '@/store/useThemeStore';
import { useResourceList, useResourceList as useLabels, useResourceMutation } from '@/hooks/useApi';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

/**
 * Customers Module
 * Refactored to use the standardized State-Driven architecture.
 * Includes: Label support, Import (admin only), CSV Export (admin only)
 */
export const Customers = () => {
  const { theme } = useThemeStore();
  const avatarColors = theme === 'dark'
    ? ['#ff4d6d', '#ff758f', '#ffbe0b', '#fdfcdc', '#48cae4']
    : ['#cc063e', '#e83535', '#fd9407', '#e2d9c2', '#10898b'];

  const navigate = useNavigate();
  const { admin: currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === 'admin';

  // Dialog States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form States
  const [form, setForm] = useState({
    name: '', company: '', email: '', phone: '', address: '', trn: '', is_portal_active: true, user_ids: [] as string[],
  });
  const [formLabelIds, setFormLabelIds] = useState<number[]>([]);

  // Staff members for assignment
  const { data: staffData } = useResourceList<User>('users', { per_page: 100 });
  const staffMembers = (staffData?.data || []).filter((u: any) => u.role !== 'customer');

  // Labels for filter dropdown
  const { data: labelsData } = useLabels<CustomerLabel>('customer-labels', {});
  const allLabels: CustomerLabel[] = (labelsData as any) || [];

  // CRUD State Hooks
  const { create, update, remove } = useResourceMutation('customers');

  // Handlers
  const openAdd = () => {
    setEditingCustomer(null);
    setFormLabelIds([]);
    setForm({
      name: '', company: '', email: '', phone: '', address: '', trn: '',
      is_portal_active: true, user_ids: currentUser?.id ? [currentUser.id.toString()] : []
    });
    setDialogOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormLabelIds(customer.labels?.map(l => l.id) || []);
    setForm({
      name: customer.name,
      company: customer.company || '',
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      trn: customer.trn || '',
      is_portal_active: customer.is_portal_active ?? true,
      user_ids: customer.assigned_users?.map((u: any) => u.id.toString()) || [],
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingCustomer) {
      await update.mutateAsync({ id: editingCustomer.id, data: { ...form, label_ids: formLabelIds } });
    } else {
      await create.mutateAsync({ ...form, label_ids: formLabelIds });
    }
    setDialogOpen(false);
  };

  // CSV Export (admin only)
  const handleExportCsv = async () => {
    try {
      const res = await fetch(`${window.location.origin}/api/${getBasePath()}/customers?per_page=5000`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('zeronix_admin_token') || localStorage.getItem('zeronix_staff_token')}` },
      });
      const json = await res.json();
      const customers: Customer[] = json.data || [];
      const headers = ['Customer Code', 'Name', 'Company', 'Email', 'Phone', 'TRN', 'Labels', 'Assigned Staff', 'Portal Status', 'Created At'];
      const rows = customers.map(c => [
        c.customer_code || '',
        c.name,
        c.company || '',
        c.email,
        c.phone || '',
        c.trn || '',
        c.labels?.map(l => l.name).join(' | ') || '',
        c.assigned_users?.map((u: any) => u.name).join(' | ') || '',
        c.is_portal_active ? 'Active' : 'Inactive',
        c.created_at ? new Date(c.created_at).toLocaleDateString() : '',
      ]);
      const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch {
      toast.error('Export failed');
    }
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
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            <Avatar
              size={28}
              name={row.original.name + ' ' + row.original.email || 'User'}
              variant="marble"
              colors={avatarColors}
            />
            <div className="min-w-0">
              <p className="text-sm font-bold text-admin-text-primary truncate">{row.original.name}</p>
              {row.original.company && (
                <p className="text-[11px] text-admin-text-muted flex items-center gap-1 truncate font-medium">
                  <Building2 size={10} /> {row.original.company}
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'tags',
      header: 'Tags',
      cell: ({ row }) => {
        const labels = row.original.labels;
        if (!labels || labels.length === 0) return <span className="text-[11px] text-brand-subtle italic">—</span>;
        return (
          <div className="flex flex-wrap gap-1 max-w-[140px]">
            {labels.slice(0, 3).map(label => (
              <LabelBadge key={label.id} label={label} size="sm" />
            ))}
            {labels.length > 3 && (
              <span className="text-[9px] bg-brand-surface border border-brand-border/50 text-brand-subtle px-1.5 py-0.5 rounded font-bold">
                +{labels.length - 3}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'contact',
      header: 'Contact Info',
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="text-xs text-admin-text-primary flex items-center gap-1.5 font-medium">
            <Mail size={12} className="text-admin-text-muted" /> {row.original.email}
          </p>
          <PhoneFlag phone={row.original.phone} />
        </div>
      ),
    },
    {
      accessorKey: 'location',
      header: 'Location & TRN',
      cell: ({ row }) => (
        <div className="space-y-1.5 max-w-[180px]">
          <p className="text-xs text-brand-secondary truncate" title={row.original.address || 'No Address Provided'}>
            {row.original.address || <span className="italic text-brand-subtle">No Address Provided</span>}
          </p>
          {row.original.trn && (
            <span className="inline-flex text-[10px] font-mono text-brand-secondary border border-brand-border/50 bg-brand-surface px-1.5 rounded">
              TRN: {row.original.trn}
            </span>
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
      accessorKey: 'created_at',
      header: 'Registered',
      cell: ({ row }) => (
        <span className="text-xs text-brand-subtle font-medium">
          {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'assignedUser',
      header: 'Assigned To',
      cell: ({ row }) => {
        const users = row.original.assigned_users || [];
        if (users.length === 0) return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider bg-admin-bg text-admin-text-muted border border-admin-border">
            UNASSIGNED
          </span>
        );
        return (
          <TooltipProvider delayDuration={200}>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {users.slice(0, 3).map((u: any, i: number) => (
                  <Tooltip key={u.id}>
                    <TooltipTrigger asChild>
                      <div className="relative border-2 border-brand-white rounded-full bg-brand-surface shadow-sm transition-transform hover:z-20 hover:scale-110" style={{ zIndex: 10 - i }}>
                        <Avatar size={24} name={u.name} variant="beam" colors={avatarColors} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-brand-secondary text-brand-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-md border-none">
                      {u.name}
                    </TooltipContent>
                  </Tooltip>
                ))}
                {users.length > 3 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative z-0 h-6 w-6 rounded-full bg-brand-surface border border-brand-border/50 flex items-center justify-center text-[9px] font-bold text-brand-subtle shadow-sm transition-transform hover:scale-110 cursor-default">
                        +{users.length - 3}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-brand-secondary text-brand-white text-[11px] font-bold px-2.5 py-1.5 rounded-md shadow-md border-none max-w-[200px]">
                      {users.slice(3).map((u: any) => u.name).join(', ')}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              {users.length === 1 && (
                <span className="text-[11px] font-medium text-admin-text-secondary truncate max-w-[80px]">
                  {users[0].name.split(' ')[0]}
                </span>
              )}
            </div>
          </TooltipProvider>
        );
      },
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
          onView={() => navigate(`${getBasePath()}/customers/${row.original.id}`)}
        />
      ),
    },
  ];

  // Label filter options for ResourceListingPage
  const labelFilters = allLabels.length > 0 ? [{
    name: 'label_id',
    label: 'Label',
    placeholder: 'Filter by label',
    options: allLabels.map((l: CustomerLabel) => ({ label: l.name, value: String(l.id) })),
  }] : [];

  return (
    <div className="space-y-4">
      <ResourceListingPage<Customer>
        resource="customers"
        title="Client Directory"
        subtitle="Manage customer profiles, portal access, and trade history."
        icon={<Users size={20} />}
        columns={columns}
        onRowClick={(row) => navigate(`${getBasePath()}/customers/${row.id}`)}
        createLabel="Add Customer"
        createPath="#"
        onCreateClick={openAdd}
        searchPlaceholder="Search by name, company, email, phone..."
        filters={labelFilters}
        extraActions={
          <div className="flex gap-2">
            {isAdmin && (
              <Button
                variant="outline"
                onClick={handleExportCsv}
                className="h-10 px-4 rounded-xl border-admin-border text-admin-text-secondary hover:text-admin-text-primary text-sm font-medium"
              >
                <Download size={15} className="mr-1.5" /> Export CSV
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => navigate(`${getBasePath()}/customers/import`)}
                className="h-10 px-4 rounded-xl border-zeronix-blue/30 text-zeronix-blue hover:bg-zeronix-blue/5 text-sm font-medium"
              >
                <Upload size={15} className="mr-1.5" /> Import
              </Button>
            )}
          </div>
        }
      />

      {/* Floating Add Button (Mobile) */}
      <div className="fixed bottom-8 right-8 z-50 lg:hidden">
        <Button onClick={openAdd} className="h-14 w-14 rounded-full bg-zeronix-blue shadow-xl text-white">
          <UserIcon size={24} />
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
                rows={2}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Labels</Label>
              <LabelSelector selectedIds={formLabelIds} onChange={setFormLabelIds} />
            </div>
            {currentUser?.role === 'admin' && (
              <div className="md:col-span-2 space-y-3 mt-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Assign to Staff</Label>
                <div className="flex flex-wrap gap-2">
                  {staffMembers.map((staff: any) => {
                    const isSelected = form.user_ids.includes(staff.id.toString());
                    return (
                      <div
                        key={staff.id}
                        onClick={() => {
                          if (isSelected) setForm({ ...form, user_ids: form.user_ids.filter(id => id !== staff.id.toString()) });
                          else setForm({ ...form, user_ids: [...form.user_ids, staff.id.toString()] });
                        }}
                        className={`cursor-pointer px-3 py-1.5 rounded-xl border text-[12px] font-semibold transition-all ${isSelected
                            ? 'bg-brand-accent/10 border-brand-accent text-brand-primary shadow-sm'
                            : 'bg-brand-surface border-brand-border/50 text-brand-subtle hover:bg-brand-bg hover:border-brand-border hover:text-brand-primary'
                          }`}
                      >
                        {staff.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.name || create.isPending || update.isPending}
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
