import { getBasePath } from '@/hooks/useBasePath';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { UserPlus, Download, Upload, Search, MoreHorizontal, ArrowRight, Users, User as UserIcon, AlertTriangle, Tag, UserCircle2, ShieldCheck, Briefcase } from 'lucide-react';
import { Spinner } from '@/components/shared/Spinner';
import { ResourceListingPage } from '@/components/shared/ResourceListingPage';
import { MultiSelectFilter } from '@/components/shared/MultiSelectFilter';
import Avatar from 'boring-avatars';
import { ActionGroup } from '@/components/shared/ActionGroup';
import { LabelBadge } from '@/components/shared/LabelBadge';
import { LabelSelector } from '@/components/shared/LabelSelector';
import { PhoneInput } from '@/components/shared/PhoneInput';

import type { Customer, User, CustomerLabel } from '@/types';
import { Switch } from '@/components/ui/switch';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useThemeStore } from '@/store/useThemeStore';
import { useResourceList, useResourceList as useLabels, useResourceMutation } from '@/hooks/useApi';
import { useAuthStore } from '@/store/useAuthStore';
import { useTopbarActions } from '@/hooks/useTopbarActions';
import { toast } from 'sonner';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { CurrencyAmount } from '@/components/shared/CurrencyAmount';

/**
 * Companies Module
 * Refactored to use the standardized State-Driven architecture.
 * Includes: Label support, Import (admin only), CSV Export (admin only)
 */
export const Companies = () => {
  const currency = useCurrencyStore((s) => s.currency);
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
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Form States
  const [form, setForm] = useState({
    name: '', company: '', email: '', phone: '', address: '', trn: '', industry: '', website: '', description: '', is_portal_active: true, user_ids: [] as string[],
  });
  const [formLabelIds, setFormLabelIds] = useState<number[]>([]);

  // Staff members for assignment
  const { data: staffData } = useResourceList<User>('users', { per_page: 100 });
  const staffMembers = (staffData?.data || []).filter((u: any) => u.role !== 'customer');

  // Labels for filter dropdown
  const { data: labelsData } = useLabels<CustomerLabel>('customer-labels', {});
  const allLabels: CustomerLabel[] = (labelsData as any) || [];

  // Distinct industries for the Industry filter
  const { data: industriesData } = useResourceList<string[]>('customers/industries', {});
  const industries: string[] = industriesData || [];

  // CRUD State Hooks
  const { create, update, remove } = useResourceMutation('customers');

  // Multi-select filter state
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [selectedOwnerIds, setSelectedOwnerIds] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

  const filterParams = useMemo(() => {
    const f: Record<string, string> = {};
    if (selectedLabelIds.length) f.label_id = selectedLabelIds.join(',');
    if (selectedOwnerIds.length) f.user_id = selectedOwnerIds.join(',');
    if (selectedStatuses.length) f.is_portal_active = selectedStatuses.join(',');
    if (selectedIndustries.length) f.industry = selectedIndustries.join(',');
    return f;
  }, [selectedLabelIds, selectedOwnerIds, selectedStatuses, selectedIndustries]);

  // Handlers
  const openAdd = () => {
    setEditingCustomer(null);
    setFormLabelIds([]);
    setForm({
      name: '', company: '', email: '', phone: '', address: '', trn: '', industry: '', website: '', description: '',
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
      industry: customer.industry || '',
      website: customer.website || '',
      description: customer.description || '',
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
      const res = await fetch(`${window.location.origin}/api/admin/customers?per_page=5000`, {
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
      accessorKey: 'name',
      header: 'Company',
      cell: ({ row }) => {
        const primary = row.original.company || row.original.name;
        const showContactPerson = !!row.original.company;
        return (
          <div className="flex items-center gap-3">
            <Avatar
              size={28}
              name={row.original.name + ' ' + row.original.email || 'User'}
              variant="marble"
              colors={avatarColors}
            />
            <div className="min-w-0">
              <p className="text-sm font-bold text-admin-text-primary truncate">{primary}</p>
              {showContactPerson && (
                <p className="text-[11px] text-admin-text-muted flex items-center gap-1 truncate font-medium">
                  <UserIcon size={10} /> {row.original.name}
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
      accessorKey: 'assignedUser',
      header: 'Owner',
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
      accessorKey: 'contacts_count',
      header: 'Contacts',
      cell: ({ row }) => (
        <div className="text-xs font-bold text-admin-text-secondary flex items-center gap-1">
          <Users size={11} className="text-admin-text-muted" />
          {row.original.contacts_count || 0} <span className="text-[10px] text-admin-text-muted font-medium ml-0.5">Contacts</span>
        </div>
      ),
    },
    {
      accessorKey: 'deals_count',
      header: 'Deals',
      cell: ({ row }) => (
        <div className="text-xs font-bold text-admin-text-secondary">
          {row.original.deals_count || 0} <span className="text-[10px] text-admin-text-muted font-medium ml-0.5">Deals</span>
        </div>
      ),
    },
    {
      accessorKey: 'total_invoiced',
      header: 'Revenue',
      cell: ({ row }) => {
        const revenue = row.original.total_invoiced || 0;
        if (revenue <= 0) return <span className="text-[11px] text-brand-subtle italic">—</span>;
        return (
          <p className="font-mono text-[13px] font-semibold text-admin-text-primary">
            <CurrencyAmount amount={revenue} currency={currency} />
          </p>
        );
      },
    },
    {
      accessorKey: 'outstanding_balance',
      header: 'Balance Due',
      cell: ({ row }) => {
        const balance = row.original.outstanding_balance || 0;
        const overdueCount = row.original.overdue_invoices_count || 0;
        if (balance <= 0) return <span className="text-[11px] text-brand-subtle italic">Settled</span>;
        return (
          <div className="space-y-1">
            <p className="font-mono text-[13px] font-semibold text-admin-text-primary">
              <CurrencyAmount amount={balance} currency={currency} />
            </p>
            {overdueCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-brand-danger-bg text-brand-danger px-1.5 py-0.5 rounded">
                <AlertTriangle size={9} /> {overdueCount} Overdue
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'is_portal_active',
      header: 'Status',
      cell: ({ row }) => (
        <div className="flex items-center">
          {row.original.is_portal_active ? (
            <Badge variant="success">ACTIVE</Badge>
          ) : (
            <Badge variant="secondary">OFFLINE</Badge>
          )}
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
          onView={() => navigate(`${getBasePath()}/companies/${row.original.id}`)}
        />
      ),
    },
  ];

  // Page actions render in the shared Topbar (top-right), not in a page-local header.
  useTopbarActions(
    <>
      {isAdmin && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCsv}
          className="text-admin-text-secondary hover:text-admin-text-primary"
        >
          <Download size={14} /> Export CSV
        </Button>
      )}
      {isAdmin && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`${getBasePath()}/companies/import`)}
          className="text-zeronix-blue border-zeronix-blue/30 hover:bg-zeronix-blue/5"
        >
          <Upload size={14} /> Import
        </Button>
      )}
      <Button size="sm" onClick={openAdd} className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover">
        <UserPlus size={14} /> Add Company
      </Button>
    </>
  );

  // Faceted filter toolbar (Tags, Owner, Status, Industry) rendered via ResourceListingPage's customFilters slot
  const customFilters = (
    <div className="flex flex-wrap items-center gap-2">
      <MultiSelectFilter
        title="Tags"
        icon={<Tag />}
        options={allLabels.map((l: CustomerLabel) => ({ label: l.name, value: String(l.id) }))}
        selected={selectedLabelIds}
        onChange={setSelectedLabelIds}
      />
      <MultiSelectFilter
        title="Owner"
        icon={<UserCircle2 />}
        options={staffMembers.map((s: any) => ({ label: s.name, value: String(s.id) }))}
        selected={selectedOwnerIds}
        onChange={setSelectedOwnerIds}
      />
      <MultiSelectFilter
        title="Status"
        icon={<ShieldCheck />}
        options={[{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }]}
        selected={selectedStatuses}
        onChange={setSelectedStatuses}
      />
      <MultiSelectFilter
        title="Industry"
        icon={<Briefcase />}
        options={industries.map((i: string) => ({ label: i, value: i }))}
        selected={selectedIndustries}
        onChange={setSelectedIndustries}
      />
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <ResourceListingPage<Customer>
        resource="customers"
        title="Company Directory"
        subtitle="Manage company profiles, portal access, and trade history."
        icon={<Users size={20} />}
        columns={columns}
        onRowClick={(row) => navigate(`${getBasePath()}/companies/${row.id}`)}
        searchPlaceholder="Search by name, company, email, phone..."
        filters={[]}
        customFilters={customFilters}
        baseFilters={filterParams}
        enableRowSelection
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
      />

      {/* Floating Add Button (Mobile) */}
      <div className="fixed bottom-8 right-8 z-50 lg:hidden">
        <Button onClick={openAdd} className="h-14 w-14 rounded-full bg-zeronix-blue shadow-xl text-white">
          <UserIcon size={24} />
        </Button>
      </div>

      {/* Add / Edit Sheet */}
      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-admin-surface border-admin-border p-0 flex flex-col gap-0">
          <div className="p-6 border-b border-admin-border flex-shrink-0">
            <SheetHeader className="space-y-1 text-left">
              <SheetTitle className="text-xl font-bold text-admin-text-primary pr-6">
                {editingCustomer ? 'Update Company Profile' : 'Register New Company'}
              </SheetTitle>
              <SheetDescription className="text-sm text-admin-text-secondary">
                Configure contact information and portal access settings.
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-5 p-6">
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
              <PhoneInput
                value={form.phone}
                onChange={val => setForm({ ...form, phone: val || '' })}
                placeholder="+971 50 123 4567"
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
              <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Industry</Label>
              <Input
                value={form.industry}
                onChange={e => setForm({ ...form, industry: e.target.value })}
                className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl"
                placeholder="e.g. Manufacturing"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Website</Label>
              <Input
                value={form.website}
                onChange={e => setForm({ ...form, website: e.target.value })}
                className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl"
                placeholder="https://example.com"
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
              <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Description</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="bg-admin-bg border-admin-border text-admin-text-primary rounded-xl resize-none"
                placeholder="Brief notes about this company..."
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

          <div className="p-6 pt-4 border-t border-admin-border flex-shrink-0">
            <SheetFooter className="gap-2 sm:justify-end">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancel</Button>
              <Button
                onClick={handleSave}
                disabled={!form.name || create.isPending || update.isPending}
                className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover min-w-[140px] rounded-xl font-bold shadow-lg shadow-zeronix-blue/20"
              >
                {(create.isPending || update.isPending) ? <Spinner size={16} /> : (editingCustomer ? 'Update Profile' : 'Register Company')}
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Company Profile?"
        description="This will permanently delete the company and all associated trade data. This action is irreversible."
        confirmLabel="Yes, Delete Permanently"
        onConfirm={() => deletingId && remove.mutate(deletingId)}
        variant="destructive"
      />
    </div>
  );
};
