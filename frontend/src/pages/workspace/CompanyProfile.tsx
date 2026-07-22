import { getBasePath } from '@/hooks/useBasePath';
import { useParams, useNavigate } from 'react-router-dom';
import { useBreadcrumb } from '@/hooks/useBreadcrumb';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo, type ReactNode } from 'react';
import api from '@/lib/axios';
import { PageTabs, type PageTab } from '@/components/shared/PageTabs';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/shared/StatCard';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LabelBadge } from '@/components/shared/LabelBadge';
import { LabelSelector } from '@/components/shared/LabelSelector';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { PageLoader } from '@/components/shared/PageLoader';
import { useResourceMutation } from '@/hooks/useApi';
import Avatar from 'boring-avatars';
import { useThemeStore } from '@/store/useThemeStore';
import { format, isToday, isYesterday } from 'date-fns';

import type { ColumnDef } from '@tanstack/react-table';
import type { Quote, Invoice, CustomerContact, Deal, CustomerLabel, ActivityLogEntry } from '@/types';
import {
  Mail, Phone, Building2, Calendar, FileText, MessageSquare, Receipt, MapPin, ShieldCheck, Wallet,
  ArrowUpRight, Edit, User as UserIcon, Users, Plus, Star, Trash2, Pencil, Briefcase, Globe, Handshake,
  Activity as ActivityIcon, AlertTriangle, Clock, type LucideIcon,
} from 'lucide-react';
import { Spinner } from '@/components/shared/Spinner';

const CustomerContactsPanel = ({ customerId }: { customerId: number }) => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerContact | null>(null);
  const [form, setForm] = useState({
    first_name: '', last_name: '', designation: '', department: '', email: '', phone: '', mobile: '', is_active: true,
  });

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['customers', customerId, 'contacts'],
    queryFn: async () => (await api.get(`/admin/customers/${customerId}/contacts`)).data as CustomerContact[],
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['customers', customerId, 'contacts'] });

  const createMutation = useMutation({
    mutationFn: async () => api.post(`/admin/customers/${customerId}/contacts`, form),
    onSuccess: () => { invalidate(); setDialogOpen(false); toast.success('Contact added'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to add contact'),
  });

  const updateMutation = useMutation({
    mutationFn: async () => api.put(`/admin/customers/${customerId}/contacts/${editing!.id}`, form),
    onSuccess: () => { invalidate(); setDialogOpen(false); toast.success('Contact updated'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update contact'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (contactId: number) => api.delete(`/admin/customers/${customerId}/contacts/${contactId}`),
    onSuccess: () => { invalidate(); toast.success('Contact deleted'); },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (contactId: number) => api.post(`/admin/customers/${customerId}/contacts/${contactId}/set-primary`),
    onSuccess: () => { invalidate(); toast.success('Primary contact updated'); },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (contact: CustomerContact) => api.put(`/admin/customers/${customerId}/contacts/${contact.id}`, { is_active: !contact.is_active }),
    onSuccess: () => invalidate(),
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ first_name: '', last_name: '', designation: '', department: '', email: '', phone: '', mobile: '', is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (c: CustomerContact) => {
    setEditing(c);
    setForm({
      first_name: c.first_name, last_name: c.last_name || '', designation: c.designation || '',
      department: c.department || '', email: c.email || '', phone: c.phone || '', mobile: c.mobile || '', is_active: c.is_active,
    });
    setDialogOpen(true);
  };

  return (
    <div className="bg-brand-white border border-brand-border/50 rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-brand-border/50 bg-brand-surface flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-brand-primary">
          <Users size={16} className="text-brand-accent" /> Contact Persons
        </div>
        <Button size="sm" onClick={openAdd} className="h-8 text-[12px] rounded-lg">
          <Plus size={14} className="mr-1" /> Add Contact
        </Button>
      </div>
      <div className="divide-y divide-brand-border/50">
        {isLoading ? (
          <div className="p-6"><Spinner size={20} /></div>
        ) : contacts.length === 0 ? (
          <p className="p-6 text-[13px] text-brand-subtle">No contact persons yet.</p>
        ) : contacts.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-5 py-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-semibold text-brand-primary">{c.full_name}</p>
                {c.is_primary && (
                  <span className="text-[10px] font-bold text-brand-accent bg-brand-accent-light px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Star size={10} /> PRIMARY
                  </span>
                )}
                {!c.is_active && (
                  <span className="text-[10px] font-bold text-brand-subtle bg-brand-surface px-1.5 py-0.5 rounded">INACTIVE</span>
                )}
              </div>
              <p className="text-[12px] text-brand-subtle mt-0.5">
                {c.designation || 'No designation'}{c.email ? ` · ${c.email}` : ''}{c.phone ? ` · ${c.phone}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {!c.is_primary && (
                <Button variant="outline" size="sm" onClick={() => setPrimaryMutation.mutate(c.id)} className="h-8 px-2 text-[11px] rounded-lg">
                  Set Primary
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => toggleActiveMutation.mutate(c)} className="h-8 px-2 text-[11px] rounded-lg">
                {c.is_active ? 'Deactivate' : 'Activate'}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => openEdit(c)} className="h-8 w-8 rounded-lg">
                <Pencil size={14} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(c.id)} className="h-8 w-8 rounded-lg text-brand-danger">
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-brand-white border-brand-border/50 p-0 flex flex-col gap-0">
          <div className="p-6 border-b border-brand-border/50 flex-shrink-0">
            <SheetHeader className="space-y-0 text-left">
              <SheetTitle className="text-[16px] font-semibold text-brand-primary pr-6">{editing ? 'Update Contact' : 'Add Contact Person'}</SheetTitle>
            </SheetHeader>
          </div>
          <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-4 p-6">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">First Name *</Label>
              <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="h-[36px] text-[13px] rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Last Name</Label>
              <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="h-[36px] text-[13px] rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Designation</Label>
              <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className="h-[36px] text-[13px] rounded-lg" placeholder="e.g. Sales Manager" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Department</Label>
              <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="h-[36px] text-[13px] rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-[36px] text-[13px] rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-[36px] text-[13px] rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Mobile</Label>
              <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className="h-[36px] text-[13px] rounded-lg" />
            </div>
          </div>
          <div className="p-6 pt-4 border-t border-brand-border/50 flex-shrink-0">
            <SheetFooter className="sm:justify-end">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-[13px] font-medium">Cancel</Button>
              <Button
                onClick={() => editing ? updateMutation.mutate() : createMutation.mutate()}
                disabled={!form.first_name || createMutation.isPending || updateMutation.isPending}
                className="bg-brand-primary text-brand-white hover:opacity-90 rounded-lg text-[13px] font-medium px-6"
              >
                {(createMutation.isPending || updateMutation.isPending) ? <Spinner className="mr-2" size={14} /> : null}
                {editing ? 'Update' : 'Add Contact'}
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

// Maps an ActivityLog entry to a display icon/color and a short title, derived from
// its subject_type (e.g. App\Models\Quote) and action (e.g. created_quote).
const activityMeta = (subjectType: string | undefined, action: string): { Icon: LucideIcon; color: string; bg: string; title: string } => {
  const base = subjectType?.split('\\').pop() || '';
  const verb = action.split('_')[0];
  const verbLabel = verb === 'created' ? 'Created' : verb === 'updated' ? 'Updated' : verb === 'deleted' ? 'Deleted' : 'Updated';
  const spaced = base.replace(/([a-z])([A-Z])/g, '$1 $2');
  const title = spaced ? `${spaced} ${verbLabel}` : verbLabel;

  const palette: Record<string, { Icon: LucideIcon; color: string; bg: string }> = {
    Quote: { Icon: FileText, color: 'text-brand-warning', bg: 'bg-brand-warning-bg' },
    Invoice: { Icon: Receipt, color: 'text-brand-success', bg: 'bg-brand-success-bg' },
    Deal: { Icon: Handshake, color: 'text-brand-accent', bg: 'bg-brand-accent-light dark:bg-brand-accent/20' },
    Enquiry: { Icon: MessageSquare, color: 'text-brand-info', bg: 'bg-brand-info-bg' },
    CustomerContact: { Icon: Users, color: 'text-brand-accent', bg: 'bg-brand-accent-light dark:bg-brand-accent/20' },
    Customer: { Icon: Building2, color: 'text-brand-primary', bg: 'bg-brand-surface' },
  };

  if (verb === 'deleted') {
    return { Icon: Trash2, color: 'text-brand-danger', bg: 'bg-brand-danger-bg', title };
  }

  return { ...(palette[base] || { Icon: FileText, color: 'text-brand-subtle', bg: 'bg-brand-surface' }), title };
};

const ActivityFeedPanel = ({ customerId }: { customerId: number }) => {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['customers', customerId, 'activities'],
    queryFn: async () => (await api.get(`/admin/customers/${customerId}/activities`)).data as ActivityLogEntry[],
    enabled: !!customerId,
  });

  const groups = useMemo(() => {
    const map = new Map<string, ActivityLogEntry[]>();
    activities.forEach((a) => {
      if (!a.created_at) return;
      const d = new Date(a.created_at);
      const key = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMM d, yyyy');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    });
    return Array.from(map.entries());
  }, [activities]);

  return (
    <>
      <div className="px-5 py-4 border-b border-brand-border/50 flex items-center gap-2 text-[14px] font-semibold text-brand-primary flex-shrink-0">
        <ActivityIcon size={16} className="text-brand-accent" /> Activity
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-6 flex justify-center"><Spinner size={20} /></div>
        ) : activities.length === 0 ? (
          <div className="p-6 text-center">
            <Clock size={22} className="mx-auto text-brand-subtle mb-2" />
            <p className="text-[12px] text-brand-subtle">No activity recorded yet.</p>
          </div>
        ) : groups.map(([label, items]) => (
          <div key={label}>
            <div className="px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-brand-subtle bg-brand-surface/60">{label}</div>
            <div className="divide-y divide-brand-border/40">
              {items.map((a) => {
                const meta = activityMeta(a.subject_type, a.action);
                const Icon = meta.Icon;
                return (
                  <div key={a.id} className="flex gap-3 px-5 py-3">
                    <div className={`h-8 w-8 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={14} className={meta.color} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[12px] font-semibold text-brand-primary">{meta.title}</p>
                        {a.created_at && <span className="text-[10px] text-brand-subtle flex-shrink-0">{format(new Date(a.created_at), 'h:mm a')}</span>}
                      </div>
                      <p className="text-[11px] text-brand-secondary mt-0.5 leading-snug">{a.description}</p>
                      {a.user?.name && <p className="text-[10px] text-brand-subtle mt-1">by {a.user.name}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export const CompanyProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme } = useThemeStore();
  const avatarColors = theme === 'dark'
    ? ['#ff4d6d', '#ff758f', '#ffbe0b', '#fdfcdc', '#48cae4']
    : ['#cc063e', '#e83535', '#fd9407', '#e2d9c2', '#10898b'];


  const [activeTab, setActiveTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', company: '', email: '', phone: '', address: '', trn: '', industry: '', website: '', description: '', is_portal_active: true
  });
  const [formLabelIds, setFormLabelIds] = useState<number[]>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => (await api.get(`/admin/customers/${id}`)).data,
    enabled: !!id,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['customers', Number(id), 'contacts'],
    queryFn: async () => (await api.get(`/admin/customers/${id}/contacts`)).data as CustomerContact[],
    enabled: !!id,
  });

  useEffect(() => {
    if (data?.customer) {
      const c = data.customer;
      setForm({
        name: c.name,
        company: c.company || '',
        email: c.email,
        phone: c.phone || '',
        address: c.address || '',
        trn: c.trn || '',
        industry: c.industry || '',
        website: c.website || '',
        description: c.description || '',
        is_portal_active: c.is_portal_active ?? true
      });
      setFormLabelIds(c.labels?.map((l: CustomerLabel) => l.id) || []);
    }
  }, [data]);

  useBreadcrumb([
    { label: 'Company Registry', href: `${getBasePath()}/companies` },
    { label: data?.customer?.name || 'Identity Profile' },
  ]);

  const { update } = useResourceMutation('customers');

  const handleUpdate = async () => {
    await update.mutateAsync({ id: Number(id), data: { ...form, label_ids: formLabelIds } });
    queryClient.invalidateQueries({ queryKey: ['customer', id] });
    setEditOpen(false);
    toast.success('Profile updated successfully');
  };

  const registerPortalMutation = useMutation({
    mutationFn: async () => api.post(`/admin/customers/${id}/register-portal`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      toast.success('Client registered for portal access.');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Access registration failure.'),
  });

  if (isLoading) {
    return <PageLoader label="Analyzing Relationship Data..." iconSize={32} className="h-96 gap-3" />;
  }

  if (error || !data) return null;

  const { customer, quotes, invoices, deals } = data;

  const quoteColumns: ColumnDef<Quote>[] = [
    {
      accessorKey: 'quote_number',
      header: 'Instrument #',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-zeronix-blue font-bold uppercase">
          {row.original.quote_number || `QT-${String(row.original.id).padStart(4, '0')}`}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Execution',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'total',
      header: 'Valuation',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-bold text-admin-text-primary">
          {(row.original.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] opacity-40 uppercase">AED</span>
        </span>
      ),
    },
  ];

  const dealColumns: ColumnDef<Deal>[] = [
    {
      accessorKey: 'deal_code',
      header: 'Deal',
      cell: ({ row }) => (
        <div>
          <p className="font-mono text-xs text-zeronix-blue font-bold uppercase">
            {row.original.deal_code || `DEAL-${String(row.original.id).padStart(4, '0')}`}
          </p>
          <p className="text-[12px] text-brand-secondary truncate max-w-[220px]">{row.original.title}</p>
        </div>
      ),
    },
    {
      accessorKey: 'stage',
      header: 'Stage',
      cell: ({ row }) => <StatusBadge status={row.original.stage} />,
    },
    {
      accessorKey: 'value',
      header: 'Value',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-bold text-admin-text-primary">
          {(row.original.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] opacity-40 uppercase">AED</span>
        </span>
      ),
    },
    {
      accessorKey: 'expected_close_date',
      header: 'Expected Close',
      cell: ({ row }) => (
        <span className="text-[12px] text-brand-secondary">
          {row.original.expected_close_date ? new Date(row.original.expected_close_date).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      id: 'owner',
      header: 'Owner',
      cell: ({ row }) => row.original.user ? (
        <div className="flex items-center gap-2">
          <Avatar size={22} name={row.original.user.name} variant="beam" colors={avatarColors} />
          <span className="text-[12px] font-medium text-brand-secondary">{row.original.user.name}</span>
        </div>
      ) : <span className="text-[12px] text-brand-subtle">Unassigned</span>,
    },
  ];

  const invoiceColumns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'invoice_number',
      header: 'Ledger #',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-zeronix-blue font-bold uppercase">
          {row.original.invoice_number || `INV-${String(row.original.id).padStart(4, '0')}`}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Settlement',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'total',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-bold text-admin-text-primary">
          {(row.original.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] opacity-40 uppercase">AED</span>
        </span>
      ),
    },
  ];

  const profileTabs: PageTab[] = [
    { id: 'overview', label: 'Overview', icon: <UserIcon size={16} /> },
    { id: 'contacts', label: 'Contacts', icon: <Users size={16} />, count: customer.contacts_count },
    { id: 'deals', label: 'Deals', icon: <Handshake size={16} />, count: customer.deals_count },
    { id: 'quotes', label: 'Quotes', icon: <FileText size={16} />, count: customer.quotes_count },
    { id: 'invoices', label: 'Invoices', icon: <Receipt size={16} />, count: customer.invoices_count },
  ];

  const aboutRows: { label: string; value: ReactNode; icon: LucideIcon }[] = [
    { label: 'Company', value: customer.company || 'Private Entity', icon: Building2 },
    { label: 'Industry', value: customer.industry || 'Not specified', icon: Briefcase },
    { label: 'TRN', value: customer.trn || 'Not registered', icon: FileText },
    { label: 'Website', value: customer.website || 'N/A', icon: Globe },
    { label: 'Email', value: customer.email || 'N/A', icon: Mail },
    { label: 'Phone', value: customer.phone || 'N/A', icon: Phone },
  ];

  return (
    <>
      <div className="m-5 flex flex-col xl:flex-row gap-5 items-start animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Main profile card */}
        <div className="flex-1 min-w-0 w-full bg-brand-white border border-brand-border/50 rounded-xl shadow-sm flex flex-col min-h-[calc(100vh-140px)] overflow-hidden">

          {/* Header */}
          <div className="bg-brand-white border-b border-brand-border/50 p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <Avatar size={56} name={customer.name || 'User'} variant="marble" colors={avatarColors} />
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-xl font-bold text-brand-primary tracking-tight">{customer.name}</h1>
                    {customer.is_portal_active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider bg-admin-bg text-admin-text-muted border border-admin-border">
                        OFFLINE
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[12px] font-medium text-brand-secondary">
                    <span className="flex items-center gap-1.5"><Building2 size={13} className="text-brand-accent" />{customer.company || 'Private Entity'}</span>
                    {customer.industry && <span className="flex items-center gap-1.5"><Briefcase size={13} className="text-brand-info" />{customer.industry}</span>}
                    {customer.website && <span className="flex items-center gap-1.5"><Globe size={13} className="text-brand-accent" />{customer.website}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    <span className="text-[10px] font-bold text-brand-subtle uppercase tracking-wider bg-brand-surface px-2 py-0.5 rounded border border-brand-border/50">
                      {customer.customer_code || 'GENERIC-IDENTITY'}
                    </span>
                    <span className="flex items-center gap-1.5 text-[12px] font-medium text-brand-secondary"><Mail size={13} className="text-brand-info" />{customer.email}</span>
                    {customer.phone && <span className="flex items-center gap-1.5 text-[12px] font-medium text-brand-secondary"><Phone size={13} className="text-brand-accent" />{customer.phone}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setEditOpen(true)}
                  className="h-[36px] rounded-lg border-brand-border text-[12px] font-medium gap-2 shadow-sm px-4 text-brand-secondary hover:text-brand-primary"
                >
                  <Edit size={14} /> Edit Company
                </Button>
                {!customer.is_portal_active ? (
                  <Button
                    onClick={() => registerPortalMutation.mutate()}
                    disabled={registerPortalMutation.isPending}
                    className="h-[36px] rounded-lg bg-brand-success hover:bg-brand-success/90 text-white px-5 font-medium text-[12px] shadow-sm gap-2"
                  >
                    {registerPortalMutation.isPending ? <Spinner size={14} /> : <ShieldCheck size={14} />}
                    Initialize Access
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => registerPortalMutation.mutate()}
                    disabled={registerPortalMutation.isPending}
                    className="h-[36px] rounded-lg border-brand-border text-[12px] font-medium gap-2 shadow-sm text-brand-secondary hover:text-brand-primary"
                  >
                    <ArrowUpRight size={14} /> Resend Access
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="px-6 py-6 border-b border-brand-border/50">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Account Owner" value={customer.assigned_users?.[0]?.name || 'Unassigned'} icon={<UserIcon size={16} className="text-brand-info" />} iconBg="bg-brand-info-bg" />
              <StatCard title="Total Deals" value={customer.deals_count || 0} icon={<Handshake size={16} className="text-brand-accent" />} iconBg="bg-brand-accent-light dark:bg-brand-accent/20" />
              <StatCard title="Total Revenue" value={`${(customer.total_volume || 0).toLocaleString()} AED`} icon={<Wallet size={16} className="text-brand-success" />} iconBg="bg-brand-success-bg" />
              <StatCard title="Customer Since" value={customer.created_at ? new Date(customer.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'} icon={<Calendar size={16} className="text-brand-warning" />} iconBg="bg-brand-warning-bg" />
            </div>
          </div>

          <div className="flex-1 overflow-auto flex flex-col">
            <div className="px-6 border-b border-brand-border/50 bg-brand-white flex-shrink-0">
              <PageTabs tabs={profileTabs} value={activeTab} onChange={setActiveTab} />
            </div>

            {activeTab === 'overview' && (
              <div className="p-6 flex-1 overflow-auto space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                  {/* About Company */}
                  <div className="bg-brand-white border border-brand-border/50 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-brand-border/50 flex items-center gap-2 text-[14px] font-semibold text-brand-primary">
                      <Building2 size={16} className="text-brand-accent" /> About Company
                    </div>
                    <div className="divide-y divide-brand-border/50">
                      {aboutRows.map((row) => (
                        <div key={row.label} className="flex items-center gap-3 px-5 py-3">
                          <row.icon size={14} className="text-brand-subtle flex-shrink-0" />
                          <div className="min-w-0 flex-1 flex items-center justify-between gap-3">
                            <span className="text-[12px] text-brand-subtle">{row.label}</span>
                            <span className="text-[12px] font-semibold text-brand-primary text-right truncate">{row.value}</span>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-start gap-3 px-5 py-3">
                        <MapPin size={14} className="text-brand-subtle mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-[12px] text-brand-subtle block mb-1">Address</span>
                          <p className="text-[12px] font-medium text-brand-secondary leading-relaxed">{customer.address || 'No address on file'}</p>
                        </div>
                      </div>
                    </div>
                    {customer.description && (
                      <div className="px-5 py-4 border-t border-brand-border/50 bg-brand-surface/40">
                        <p className="text-[12px] text-brand-secondary leading-relaxed">{customer.description}</p>
                      </div>
                    )}
                    <div className="px-5 py-4 border-t border-brand-border/50 flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-medium text-brand-subtle uppercase tracking-wider mr-1">Tags</span>
                      {customer.labels && customer.labels.length > 0 ? (
                        customer.labels.map((label: CustomerLabel) => <LabelBadge key={label.id} label={label} />)
                      ) : (
                        <span className="text-[12px] text-brand-subtle italic">No tags assigned</span>
                      )}
                    </div>
                  </div>

                  {/* Key Contacts */}
                  <div className="bg-brand-white border border-brand-border/50 rounded-xl shadow-sm flex flex-col overflow-hidden">
                    <div className="px-5 py-4 border-b border-brand-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[14px] font-semibold text-brand-primary">
                        <Users size={16} className="text-brand-accent" /> Key Contacts{contacts.length > 0 && <span className="text-brand-subtle font-normal">({contacts.length})</span>}
                      </div>
                      {contacts.length > 0 && (
                        <button type="button" onClick={() => setActiveTab('contacts')} className="text-[11px] font-semibold text-brand-accent hover:underline">View all</button>
                      )}
                    </div>
                    <div className="divide-y divide-brand-border/50 flex-1">
                      {contacts.length === 0 ? (
                        <p className="p-5 text-[12px] text-brand-subtle">No contact persons yet.</p>
                      ) : contacts.slice(0, 5).map((c) => (
                        <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                          <Avatar size={32} name={c.full_name} variant="beam" colors={avatarColors} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-[13px] font-semibold text-brand-primary truncate">{c.full_name}</p>
                              {c.is_primary && <Star size={11} className="text-brand-accent flex-shrink-0" fill="currentColor" />}
                            </div>
                            <p className="text-[11px] text-brand-subtle truncate">{c.designation || 'No designation'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Company Summary */}
                  <div className="bg-brand-white border border-brand-border/50 rounded-xl shadow-sm flex flex-col overflow-hidden">
                    <div className="px-5 py-4 border-b border-brand-border/50 flex items-center gap-2 text-[14px] font-semibold text-brand-primary">
                      <Wallet size={16} className="text-brand-success" /> Company Summary
                    </div>
                    <div className="p-5 grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-brand-surface border border-brand-border/50">
                        <p className="text-[11px] font-medium text-brand-subtle">Open Deals</p>
                        <p className="text-[16px] font-bold text-brand-primary mt-0.5">{customer.open_deals_count ?? 0}</p>
                        <p className="text-[10px] text-brand-subtle mt-0.5">{(customer.open_deals_value || 0).toLocaleString()} AED</p>
                      </div>
                      <div className="p-3 rounded-lg bg-brand-surface border border-brand-border/50">
                        <p className="text-[11px] font-medium text-brand-subtle">Open Quotes</p>
                        <p className="text-[16px] font-bold text-brand-primary mt-0.5">{customer.open_quotes_count ?? 0}</p>
                        <p className="text-[10px] text-brand-subtle mt-0.5">{(customer.open_quotes_value || 0).toLocaleString()} AED</p>
                      </div>
                      <div className="p-3 rounded-lg bg-brand-surface border border-brand-border/50">
                        <p className="text-[11px] font-medium text-brand-subtle">Open Invoices</p>
                        <p className="text-[16px] font-bold text-brand-primary mt-0.5">{customer.open_invoices_count ?? 0}</p>
                        <p className="text-[10px] text-brand-subtle mt-0.5">{(customer.open_invoices_value || 0).toLocaleString()} AED</p>
                      </div>
                      <div className="p-3 rounded-lg bg-brand-danger-bg border border-brand-danger/20">
                        <p className="text-[11px] font-medium text-brand-danger flex items-center gap-1"><AlertTriangle size={11} /> Overdue</p>
                        <p className="text-[16px] font-bold text-brand-danger mt-0.5">{customer.overdue_invoices_count ?? 0}</p>
                        <p className="text-[10px] text-brand-danger/70 mt-0.5">{(customer.overdue_invoices_value || 0).toLocaleString()} AED</p>
                      </div>
                    </div>
                    <div className="px-5 pb-5">
                      <div className="p-4 rounded-lg bg-brand-success-bg border border-brand-success/20 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-medium text-brand-success/80">Total Revenue</p>
                          <p className="text-[18px] font-bold text-brand-success mt-0.5">{(customer.total_volume || 0).toLocaleString()} AED</p>
                        </div>
                        <Wallet size={24} className="text-brand-success/50" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Deals */}
                <div className="bg-brand-white border border-brand-border/50 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-brand-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[14px] font-semibold text-brand-primary">
                      <Handshake size={16} className="text-brand-accent" /> Recent Deals
                    </div>
                    <button type="button" onClick={() => setActiveTab('deals')} className="text-[11px] font-semibold text-brand-accent hover:underline">View all</button>
                  </div>
                  <DataTable columns={dealColumns} data={(deals || []).slice(0, 5)} onRowClick={() => navigate(`${getBasePath()}/deals`)} hidePagination />
                </div>
              </div>
            )}

            {activeTab === 'contacts' && (
              <div className="p-6 flex-1 overflow-auto">
                <CustomerContactsPanel customerId={Number(id)} />
              </div>
            )}

            {activeTab === 'deals' && (
              <div className="p-6 flex-1 overflow-auto">
                <div className="bg-brand-white border border-brand-border/50 rounded-xl overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-brand-border/50 bg-brand-surface flex items-center gap-2 text-[13px] font-semibold text-brand-primary">
                    <Handshake size={16} className="text-brand-accent" /> Deal Pipeline
                  </div>
                  <DataTable columns={dealColumns} data={deals || []} onRowClick={() => navigate(`${getBasePath()}/deals`)} />
                </div>
              </div>
            )}

            {activeTab === 'quotes' && (
              <div className="p-6 flex-1 overflow-auto">
                <div className="bg-brand-white border border-brand-border/50 rounded-xl overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-brand-border/50 bg-brand-surface flex items-center gap-2 text-[13px] font-semibold text-brand-primary">
                     <FileText size={16} className="text-brand-warning" /> Quotation History
                  </div>
                  <DataTable columns={quoteColumns} data={quotes || []} onRowClick={(row) => navigate(`${getBasePath()}/quotes/${row.id}`)} />
                </div>
              </div>
            )}

            {activeTab === 'invoices' && (
              <div className="p-6 flex-1 overflow-auto">
                <div className="bg-brand-white border border-brand-border/50 rounded-xl overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-brand-border/50 bg-brand-surface flex items-center gap-2 text-[13px] font-semibold text-brand-primary">
                     <Receipt size={16} className="text-brand-success" /> Commercial Invoices
                  </div>
                  <DataTable columns={invoiceColumns} data={invoices || []} onRowClick={(row) => navigate(`${getBasePath()}/invoices/${row.id}`)} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Activity sidebar */}
        <div className="w-full xl:w-[340px] xl:shrink-0 bg-brand-white border border-brand-border/50 rounded-xl shadow-sm flex flex-col overflow-hidden xl:sticky xl:top-5 xl:max-h-[calc(100vh-40px)]">
          <ActivityFeedPanel customerId={Number(id)} />
        </div>
      </div>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-brand-white border-brand-border/50 p-0 flex flex-col gap-0">
          <div className="p-6 border-b border-brand-border/50 flex-shrink-0">
            <SheetHeader className="space-y-1 text-left">
              <SheetTitle className="text-[16px] font-semibold text-brand-primary pr-6">Refine Client Identity</SheetTitle>
              <SheetDescription className="text-[13px] text-brand-subtle mt-1">Update primary contact and logistical data.</SheetDescription>
            </SheetHeader>
          </div>
          <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-4 p-6">
            <div className="space-y-2">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Full Name</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-[36px] bg-brand-surface border-brand-border/50 rounded-lg text-[13px]" />
            </div>
            <div className="space-y-2">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Company</Label>
              <Input value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="h-[36px] bg-brand-surface border-brand-border/50 rounded-lg text-[13px]" />
            </div>
            <div className="space-y-2">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Email</Label>
              <Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="h-[36px] bg-brand-surface border-brand-border/50 rounded-lg text-[13px]" />
            </div>
            <div className="space-y-2">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Phone</Label>
              <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="h-[36px] bg-brand-surface border-brand-border/50 rounded-lg text-[13px]" />
            </div>
            <div className="space-y-2">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">TRN</Label>
              <Input value={form.trn} onChange={e => setForm({...form, trn: e.target.value})} className="h-[36px] bg-brand-surface border-brand-border/50 rounded-lg text-[13px] font-mono" />
            </div>
            <div className="space-y-2">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Portal Access</Label>
              <div className="flex items-center gap-3 h-[36px] px-3 bg-brand-surface border border-brand-border/50 rounded-lg">
                <Switch checked={form.is_portal_active} onCheckedChange={v => setForm({...form, is_portal_active: v})} />
                <span className="text-[12px] font-medium text-brand-primary">{form.is_portal_active ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Industry</Label>
              <Input value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} className="h-[36px] bg-brand-surface border-brand-border/50 rounded-lg text-[13px]" />
            </div>
            <div className="space-y-2">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Website</Label>
              <Input value={form.website} onChange={e => setForm({...form, website: e.target.value})} className="h-[36px] bg-brand-surface border-brand-border/50 rounded-lg text-[13px]" placeholder="https://example.com" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Dispatch Address</Label>
              <Textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="bg-brand-surface border-brand-border/50 rounded-lg min-h-[100px] text-[13px]" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Description</Label>
              <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-brand-surface border-brand-border/50 rounded-lg min-h-[80px] text-[13px]" placeholder="Brief notes about this company..." />
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Labels</Label>
              <LabelSelector selectedIds={formLabelIds} onChange={setFormLabelIds} />
            </div>
          </div>
          <div className="p-6 pt-4 border-t border-brand-border/50 flex-shrink-0">
            <SheetFooter className="sm:justify-end">
              <Button variant="ghost" onClick={() => setEditOpen(false)} className="text-[13px] font-medium">Cancel</Button>
              <Button onClick={handleUpdate} disabled={update.isPending} className="bg-brand-primary text-brand-white hover:opacity-90 rounded-lg text-[13px] font-medium px-6">
                {update.isPending ? <Spinner className="mr-2" size={14} /> : null} Sync Changes
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
