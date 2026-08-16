import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import type { Lead, User, PaginatedResponse, LeadStatus } from '@/types';
import type { AxiosError } from 'axios';
import { UserPlus, Building2, Mail, Phone, ArrowRightLeft, Users, Upload, ChevronDown, RefreshCw, FileUp, Trash2, X, Tags } from 'lucide-react';
import { Spinner } from '@/components/shared/Spinner';
import { toTitleCase } from '@/lib/utils';
import { ResourceListingPage } from '@/components/shared/ResourceListingPage';
import { useResourceMutation, useResourceList } from '@/hooks/useApi';
import { ActionGroup } from '@/components/shared/ActionGroup';
import api from '@/lib/axios';
import { toast } from 'sonner';
import Avatar from 'boring-avatars';
import { getBasePath } from '@/hooks/useBasePath';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { avatarColorsFor } from '@/lib/avatarColors';

const LEAD_SOURCES = ['manual', 'website', 'email', 'referral', 'import', 'other', 'google_contacts', 'csv_import', 'vcf_import', 'json_import'];

const LEAD_SOURCE_LABELS: Record<string, string> = {
  google_contacts: 'Google Contacts',
  csv_import: 'Google Contacts',
  vcf_import: 'VCF Import',
  json_import: 'JSON Import',
};

const leadSourceLabel = (s: string) => LEAD_SOURCE_LABELS[s] || s.charAt(0).toUpperCase() + s.slice(1);

// Distinct pill colors per source, keyed by the raw value (not the display
// label — csv_import and google_contacts share a label but keep separate
// colors here so the underlying source is still visually distinguishable).
const SOURCE_BADGE_STYLES: Record<string, string> = {
  manual: 'text-[#6366F1] bg-[#6366F11F]',
  portal: 'text-[#0F52BA] bg-[#0F52BA1F]',
  website: 'text-[#0F52BA] bg-[#0F52BA1F]',
  email: 'text-[#8B5CF6] bg-[#8B5CF61F]',
  referral: 'text-[#F59E0B] bg-[#F59E0B1F]',
  google_contacts: 'text-[#10B981] bg-[#10B9811F]',
  csv_import: 'text-[#10B981] bg-[#10B9811F]',
  vcf_import: 'text-[#0EA5E9] bg-[#0EA5E91F]',
  json_import: 'text-[#0EA5E9] bg-[#0EA5E91F]',
};
const sourceBadgeStyle = (s: string) => SOURCE_BADGE_STYLES[s] || 'text-brand-secondary bg-brand-bg';

const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'lost', 'unresponsive', 'converted'];

// Renders a country flag (derived from the phone's calling code) next to the
// number. UAE ('AE') is used as the default country when a number has no
// explicit "+" country code, since that's the common local format seen here
// (e.g. "050-382-1311").
const getFlagEmoji = (countryCode: string) =>
  countryCode
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(c.charCodeAt(0) + 127397));

const PhoneWithFlag = ({ phone }: { phone: string }) => {
  const parsed = parsePhoneNumberFromString(phone, 'AE');
  const flag = parsed?.country ? getFlagEmoji(parsed.country) : null;
  return (
    <p className="text-[12px] text-brand-subtle flex items-center gap-1.5">
      {flag ? <span className="text-[13px] leading-none">{flag}</span> : <Phone size={12} className="opacity-40" />}
      {phone}
    </p>
  );
};

export const Leads = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkAssignUserId, setBulkAssignUserId] = useState('');
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', company: '', email: '', phone: '', phone_2: '', source: 'manual', status: 'new', notes: '', user_id: '',
  });

  const { data: staffData } = useResourceList<PaginatedResponse<User>>('users', { per_page: 100 });
  const staffMembers = (staffData?.data || []).filter((u) => u.role !== 'customer');

  const { create, update, remove, bulkUpdate } = useResourceMutation('leads');

  const convertMutation = useMutation({
    mutationFn: async (leadId: number) => (await api.post(`/admin/leads/${leadId}/convert`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Lead converted to Customer');
    },
    onError: (e: AxiosError<{ message?: string }>) => toast.error(e.response?.data?.message || 'Failed to convert lead'),
  });

  // No dedicated bulk-delete endpoint exists for leads, so each selected
  // lead is deleted individually and the list is invalidated once at the end.
  const bulkDelete = useMutation({
    mutationFn: (ids: number[]) => Promise.all(ids.map((id) => api.delete(`/admin/leads/${id}`))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Selected leads deleted');
    },
    onError: () => toast.error('Failed to delete some leads'),
  });

  const openAdd = () => {
    setEditingLead(null);
    setForm({ name: '', company: '', email: '', phone: '', phone_2: '', source: 'portal', status: 'new', notes: '', user_id: '' });
    setDialogOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setEditingLead(lead);
    setForm({
      name: lead.name,
      company: lead.company || '',
      email: lead.email || '',
      phone: lead.phone || '',
      phone_2: lead.phone_2 || '',
      source: lead.source || 'manual',
      status: lead.status,
      notes: lead.notes || '',
      user_id: lead.user_id ? String(lead.user_id) : '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload: Partial<Lead> = { ...form, status: form.status as LeadStatus, user_id: form.user_id ? Number(form.user_id) : null };
    if (editingLead) {
      await update.mutateAsync({ id: editingLead.id, data: payload });
    } else {
      await create.mutateAsync(payload);
    }
    setDialogOpen(false);
  };

  const columns: ColumnDef<Lead>[] = [
    {
      accessorKey: 'name',
      header: 'Lead Details',
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-brand-primary truncate">{toTitleCase(row.original.name)}</p>
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
          {row.original.phone && <PhoneWithFlag phone={row.original.phone} />}
          {row.original.phone_2 && <PhoneWithFlag phone={row.original.phone_2} />}
        </div>
      ),
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ row }) => row.original.source ? (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${sourceBadgeStyle(row.original.source)}`}>
          {leadSourceLabel(row.original.source)}
        </span>
      ) : (
        <span className="text-[12px] text-brand-subtle">—</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'owner',
      header: 'Assigned to',
      cell: ({ row }) => {
        const owner = row.original.owner;
        if (!owner) return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider bg-brand-bg text-brand-subtle border border-brand-border">
            UNASSIGNED
          </span>
        );
        return (
          <div className="flex items-center gap-2">
            <Avatar size={22} name={owner.name} variant="beam" colors={avatarColorsFor(owner)} />
            <span className="text-[12px] font-medium text-brand-secondary truncate max-w-[100px]">{toTitleCase(owner.name)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'deals_count',
      header: 'Activity',
      cell: ({ row }) => (
        <div className="text-xs font-bold text-brand-secondary">
          {row.original.deals_count || 0} <span className="text-[10px] text-brand-subtle font-medium ml-0.5">Deals</span>
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
        onRowClick={openEdit}
        searchPlaceholder="Search by name, company, email..."
        filters={[
          {
            name: 'status',
            label: 'Status',
            placeholder: 'Filter by status',
            options: LEAD_STATUSES.map((s) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s })),
          },
          {
            name: 'source',
            label: 'Source',
            placeholder: 'Filter by source',
            options: LEAD_SOURCES.map((s) => ({ label: leadSourceLabel(s), value: s })),
          },
        ]}
        enableRowSelection
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        floatingBulkActions={(ids, clear) => (
          <div className="bg-brand-primary text-brand-white px-4 py-2 rounded-full shadow-lg flex items-center gap-3 flex-wrap justify-center">
            <span className="text-[13px] font-medium">{ids.length} selected</span>
            <div className="w-px h-4 bg-brand-white/20" />
            <Button
              onClick={() => setBulkAssignOpen(true)}
              size="sm"
              variant="ghost"
              className="text-brand-white hover:text-brand-primary hover:bg-brand-white h-7 px-3 text-xs rounded-full transition-colors"
            >
              <UserPlus size={14} className="mr-1.5" /> Assign to Team
            </Button>
            <Select
              onValueChange={(status) => bulkUpdate.mutate({ ids, status }, { onSuccess: clear })}
            >
              <SelectTrigger className="h-7 px-3 text-xs rounded-full border-0 bg-transparent text-brand-white hover:bg-brand-white hover:text-brand-primary transition-colors w-auto gap-1.5 [&>svg]:opacity-70">
                <Tags size={14} />
                <SelectValue placeholder="Change Status" />
              </SelectTrigger>
              <SelectContent className="bg-brand-white border-brand-border rounded-xl">
                {LEAD_STATUSES.filter((s) => s !== 'converted').map((s) => (
                  <SelectItem key={s} value={s} className="capitalize text-[13px]">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => setBulkDeleteOpen(true)}
              size="sm"
              variant="ghost"
              className="text-red-200 hover:text-brand-white hover:bg-red-500/80 h-7 px-3 text-xs rounded-full transition-colors"
            >
              <Trash2 size={14} className="mr-1.5" /> Delete
            </Button>
            <button onClick={clear} className="text-brand-white/70 hover:text-brand-white">
              <X size={16} />
            </button>
          </div>
        )}
        extraActions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto h-[32px] text-[12px] font-medium border-brand-border shadow-sm gap-1.5">
                <Upload size={13} /> Import <ChevronDown size={13} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-brand-white border-brand-border rounded-xl shadow-xl p-1">
              <DropdownMenuItem onClick={() => navigate(`${getBasePath()}/leads/import`)} className="rounded-lg cursor-pointer">
                <FileUp size={14} className="mr-2" /> Upload File (.vcf/.json/.csv)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`${getBasePath()}/settings`)} className="rounded-lg cursor-pointer">
                <RefreshCw size={14} className="mr-2" /> Sync Google Contacts
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
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
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label className="text-[12px] font-medium text-brand-secondary ml-1">Phone 2</Label>
                <Input value={form.phone_2} onChange={(e) => setForm({ ...form, phone_2: e.target.value })} className="h-[36px] bg-brand-white border-brand-border/50 text-[13px] rounded-lg" placeholder="+971 50 123 4567" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-brand-secondary ml-1">Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                  <SelectTrigger className="h-[36px] bg-brand-white border-brand-border/50 text-[13px] rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCES.map((s) => (
                      <SelectItem key={s} value={s} className="text-[13px]">{leadSourceLabel(s)}</SelectItem>
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
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label className="text-[12px] font-medium text-brand-secondary ml-1">Assigned To</Label>
                <Select value={form.user_id || 'unassigned'} onValueChange={(v) => setForm({ ...form, user_id: v === 'unassigned' ? '' : v })}>
                  <SelectTrigger className="h-[36px] bg-brand-white border-brand-border/50 text-[13px] rounded-lg">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned" className="text-[13px]">Unassigned</SelectItem>
                    {staffMembers.map((s: User) => (
                      <SelectItem key={s.id} value={String(s.id)} className="text-[13px]">
                        <span className="flex items-center gap-2">
                          <Avatar size={18} name={s.name} variant="beam" colors={avatarColorsFor(s)} />
                          {toTitleCase(s.name)}
                        </span>
                      </SelectItem>
                    ))}
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

      {/* Bulk Assign Dialog */}
      <Dialog open={bulkAssignOpen} onOpenChange={setBulkAssignOpen}>
        <DialogContent className="bg-brand-white border-brand-border/50 sm:max-w-md rounded-xl shadow-xl p-0 overflow-hidden">
          <div className="p-6 bg-brand-surface border-b border-brand-border/50">
            <DialogHeader>
              <DialogTitle className="text-[16px] font-semibold text-brand-primary">Assign Leads</DialogTitle>
              <DialogDescription className="text-[13px] text-brand-subtle mt-0.5">
                Assign {selectedIds.length} selected lead{selectedIds.length !== 1 ? 's' : ''} to a staff member.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-5 p-6">
            <div className="space-y-2">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Assign To</Label>
              <Select value={bulkAssignUserId} onValueChange={setBulkAssignUserId}>
                <SelectTrigger className="h-[36px] bg-brand-surface border-brand-border/50 text-brand-primary rounded-lg text-[13px] font-medium">
                  <SelectValue placeholder="Select a staff member" />
                </SelectTrigger>
                <SelectContent className="bg-brand-white border-brand-border/50 rounded-xl shadow-lg">
                  {staffMembers.map((s: User) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {toTitleCase(s.name)} <span className="text-brand-subtle text-xs">({s.role})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="p-6 pt-2">
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setBulkAssignOpen(false)} className="rounded-lg text-[13px] font-medium">Cancel</Button>
              <Button
                onClick={() => {
                  bulkUpdate.mutate({ ids: selectedIds, user_id: Number(bulkAssignUserId) }, {
                    onSuccess: () => {
                      setBulkAssignOpen(false);
                      setBulkAssignUserId('');
                      setSelectedIds([]);
                    },
                  });
                }}
                disabled={!bulkAssignUserId || bulkUpdate.isPending}
                className="bg-brand-primary text-brand-white hover:opacity-90 rounded-lg text-[13px] font-medium px-6 shadow-sm"
              >
                {bulkUpdate.isPending ? <Spinner size={16} className="mr-2" /> : null} Assign
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Delete selected leads?"
        description={`This will permanently delete ${selectedIds.length} lead${selectedIds.length !== 1 ? 's' : ''}. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          bulkDelete.mutate(selectedIds, {
            onSuccess: () => {
              setBulkDeleteOpen(false);
              setSelectedIds([]);
            },
          });
        }}
      />
    </div>
  );
};
