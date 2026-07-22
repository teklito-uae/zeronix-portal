import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { Lead } from '@/types';
import { UserPlus, Building2, Mail, Phone, ArrowRightLeft, Users, Calendar } from 'lucide-react';
import { Spinner } from '@/components/shared/Spinner';
import { ResourceListingPage } from '@/components/shared/ResourceListingPage';
import { useResourceMutation } from '@/hooks/useApi';
import { ActionGroup } from '@/components/shared/ActionGroup';
import api from '@/lib/axios';
import { toast } from 'sonner';
import Avatar from 'boring-avatars';
import { useThemeStore } from '@/store/useThemeStore';

const LEAD_SOURCES = ['manual', 'website', 'email', 'referral', 'import', 'other'];

export const Leads = () => {
  const queryClient = useQueryClient();
  const { theme } = useThemeStore();
  const avatarColors = theme === 'dark'
    ? ['#818CF8', '#A5B4FC', '#34D399', '#FBBF24', '#F472B6']
    : ['#4F46E5', '#6366F1', '#10B981', '#F59E0B', '#EC4899'];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [form, setForm] = useState({
    name: '', company: '', email: '', phone: '', source: 'manual', status: 'new', notes: '',
  });

  const leadTabs = [
    { id: 'all', label: 'All Leads' },
    { id: 'new', label: 'New' },
    { id: 'contacted', label: 'Contacted' },
    { id: 'qualified', label: 'Qualified' },
    { id: 'lost', label: 'Lost' },
    { id: 'unresponsive', label: 'Unresponsive' },
    { id: 'converted', label: 'Converted' },
  ];

  const { create, update, remove } = useResourceMutation('leads');

  const convertMutation = useMutation({
    mutationFn: async (leadId: number) => (await api.post(`/admin/leads/${leadId}/convert`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Lead converted to Customer');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to convert lead'),
  });

  const openAdd = () => {
    setEditingLead(null);
    setForm({ name: '', company: '', email: '', phone: '', source: 'portal', status: 'new', notes: '' });
    setDialogOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setEditingLead(lead);
    setForm({
      name: lead.name,
      company: lead.company || '',
      email: lead.email || '',
      phone: lead.phone || '',
      source: lead.source || 'manual',
      status: lead.status,
      notes: lead.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingLead) {
      await update.mutateAsync({ id: editingLead.id, data: form });
    } else {
      await create.mutateAsync(form);
    }
    setDialogOpen(false);
  };

  const columns: ColumnDef<Lead>[] = [
    {
      accessorKey: 'name',
      header: 'Lead Details',
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-brand-primary truncate">{row.original.name}</p>
          {row.original.company && (
            <p className="text-[11px] text-brand-subtle flex items-center gap-1.5 truncate font-medium mt-0.5">
              <Building2 size={12} /> {row.original.company}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'contact',
      header: 'Contact',
      cell: ({ row }) => (
        <div className="space-y-1">
          {row.original.email && (
            <p className="text-[12px] text-brand-secondary flex items-center gap-1.5">
              <Mail size={12} className="opacity-40" /> {row.original.email}
            </p>
          )}
          {row.original.phone && (
            <p className="text-[12px] text-brand-subtle flex items-center gap-1.5">
              <Phone size={12} className="opacity-40" /> {row.original.phone}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ row }) => (
        <span className="text-[12px] font-medium text-brand-secondary capitalize">{row.original.source || '—'}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'owner',
      header: 'Owner',
      cell: ({ row }) => {
        const owner = row.original.owner;
        if (!owner) return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider bg-admin-bg text-admin-text-muted border border-admin-border">
            UNASSIGNED
          </span>
        );
        return (
          <div className="flex items-center gap-2">
            <Avatar size={22} name={owner.name} variant="beam" colors={avatarColors} />
            <span className="text-[12px] font-medium text-brand-secondary truncate max-w-[100px]">{owner.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-[12px] text-brand-subtle flex items-center gap-1.5 font-medium">
          <Calendar size={12} className="opacity-50" />
          {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'enquiries_count',
      header: 'Activity',
      cell: ({ row }) => (
        <div className="text-xs font-bold text-admin-text-secondary">
          {row.original.enquiries_count || 0} <span className="text-[10px] text-admin-text-muted font-medium ml-0.5">Enquiries</span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {row.original.status !== 'converted' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => convertMutation.mutate(row.original.id)}
              disabled={convertMutation.isPending}
              className="h-8 px-3 text-[11px] font-bold bg-brand-accent/10 text-brand-accent border-brand-accent/20 hover:bg-brand-accent hover:text-brand-white rounded-lg transition-all"
            >
              {convertMutation.isPending && convertMutation.variables === row.original.id ? (
                <Spinner size={12} className="mr-1" />
              ) : (
                <ArrowRightLeft size={12} className="mr-1" />
              )}
              Convert
            </Button>
          )}
          <ActionGroup
            onEdit={() => openEdit(row.original)}
            onDelete={() => remove.mutate(row.original.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <ResourceListingPage<Lead>
        resource="leads"
        title="Leads"
        icon={<Users size={20} />}
        columns={columns}
        createLabel="Add Lead"
        createPath="#"
        onCreateClick={openAdd}
        searchPlaceholder="Search by name, company, email..."
        tabs={leadTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        baseFilters={{ status: activeTab !== 'all' ? activeTab : undefined }}
        filters={[
          {
            name: 'source',
            label: 'Source',
            placeholder: 'Filter by source',
            options: LEAD_SOURCES.map((s) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s })),
          },
        ]}
      />

      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-brand-white border-brand-border/50 p-0 flex flex-col gap-0">
          <div className="bg-brand-surface p-6 border-b border-brand-border/50 flex-shrink-0">
            <SheetHeader className="space-y-0 text-left">
              <SheetTitle className="text-[16px] font-semibold text-brand-primary flex items-center gap-3 pr-6">
                <div className="h-10 w-10 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                  <UserPlus size={20} />
                </div>
                {editingLead ? 'Update Lead' : 'Register New Lead'}
              </SheetTitle>
              <SheetDescription className="text-[13px] font-medium text-brand-subtle mt-0.5">
                A Lead is a prospect — it becomes a Customer only once converted.
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="flex-1 p-6 space-y-5 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label className="text-[12px] font-medium text-brand-secondary ml-1">Full Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-[36px] bg-brand-white border-brand-border/50 text-[13px] rounded-lg" placeholder="e.g. John Doe" />
              </div>
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label className="text-[12px] font-medium text-brand-secondary ml-1">Company</Label>
                <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="h-[36px] bg-brand-white border-brand-border/50 text-[13px] rounded-lg" placeholder="e.g. Acme Corp" />
              </div>
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label className="text-[12px] font-medium text-brand-secondary ml-1">Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-[36px] bg-brand-white border-brand-border/50 text-[13px] rounded-lg" placeholder="john@example.com" />
              </div>
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label className="text-[12px] font-medium text-brand-secondary ml-1">Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-[36px] bg-brand-white border-brand-border/50 text-[13px] rounded-lg" placeholder="+971 50 123 4567" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-brand-secondary ml-1">Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                  <SelectTrigger className="h-[36px] bg-brand-white border-brand-border/50 text-[13px] rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize text-[13px]">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-brand-secondary ml-1">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="h-[36px] bg-brand-white border-brand-border/50 text-[13px] rounded-lg" disabled={form.status === 'converted'}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['new', 'contacted', 'qualified', 'lost', 'unresponsive'].map((s) => (
                      <SelectItem key={s} value={s} className="capitalize text-[13px]">{s}</SelectItem>
                    ))}
                    {form.status === 'converted' && <SelectItem value="converted" className="text-[13px]">converted</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="bg-brand-white border-brand-border/50 text-[13px] text-brand-primary rounded-xl resize-none min-h-[80px] p-4"
                placeholder="Qualification notes, requirements..."
                rows={3}
              />
            </div>
          </div>

          <div className="p-6 pt-2 flex-shrink-0">
            <SheetFooter className="gap-2 sm:justify-end">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-lg text-[13px] font-medium">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!form.name || create.isPending || update.isPending}
                className="flex-1 bg-brand-primary text-brand-white hover:opacity-90 h-[36px] rounded-lg font-medium text-[13px] shadow-sm transition-all"
              >
                {(create.isPending || update.isPending) ? <Spinner size={16} className="mr-2" /> : null}
                {editingLead ? 'Update Lead' : 'Register Lead'}
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
