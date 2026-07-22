import { useMemo, useState, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatDistanceToNow } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import { useResourceMutation } from '@/hooks/useApi';
import api from '@/lib/axios';
import { toast } from 'sonner';
import type { Deal, DealActivity, DealStage, Lead, Customer, CustomerContact } from '@/types';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { SEO } from '@/components/shared/SEO';
import { PageLoader } from '@/components/shared/PageLoader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Spinner } from '@/components/shared/Spinner';
import { DataTable } from '@/components/shared/DataTable';
import { PageTabs } from '@/components/shared/PageTabs';
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
  Handshake,
  Plus,
  Building2,
  Calendar,
  UserCircle2,
  ListTodo,
  CalendarClock,
  StickyNote,
  Mail,
  Phone,
  KanbanSquare,
  List,
} from 'lucide-react';

const STAGES: { id: DealStage; label: string; colorClassName: string }[] = [
  { id: 'new', label: 'New', colorClassName: 'bg-blue-500' },
  { id: 'qualified', label: 'Qualified', colorClassName: 'bg-purple-500' },
  { id: 'proposal', label: 'Proposal', colorClassName: 'bg-amber-500' },
  { id: 'negotiation', label: 'Negotiation', colorClassName: 'bg-orange-500' },
  { id: 'won', label: 'Won', colorClassName: 'bg-emerald-500' },
  { id: 'lost', label: 'Lost', colorClassName: 'bg-red-500' },
];

type DealView = 'pipeline' | 'list';

const DEAL_VIEW_TABS: { id: DealView; label: string; icon: ReactNode }[] = [
  { id: 'pipeline', label: 'Pipeline', icon: <KanbanSquare size={14} /> },
  { id: 'list', label: 'List', icon: <List size={14} /> },
];

const ACTIVITY_TYPES: { id: DealActivity['type']; label: string; icon: typeof ListTodo }[] = [
  { id: 'task', label: 'Task', icon: ListTodo },
  { id: 'meeting', label: 'Meeting', icon: CalendarClock },
  { id: 'note', label: 'Note', icon: StickyNote },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'call', label: 'Call', icon: Phone },
];

const dealSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().optional(),
    linkType: z.enum(['lead', 'customer']),
    lead_id: z.string().optional(),
    customer_id: z.string().optional(),
    customer_contact_id: z.string().optional(),
    value: z.string().optional(),
    expected_close_date: z.string().optional(),
  })
  .refine((data) => (data.linkType === 'lead' ? !!data.lead_id : !!data.customer_id), {
    message: 'Select a lead or customer to link this deal to',
    path: ['lead_id'],
  });

type DealFormValues = z.infer<typeof dealSchema>;

type PipelineResponse = Record<DealStage, { deals: Deal[]; count: number; value: number }>;

const dealColumns: ColumnDef<Deal>[] = [
  {
    accessorKey: 'title',
    header: 'Deal',
    cell: ({ row }) => (
      <div>
        <p className="font-semibold text-brand-primary">{row.original.title}</p>
        <p className="text-[11px] text-brand-subtle">{row.original.deal_code}</p>
      </div>
    ),
  },
  {
    id: 'company',
    header: 'Company',
    cell: ({ row }) => {
      const d = row.original;
      return <span>{d.customer?.company || d.customer?.name || d.lead?.company || d.lead?.name || '—'}</span>;
    },
  },
  {
    accessorKey: 'value',
    header: 'Value',
    cell: ({ row }) => (
      <span className="font-semibold">
        {Number(row.original.value).toLocaleString(undefined, { minimumFractionDigits: 2 })} AED
      </span>
    ),
  },
  {
    accessorKey: 'stage',
    header: 'Stage',
    cell: ({ row }) => <StatusBadge status={row.original.stage} />,
  },
  {
    accessorKey: 'expected_close_date',
    header: 'Expected Close',
    cell: ({ row }) =>
      row.original.expected_close_date ? new Date(row.original.expected_close_date).toLocaleDateString() : '—',
  },
  {
    id: 'owner',
    header: 'Owner',
    cell: ({ row }) => row.original.user?.name || '—',
  },
];

export const Deals = () => {
  const queryClient = useQueryClient();
  const [view, setView] = useState<DealView>('pipeline');
  const [stageFilter, setStageFilter] = useState<DealStage | 'all'>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [activeActivityType, setActiveActivityType] = useState<DealActivity['type'] | null>(null);
  const [activityNotes, setActivityNotes] = useState('');
  const [activityDueDate, setActivityDueDate] = useState('');

  const closeDealDetail = () => {
    setSelectedDeal(null);
    setActiveActivityType(null);
    setActivityNotes('');
    setActivityDueDate('');
  };

  const { data: dealDetail } = useQuery({
    queryKey: ['deals', selectedDeal?.id],
    queryFn: async () =>
      (await api.get(`/admin/deals/${selectedDeal!.id}`)).data as Deal & { activities?: DealActivity[] },
    enabled: !!selectedDeal,
  });

  const addActivity = useMutation({
    mutationFn: ({ dealId, data }: { dealId: number; data: { type: DealActivity['type']; notes?: string; due_date?: string } }) =>
      api.post(`/admin/deals/${dealId}/activities`, data),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deals', variables.dealId] });
      toast.success('Activity logged');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to log activity'),
  });

  const handleLogActivity = () => {
    if (!selectedDeal || !activeActivityType) return;
    addActivity.mutate(
      {
        dealId: selectedDeal.id,
        data: {
          type: activeActivityType,
          notes: activityNotes || undefined,
          due_date: activeActivityType === 'task' && activityDueDate ? activityDueDate : undefined,
        },
      },
      {
        onSuccess: () => {
          setActiveActivityType(null);
          setActivityNotes('');
          setActivityDueDate('');
        },
      }
    );
  };

  const { data: pipeline, isLoading } = useQuery({
    queryKey: ['deals', 'pipeline'],
    queryFn: async () => (await api.get('/admin/deals/pipeline')).data.data as PipelineResponse,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads', 'all'],
    queryFn: async () => (await api.get('/admin/leads?per_page=100')).data.data as Lead[],
    enabled: addOpen,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: async () => (await api.get('/admin/customers?per_page=100')).data.data as Customer[],
    enabled: addOpen,
  });

  const { create, update } = useResourceMutation('deals', [['deals', 'pipeline']]);

  const allDeals = useMemo(() => Object.values(pipeline ?? {}).flatMap((g) => g.deals), [pipeline]);
  const filteredDeals = useMemo(
    () => (stageFilter === 'all' ? allDeals : allDeals.filter((d) => d.stage === stageFilter)),
    [allDeals, stageFilter]
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: { linkType: 'customer', title: '', value: '' },
  });

  const linkType = watch('linkType');
  const watchedCustomerId = watch('customer_id');

  const { data: contacts = [] } = useQuery({
    queryKey: ['customers', watchedCustomerId, 'contacts'],
    queryFn: async () => (await api.get(`/admin/customers/${watchedCustomerId}/contacts`)).data as CustomerContact[],
    enabled: !!watchedCustomerId && linkType === 'customer',
  });

  const onCreateDeal = (values: DealFormValues) => {
    const payload: Record<string, unknown> = {
      title: values.title,
      description: values.description || undefined,
      value: values.value ? Number(values.value) : undefined,
      expected_close_date: values.expected_close_date || undefined,
    };
    if (values.linkType === 'lead') {
      payload.lead_id = Number(values.lead_id);
    } else {
      payload.customer_id = Number(values.customer_id);
      if (values.customer_contact_id) payload.customer_contact_id = Number(values.customer_contact_id);
    }

    create.mutate(payload, {
      onSuccess: () => {
        setAddOpen(false);
        reset({ linkType: 'customer', title: '', value: '' });
        toast.success('Deal created');
      },
    });
  };

  if (isLoading) {
    return <PageLoader label="Loading pipeline..." iconSize={32} className="h-full min-h-[400px] gap-3" />;
  }

  return (
    <div className="bg-brand-white flex flex-col h-full overflow-hidden animate-in fade-in duration-200">
      <SEO title="Deal Pipeline" />

      <div className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-5 py-3 md:py-4 gap-3 md:gap-0 border-b border-brand-border bg-brand-white flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <h1 className="text-[16px] md:text-[18px] font-bold text-brand-primary flex items-center gap-2">
            <Handshake size={18} className="text-brand-subtle" />
            Deal Pipeline
          </h1>
          <PageTabs tabs={DEAL_VIEW_TABS} value={view} onChange={(id) => setView(id as DealView)} />
        </div>
        <div className="flex items-center gap-2">
          {view === 'list' && (
            <Select value={stageFilter} onValueChange={(v) => setStageFilter(v as DealStage | 'all')}>
              <SelectTrigger className="h-[34px] w-40 text-[12px] rounded-lg font-medium">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {STAGES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            onClick={() => setAddOpen(true)}
            className="text-[13px] font-medium px-4 h-[34px] rounded-lg shadow-sm"
          >
            <Plus size={15} className="mr-1.5" /> New Deal
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-brand-white px-3 pt-2">
        {view === 'pipeline' ? (
          <KanbanBoard<Deal>
            columns={STAGES}
            items={allDeals}
            getItemStage={(deal) => deal.stage}
            onItemClick={(deal) => setSelectedDeal(deal)}
            onItemMove={(dealId, newStage) => {
              update.mutate({ id: dealId, data: { stage: newStage } });
            }}
            headerExtra={(stageId) => {
              const value = pipeline?.[stageId as DealStage]?.value ?? 0;
              return value > 0 ? (
                <span className="text-[10px] font-bold text-brand-subtle">
                  {Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })} AED
                </span>
              ) : null;
            }}
            renderCard={(deal) => (
              <div className="p-4 bg-admin-surface rounded-xl border border-admin-border cursor-grab active:cursor-grabbing hover:shadow-lg hover:border-zeronix-blue/30 transition-all flex flex-col gap-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-admin-text-primary leading-tight truncate">{deal.title}</p>
                    {(deal.customer?.company || deal.customer?.name || deal.lead?.company || deal.lead?.name) && (
                      <p className="text-[11px] text-brand-subtle flex items-center gap-1 mt-0.5 truncate font-medium">
                        <Building2 size={10} />
                        {deal.customer?.company || deal.customer?.name || deal.lead?.company || deal.lead?.name}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-black text-zeronix-blue bg-zeronix-blue/10 px-1.5 py-0.5 rounded shrink-0">
                    {deal.deal_code?.split('-').slice(-1)[0] ? `#${deal.deal_code.split('-').slice(-1)[0]}` : `#${deal.id}`}
                  </span>
                </div>

                <div className="flex justify-between items-end mt-1 pt-2 border-t border-brand-border/30">
                  <p className="text-[12px] font-bold text-admin-text-primary">
                    {Number(deal.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    <span className="text-[10px] text-brand-subtle font-medium ml-1">AED</span>
                  </p>
                  {deal.expected_close_date && (
                    <span className="text-[10px] text-brand-subtle flex items-center gap-1">
                      <Calendar size={10} /> {new Date(deal.expected_close_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            )}
          />
        ) : (
          <div className="pb-3">
            <DataTable<Deal, unknown> columns={dealColumns} data={filteredDeals} onRowClick={(deal) => setSelectedDeal(deal)} pageSize={20} />
          </div>
        )}
      </div>

      {/* New Deal Sheet */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-brand-white border-brand-border/50 p-0 flex flex-col gap-0">
          <div className="bg-brand-surface p-5 border-b border-brand-border/50 flex-shrink-0">
            <SheetHeader className="space-y-0 text-left">
              <div className="flex items-center gap-3 pr-6">
                <div className="h-10 w-10 rounded-xl bg-brand-accent-light dark:bg-brand-accent/20 flex items-center justify-center">
                  <Handshake size={20} className="text-brand-accent" />
                </div>
                <div>
                  <SheetTitle className="text-[16px] font-bold text-brand-primary">New Deal</SheetTitle>
                  <SheetDescription className="text-[13px] font-medium text-brand-subtle mt-0.5">
                    Track a sales opportunity through the pipeline.
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
          </div>

          <form onSubmit={handleSubmit(onCreateDeal)} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-5 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-brand-secondary ml-1">Deal Title *</Label>
                <Input {...register('title')} placeholder="e.g. Q3 Equipment Supply" className="h-[38px] text-[13px] rounded-lg" />
                {errors.title && <p className="text-[11px] text-brand-danger ml-1">{errors.title.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-brand-secondary ml-1">Link To</Label>
                <Controller
                  control={control}
                  name="linkType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-[38px] text-[13px] rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer"><div className="flex items-center gap-2"><Building2 size={14} /> Existing Customer</div></SelectItem>
                        <SelectItem value="lead"><div className="flex items-center gap-2"><UserCircle2 size={14} /> Lead (Prospect)</div></SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {linkType === 'customer' ? (
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-brand-secondary ml-1">Customer *</Label>
                  <Controller
                    control={control}
                    name="customer_id"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-[38px] text-[13px] rounded-lg">
                          <SelectValue placeholder="Select a customer..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[260px]">
                          {customers.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name} {c.company ? `— ${c.company}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.lead_id && <p className="text-[11px] text-brand-danger ml-1">{errors.lead_id.message}</p>}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-brand-secondary ml-1">Lead *</Label>
                  <Controller
                    control={control}
                    name="lead_id"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-[38px] text-[13px] rounded-lg">
                          <SelectValue placeholder="Select a lead..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[260px]">
                          {leads.map((l) => (
                            <SelectItem key={l.id} value={String(l.id)}>
                              {l.name} {l.company ? `— ${l.company}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.lead_id && <p className="text-[11px] text-brand-danger ml-1">{errors.lead_id.message}</p>}
                </div>
              )}

              {linkType === 'customer' && watchedCustomerId && contacts.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-brand-secondary ml-1">Contact (optional)</Label>
                  <Controller
                    control={control}
                    name="customer_contact_id"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-[38px] text-[13px] rounded-lg">
                          <SelectValue placeholder="Select a contact..." />
                        </SelectTrigger>
                        <SelectContent>
                          {contacts.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-brand-secondary ml-1">Value (AED)</Label>
                  <Input {...register('value')} type="number" step="0.01" min="0" placeholder="0.00" className="h-[38px] text-[13px] rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-brand-secondary ml-1">Expected Close</Label>
                  <Input {...register('expected_close_date')} type="date" className="h-[38px] text-[13px] rounded-lg" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-brand-secondary ml-1">Notes</Label>
                <Textarea {...register('description')} className="rounded-xl resize-none min-h-[90px] text-[13px]" placeholder="Deal context, requirements, next steps..." />
              </div>
            </div>

            <div className="p-6 pt-2 flex-shrink-0">
              <SheetFooter className="gap-2 sm:justify-end">
                <Button type="button" variant="ghost" onClick={() => setAddOpen(false)} className="rounded-lg text-[13px] font-medium">Cancel</Button>
                <Button type="submit" disabled={create.isPending} className="flex-1 h-[36px] rounded-lg text-[13px] font-medium shadow-sm">
                  {create.isPending ? <Spinner size={14} className="mr-2" /> : null} Create Deal
                </Button>
              </SheetFooter>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Deal Detail Sheet */}
      <Sheet open={!!selectedDeal} onOpenChange={(open) => !open && closeDealDetail()}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col gap-0 bg-brand-white border-brand-border/50">
          {selectedDeal && (
            <>
              <SheetHeader className="bg-brand-surface p-5 border-b border-brand-border/50 space-y-0 text-left flex-shrink-0">
                <div className="flex items-start justify-between pr-6">
                  <div>
                    <SheetTitle className="text-[16px] font-bold text-brand-primary">{selectedDeal.title}</SheetTitle>
                    <SheetDescription className="text-[13px] font-medium text-brand-subtle mt-0.5">
                      {selectedDeal.deal_code}
                    </SheetDescription>
                  </div>
                  <StatusBadge status={selectedDeal.stage} />
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div className="bg-brand-surface border border-brand-border/50 rounded-xl p-4">
                  <p className="text-[12px] font-medium text-brand-subtle flex items-center gap-1.5">
                    <Building2 size={12} /> {selectedDeal.customer?.company || selectedDeal.customer?.name || selectedDeal.lead?.company || selectedDeal.lead?.name || 'Unlinked'}
                  </p>
                  <p className="text-[16px] font-bold text-brand-primary mt-1">
                    {Number(selectedDeal.value).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[11px] font-medium text-brand-subtle">AED</span>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-brand-secondary ml-1">Stage</Label>
                  <Select
                    value={selectedDeal.stage}
                    onValueChange={(v) => {
                      update.mutate(
                        { id: selectedDeal.id, data: { stage: v } },
                        { onSuccess: () => setSelectedDeal((prev) => (prev ? { ...prev, stage: v as DealStage } : prev)) }
                      );
                    }}
                  >
                    <SelectTrigger className="h-[38px] text-[13px] rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="capitalize">{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedDeal.description && (
                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-medium text-brand-secondary ml-1">Notes</Label>
                    <p className="text-[13px] text-brand-secondary bg-brand-surface border border-brand-border/50 rounded-xl p-3 whitespace-pre-wrap">
                      {selectedDeal.description}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-[12px] font-medium text-brand-secondary ml-1">Log Activity</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {ACTIVITY_TYPES.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setActiveActivityType((prev) => (prev === id ? null : id))}
                        className={`flex items-center gap-1.5 px-3 h-[30px] rounded-full text-[12px] font-medium border transition-colors ${
                          activeActivityType === id
                            ? 'bg-brand-accent text-white border-brand-accent'
                            : 'bg-brand-surface text-brand-secondary border-brand-border/50 hover:bg-brand-accent-light'
                        }`}
                      >
                        <Icon size={13} /> {label}
                      </button>
                    ))}
                  </div>

                  {activeActivityType && (
                    <div className="p-3 bg-brand-surface border border-brand-border/50 rounded-xl space-y-2">
                      <Textarea
                        value={activityNotes}
                        onChange={(e) => setActivityNotes(e.target.value)}
                        placeholder={`Add ${activeActivityType} notes...`}
                        className="rounded-lg resize-none min-h-[60px] text-[13px]"
                      />
                      {activeActivityType === 'task' && (
                        <Input
                          type="date"
                          value={activityDueDate}
                          onChange={(e) => setActivityDueDate(e.target.value)}
                          className="h-[34px] text-[13px] rounded-lg w-auto"
                        />
                      )}
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setActiveActivityType(null);
                            setActivityNotes('');
                            setActivityDueDate('');
                          }}
                          className="h-[30px] text-[12px] rounded-lg"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={handleLogActivity}
                          disabled={addActivity.isPending}
                          className="h-[30px] text-[12px] rounded-lg"
                        >
                          {addActivity.isPending ? <Spinner size={12} className="mr-1.5" /> : null} Save
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-[12px] font-medium text-brand-secondary ml-1">Activity Timeline</Label>
                  {!dealDetail ? (
                    <div className="flex justify-center py-4">
                      <Spinner size={16} />
                    </div>
                  ) : (dealDetail.activities ?? []).length === 0 ? (
                    <p className="text-[12px] text-brand-subtle text-center py-3">No activity logged yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {[...(dealDetail.activities ?? [])].reverse().map((activity) => {
                        const meta = ACTIVITY_TYPES.find((t) => t.id === activity.type);
                        const Icon = meta?.icon ?? StickyNote;
                        return (
                          <div key={activity.id} className="flex gap-2.5 p-2.5 bg-brand-surface border border-brand-border/40 rounded-lg">
                            <div className="h-7 w-7 rounded-lg bg-brand-accent-light dark:bg-brand-accent/20 flex items-center justify-center shrink-0">
                              <Icon size={13} className="text-brand-accent" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[12px] font-semibold text-brand-primary capitalize">
                                  {meta?.label ?? activity.type}
                                </span>
                                {activity.created_at && (
                                  <span className="text-[10px] text-brand-subtle shrink-0">
                                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                  </span>
                                )}
                              </div>
                              {activity.notes && (
                                <p className="text-[12px] text-brand-secondary mt-0.5 whitespace-pre-wrap">{activity.notes}</p>
                              )}
                              {activity.user?.name && (
                                <p className="text-[10px] text-brand-subtle mt-1">by {activity.user.name}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
