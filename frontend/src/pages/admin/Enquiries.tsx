import { getBasePath } from '@/hooks/useBasePath';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { useAuthStore } from '@/store/useAuthStore';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useResourceMutation } from '@/hooks/useApi';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { timeAgo } from '@/lib/utils';
import type { Enquiry, Customer, User as UserType } from '@/types';
import { MessageSquare, Building2, Loader2, Plus, User as UserIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ResourceListingPage } from '@/components/shared/ResourceListingPage';
import { ActionGroup } from '@/components/shared/ActionGroup';

/**
 * Enquiries Module
 * Refactored to use the standardized State-Driven architecture.
 */
export const Enquiries = () => {

  const queryClient = useQueryClient();
  const admin = useAuthStore(state => state.admin);

  // Dialog & Sheet States
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  // View mode toggle between table and kanban
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  // Dynamic stages for kanban columns
  const [stages, setStages] = useState<string[]>(['new', 'in_progress', 'quoted', 'won', 'lost', 'closed']);

  const [addForm, setAddForm] = useState({
    customer_id: '', customer_name: '', customer_email: '', customer_phone: '', customer_company: '',
    source: 'portal', priority: 'normal', notes: ''
  });

  // Queries
  const { data: usersList = [] } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () => (await api.get(`${getBasePath()}/users?per_page=100`)).data.data as UserType[],
  });

  const { data: customersData = [] } = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: async () => (await api.get(`${getBasePath()}/customers?per_page=100`)).data.data as Customer[],
  });

  // Fetch all enquiries for kanban view
  const { data: enquiries = [] } = useQuery({
    queryKey: ['enquiries', 'all'],
    queryFn: async () => (await api.get(`${getBasePath()}/enquiries?per_page=1000`)).data.data as Enquiry[],
  });

  const { data: selectedEnquiry, isLoading: isEnquiryLoading } = useQuery({
    queryKey: ['enquiry', selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const res = await api.get(`${getBasePath()}/enquiries/${selectedId}`);
      return res.data;
    },
    enabled: !!selectedId && sheetOpen,
  });

  // CRUD Mutations
  const { create, update } = useResourceMutation('enquiries', [['enquiry', selectedId ? String(selectedId) : '']]);

  const assignMutation = useMutation({
    mutationFn: async ({ id, userId }: { id: number; userId: string }) =>
      api.put(`${getBasePath()}/enquiries/${id}/assign`, { assigned_to: userId || null }),
    onSuccess: (res) => {
      // Optimistic/Instant cache update across all paginated lists
      const updatedEnquiry = res.data;
      queryClient.setQueriesData({ queryKey: ['enquiries'] }, (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((enq: Enquiry) =>
            enq.id === updatedEnquiry.id ? updatedEnquiry : enq
          )
        };
      });
      // Also update the detail query if open
      queryClient.setQueryData(['enquiry', updatedEnquiry.id], updatedEnquiry);
      toast.success('Agent assigned to enquiry');
    },
    onError: () => toast.error('Failed to assign agent'),
  });

  const columns: ColumnDef<Enquiry>[] = useMemo(() => {
    const baseColumns: ColumnDef<Enquiry>[] = [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => (
          <span className="font-mono text-[11px] font-bold text-zeronix-blue bg-zeronix-blue/5 px-2 py-0.5 rounded border border-zeronix-blue/10">
            #ENQ{String(row.original.id).padStart(3, '0')}
          </span>
        ),
      },
      {
        accessorKey: 'customer',
        header: 'Lead Details',
        cell: ({ row }) => (
          <div className="max-w-[220px]">
            <p className="text-sm font-bold text-admin-text-primary truncate">{row.original.customer?.name || 'Manual Lead'}</p>
            {row.original.customer?.company && (
              <p className="text-[11px] text-admin-text-muted flex items-center gap-1 truncate font-medium uppercase">
                <Building2 size={10} /> {row.original.customer.company}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ row }) => <StatusBadge status={row.original.priority} />,
      },
      {
        accessorKey: 'created_at',
        header: 'Recieved',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-xs font-bold text-admin-text-primary uppercase tracking-tighter">
              {row.original.created_at ? timeAgo(row.original.created_at) : '—'}
            </span>
            <span className="text-[10px] text-admin-text-muted capitalize">{row.original.source}</span>
          </div>
        ),
      },
    ];

    if (admin?.role !== 'salesman') {
      baseColumns.push({
        accessorKey: 'assigned_to',
        header: 'Assigned Agent',
        cell: ({ row }) => {
          const enq = row.original;
          const assigned = enq.assignedUser;
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <Select
                value={String(enq.assigned_to || 'unassigned')}
                onValueChange={(v) => assignMutation.mutate({ id: enq.id, userId: v === 'unassigned' ? '' : v })}
              >
                <SelectTrigger className="h-8 text-[11px] font-bold bg-admin-bg border-admin-border rounded-lg w-36 focus:ring-zeronix-blue/10">
                  <SelectValue placeholder="Assign Lead…">
                    {assigned ? (
                      <span className="flex items-center gap-1.5">
                        <div className="h-4 w-4 rounded-full bg-zeronix-blue text-white flex items-center justify-center text-[8px] font-black uppercase">
                          {assigned.name[0]}
                        </div>
                        {assigned.name.split(' ')[0]}
                      </span>
                    ) : <span className="text-admin-text-muted opacity-50">UNASSIGNED</span>}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-admin-surface border-admin-border rounded-xl shadow-xl">
                  <SelectItem value="unassigned" className="text-xs font-bold text-admin-text-muted">UNASSIGNED</SelectItem>
                  {usersList.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)} className="text-xs font-medium">{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        },
      });
    }

    baseColumns.push({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <ActionGroup
          onView={() => { setSelectedId(row.original.id); setSheetOpen(true); }}
        />
      ),
    });

    return baseColumns;
  }, [admin?.role, usersList, assignMutation]);

  // ---------- Simple Native Kanban components ----------
  type KanbanCardProps = { enquiry: Enquiry; onClick: () => void };
  const KanbanCard = ({ enquiry, onClick }: KanbanCardProps) => {
    return (
      <div
        onClick={onClick}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', String(enquiry.id));
          e.dataTransfer.effectAllowed = 'move';
          setTimeout(() => {
            if (e.target && e.target instanceof HTMLElement) {
              e.target.classList.add('opacity-50');
            }
          }, 0);
        }}
        onDragEnd={(e) => {
          if (e.target && e.target instanceof HTMLElement) {
            e.target.classList.remove('opacity-50');
          }
        }}
        className="p-4 bg-admin-surface rounded-xl border border-admin-border cursor-grab active:cursor-grabbing hover:shadow-lg hover:border-zeronix-blue/30 transition-all flex flex-col gap-2"
      >
        <div className="flex justify-between items-start gap-2">
          <p className="font-bold text-sm text-admin-text-primary leading-tight">
            {enquiry.customer?.name || 'Manual Lead'}
          </p>
          <span className="text-[10px] font-black text-zeronix-blue bg-zeronix-blue/10 px-1.5 py-0.5 rounded">
            #{enquiry.id}
          </span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-[11px] font-medium text-admin-text-muted capitalize mr-1">
              {enquiry.source}
            </p>
            {/* Show dynamic tags if available, otherwise infer from status */}
            {['quoted', 'won', 'invoiced', 'closed'].includes(enquiry.status) && (
              <Badge variant="outline" className="text-[9px] px-1 h-4 bg-purple-500/10 text-purple-600 border-purple-500/20">QUOTED</Badge>
            )}
            {['won', 'invoiced', 'closed'].includes(enquiry.status) && (
              <Badge variant="outline" className="text-[9px] px-1 h-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">INVOICED</Badge>
            )}
          </div>
          <StatusBadge status={enquiry.priority} className="scale-75 origin-right" />
        </div>
      </div>
    );
  };

  type KanbanBoardProps = {
    enquiries: Enquiry[];
    stages: string[];
    onCardMove: (cardId: number, newStage: string) => void;
    onCardClick: (cardId: number) => void;
  };
  const KanbanBoard = ({ enquiries, stages, onCardMove, onCardClick }: KanbanBoardProps) => {
    return (
      <div className="flex overflow-x-auto gap-4 p-2 pb-6 min-h-[500px]">
        {stages.map((stage) => {
          const cards = enquiries.filter((e) => e.status === stage);
          return (
            <div
              key={stage}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                e.currentTarget.classList.add('bg-admin-surface-hover', 'border-zeronix-blue/40');
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('bg-admin-surface-hover', 'border-zeronix-blue/40');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('bg-admin-surface-hover', 'border-zeronix-blue/40');
                const cardId = Number(e.dataTransfer.getData('text/plain'));
                if (cardId && onCardMove) {
                  onCardMove(cardId, stage);
                }
              }}
              className="w-[320px] flex-shrink-0 flex flex-col bg-admin-bg rounded-2xl p-4 border border-admin-border transition-colors duration-200"
            >
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-sm font-black capitalize tracking-wider text-admin-text-primary flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    stage === 'new' ? 'bg-blue-500' :
                    stage === 'in_progress' ? 'bg-amber-500' :
                    stage === 'quoted' ? 'bg-purple-500' :
                    stage === 'won' ? 'bg-emerald-500' :
                    stage === 'lost' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`} />
                  {stage.replace('_', ' ')}
                </h2>
                <Badge variant="secondary" className="text-[10px] font-black h-5 px-1.5 bg-admin-surface border-admin-border">
                  {cards.length}
                </Badge>
              </div>
              
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {cards.length === 0 && (
                  <div className="h-24 rounded-xl border border-dashed border-admin-border/50 flex items-center justify-center">
                    <p className="text-[11px] font-bold text-admin-text-muted italic">Drop here</p>
                  </div>
                )}
                {cards.map((enq) => (
                  <KanbanCard key={enq.id} enquiry={enq} onClick={() => onCardClick(enq.id)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  return (
    <>
      {/* Control Bar */}
      <div className="flex items-center justify-between mb-4">
    <h1 className="text-2xl font-bold text-admin-text-primary">Enquiries</h1>
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === 'table' ? 'kanban' : 'table')}>
        {viewMode === 'table' ? 'Kanban View' : 'Table View'}
      </Button>
      {viewMode === 'kanban' && (
        <Button variant="secondary" size="sm" onClick={() => {
          const name = prompt('Enter new stage name');
          if (name) setStages([...stages, name.trim()]);
        }}>
          Add Stage
        </Button>
      )}
    </div>
  </div>

  {
    viewMode === 'table' ? (
      <ResourceListingPage<Enquiry>
        resource="enquiries"
        title="Enquiry Hub"
        subtitle={admin?.role === 'salesman' ? "Process your incoming leads and convert them to quotes." : "Process incoming leads, assign agents, and convert to quotes."}
        icon={<MessageSquare size={20} />}
        columns={columns}
        onRowClick={(row) => { setSelectedId(row.id); setSheetOpen(true); }}
        createLabel="Add Enquiry"
        createPath="#" // Using modal
        onCreateClick={() => setAddOpen(true)}
        searchPlaceholder="Search leads by name, company, or ID..."
        filters={[
          {
            name: 'status',
            label: 'Status',
            placeholder: 'Filter status',
            options: [
              { label: 'New', value: 'new' },
              { label: 'In Progress', value: 'in_progress' },
              { label: 'Quoted', value: 'quoted' },
              { label: 'Won', value: 'won' },
              { label: 'Lost', value: 'lost' },
              { label: 'Closed', value: 'closed' },
            ]
          },
          {
            name: 'priority',
            label: 'Priority',
            placeholder: 'Filter priority',
            options: [
              { label: 'Normal', value: 'normal' },
              { label: 'High', value: 'high' },
              { label: 'Urgent', value: 'urgent' },
            ]
          },
          {
            name: 'source',
            label: 'Source',
            placeholder: 'Filter source',
            options: [
              { label: 'Portal', value: 'portal' },
              { label: 'Email', value: 'email' },
              { label: 'WhatsApp', value: 'whatsapp' },
              { label: 'Phone', value: 'phone' },
            ]
          }
        ]}
      />
    ) : (
      <KanbanBoard
        enquiries={enquiries}
        stages={stages}
        onCardMove={(cardId, newStage) => {
          update.mutate({ id: cardId, data: { status: newStage } });
        }}
        onCardClick={(cardId) => { setSelectedId(cardId); setSheetOpen(true); }}
      />)
  }

  <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
    <DialogContent className="sm:max-w-lg bg-admin-surface border-admin-border p-0 overflow-hidden shadow-2xl rounded-3xl">
      {isEnquiryLoading ? (
        <div className="flex justify-center items-center w-full h-80">
          <Loader2 className="animate-spin text-zeronix-blue" size={40} />
        </div>
      ) : selectedEnquiry && (
        <div className="flex flex-col h-full max-h-[85vh]">
          {/* Premium Glass Header */}
          <div className="p-5 pb-4 border-b border-admin-border bg-admin-bg/40 backdrop-blur-md sticky top-0 z-20">
            <DialogHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-zeronix-blue/10 flex items-center justify-center border border-zeronix-blue/20">
                    <MessageSquare size={20} className="text-zeronix-blue" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-black text-admin-text-primary flex items-center gap-2">
                      <span className="text-zeronix-blue">ENQ</span>
                      <span className="opacity-30">/</span>
                      <span>{String(selectedEnquiry.id).padStart(3, '0')}</span>
                    </DialogTitle>
                    <DialogDescription className="text-[10px] font-black text-admin-text-muted uppercase tracking-widest">
                      Lead Management Console
                    </DialogDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <StatusBadge status={selectedEnquiry.status} />
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="flex-1 p-5 space-y-6 overflow-y-auto">
            {/* Core Workflow Controls */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-admin-text-muted mb-1">
                <div className="h-1 w-3 bg-zeronix-blue rounded-full" />
                <h4 className="text-[10px] font-black uppercase tracking-widest">Workflow & Priority</h4>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-admin-text-muted ml-1">Current Status</Label>
                  <Select value={selectedEnquiry.status} onValueChange={(v) => {
                    update.mutate({ id: selectedId!, data: { status: v as any } });
                    toast.success(`Status updated to ${v.replace('_', ' ')}`);
                  }}>
                    <SelectTrigger className="h-12 bg-admin-bg/50 border-admin-border text-admin-text-primary rounded-xl font-bold hover:border-zeronix-blue/30 transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-admin-surface border-admin-border rounded-xl">
                      {['new', 'in_progress', 'quoted', 'delivered', 'closed', 'won', 'lost', 'cancelled'].map(s => (
                        <SelectItem key={s} value={s} className="capitalize font-bold text-sm">{s.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-admin-text-muted ml-1">Urgency Level</Label>
                  <Select value={selectedEnquiry.priority} onValueChange={(v) => {
                    update.mutate({ id: selectedId!, data: { priority: v as any } });
                    toast.success(`Priority updated to ${v}`);
                  }}>
                    <SelectTrigger className="h-12 bg-admin-bg/50 border-admin-border text-admin-text-primary rounded-xl font-bold hover:border-zeronix-blue/30 transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-admin-surface border-admin-border rounded-xl">
                      {['normal', 'high', 'urgent'].map(p => (
                        <SelectItem key={p} value={p} className="capitalize font-bold text-sm">{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Customer Details Segment */}
            <section className="space-y-3">
               <div className="flex items-center gap-2 text-admin-text-muted mb-1">
                <div className="h-1 w-3 bg-purple-500 rounded-full" />
                <h4 className="text-[10px] font-black uppercase tracking-widest">Client Identification</h4>
              </div>
              <div className="bg-admin-bg/30 border border-admin-border rounded-2xl p-5 flex items-center gap-5">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-zeronix-blue/20 to-purple-500/20 flex items-center justify-center text-admin-text-primary text-xl font-black border border-white/5">
                  {selectedEnquiry.customer?.name?.[0] || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-admin-text-primary text-lg">{selectedEnquiry.customer?.name || 'Manual Lead'}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs font-bold text-admin-text-muted flex items-center gap-1.5">
                      <Building2 size={13} className="text-zeronix-blue" /> {selectedEnquiry.customer?.company || 'Personal Account'}
                    </p>
                    <div className="h-1 w-1 bg-admin-border rounded-full" />
                    <p className="text-xs font-bold text-admin-text-muted">
                      Source: <span className="text-admin-text-primary capitalize">{selectedEnquiry.source}</span>
                    </p>
                  </div>
                </div>
              </div>
            </section>



            {/* Operational Notes Segment */}
            <section className="space-y-3 pb-2">
              <div className="flex items-center gap-2 text-admin-text-muted mb-1">
                <div className="h-1 w-3 bg-green-500 rounded-full" />
                <h4 className="text-[10px] font-black uppercase tracking-widest">Internal Collaboration</h4>
              </div>
              <div className="space-y-3">
                <Textarea
                  defaultValue={selectedEnquiry.notes || ''}
                  id="enquiry-notes"
                  className="bg-admin-bg/30 border-admin-border text-admin-text-primary focus:border-zeronix-blue focus:ring-zeronix-blue/5 rounded-2xl min-h-[140px] resize-none text-sm font-medium p-4"
                  placeholder="Type internal notes, quality assessments, or follow-up details..."
                />
                <Button
                  onClick={() => {
                    const notes = (document.getElementById('enquiry-notes') as HTMLTextAreaElement).value;
                    update.mutate({ id: selectedId!, data: { notes } });
                    toast.success('Internal notes updated successfully');
                  }}
                  disabled={update.isPending}
                  className="w-full bg-admin-surface border border-admin-border text-admin-text-primary hover:bg-admin-bg/50 h-11 rounded-xl font-black text-xs tracking-widest shadow-sm"
                >
                  {update.isPending ? <Loader2 className="animate-spin" size={16} /> : 'UPDATE INTERNAL LOG'}
                </Button>
              </div>
            </section>
          </div>
        </div>
      )}
    </DialogContent>
  </Dialog>

  {/* Add Enquiry Dialog */ }
  <Dialog open={addOpen} onOpenChange={setAddOpen}>
    <DialogContent className="bg-admin-surface border-admin-border sm:max-w-lg rounded-3xl shadow-2xl overflow-hidden p-0">
      <div className="bg-admin-bg/30 p-6 border-b border-admin-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-admin-text-primary flex items-center gap-2">
            <Plus size={24} className="text-zeronix-blue" />
            NEW LEAD
          </DialogTitle>
          <DialogDescription className="text-xs font-bold text-admin-text-muted uppercase tracking-widest">
            Capture manual enquiries from calls or external emails.
          </DialogDescription>
        </DialogHeader>
      </div>

      <div className="p-6 space-y-8">
        {/* SECTION 1: CONTACT INFO */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-zeronix-blue/10 flex items-center justify-center">
                <UserIcon size={14} className="text-zeronix-blue" />
              </div>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-admin-text-primary">Lead Origin</h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsNewCustomer(!isNewCustomer)}
              className="h-7 px-3 text-[10px] font-black bg-zeronix-blue/10 text-zeronix-blue hover:bg-zeronix-blue/20 rounded-full transition-all"
            >
              {isNewCustomer ? 'CHOOSE EXISTING CLIENT' : 'ADD AS NEW LEAD'}
            </Button>
          </div>

          {isNewCustomer ? (
            <div className="grid grid-cols-2 gap-4 p-5 bg-admin-bg/50 rounded-2xl border border-admin-border border-dashed">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-admin-text-muted uppercase tracking-tighter">Full Name *</Label>
                <Input value={addForm.customer_name} onChange={e => setAddForm({ ...addForm, customer_name: e.target.value })} className="h-10 text-sm bg-admin-surface border-admin-border rounded-xl focus:ring-zeronix-blue/10" placeholder="John Doe" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-admin-text-muted uppercase tracking-tighter">Email *</Label>
                <Input type="email" value={addForm.customer_email} onChange={e => setAddForm({ ...addForm, customer_email: e.target.value })} className="h-10 text-sm bg-admin-surface border-admin-border rounded-xl focus:ring-zeronix-blue/10" placeholder="john@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-admin-text-muted uppercase tracking-tighter">Company</Label>
                <Input value={addForm.customer_company} onChange={e => setAddForm({ ...addForm, customer_company: e.target.value })} className="h-10 text-sm bg-admin-surface border-admin-border rounded-xl focus:ring-zeronix-blue/10" placeholder="Acme Corp" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-admin-text-muted uppercase tracking-tighter">Phone</Label>
                <Input value={addForm.customer_phone} onChange={e => setAddForm({ ...addForm, customer_phone: e.target.value })} className="h-10 text-sm bg-admin-surface border-admin-border rounded-xl focus:ring-zeronix-blue/10" placeholder="+971..." />
              </div>
            </div>
          ) : (
            <Select value={addForm.customer_id} onValueChange={(v) => setAddForm({ ...addForm, customer_id: v })}>
              <SelectTrigger className="h-12 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl font-bold shadow-sm">
                <SelectValue placeholder="Search existing client profiles..." />
              </SelectTrigger>
              <SelectContent className="bg-admin-surface border-admin-border rounded-xl max-h-[300px]">
                {customersData.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)} className="font-medium text-sm">
                    {c.name} {c.company ? `— ${c.company}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Separator className="bg-admin-border/50" />

        {/* SECTION 2: ENQUIRY DETAILS */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <MessageSquare size={14} className="text-purple-500" />
            </div>
            <h4 className="text-[11px] font-black uppercase tracking-widest text-admin-text-primary">Enquiry Details</h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-admin-text-muted uppercase tracking-tighter">Channel Source</Label>
              <Select value={addForm.source} onValueChange={(v) => setAddForm({ ...addForm, source: v })}>
                <SelectTrigger className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-admin-surface border-admin-border rounded-xl">
                  {['portal', 'email', 'phone', 'whatsapp', 'referral', 'chat'].map(s => (
                    <SelectItem key={s} value={s} className="capitalize font-medium text-sm">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-admin-text-muted uppercase tracking-tighter">Initial Priority</Label>
              <Select value={addForm.priority} onValueChange={(v) => setAddForm({ ...addForm, priority: v })}>
                <SelectTrigger className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-admin-surface border-admin-border rounded-xl">
                  {['normal', 'high', 'urgent'].map(p => (
                    <SelectItem key={p} value={p} className="capitalize font-medium text-sm">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black text-admin-text-muted uppercase tracking-tighter">Requirements & Notes</Label>
            <Textarea
              value={addForm.notes}
              onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
              className="bg-admin-bg border-admin-border text-admin-text-primary rounded-2xl resize-none min-h-[120px] text-sm font-medium focus:ring-zeronix-blue/10"
              placeholder="Describe what the client is looking for in detail..."
            />
          </div>
        </div>
      </div>

      <div className="p-6 pt-2">
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => setAddOpen(false)} className="rounded-xl font-bold">CANCEL</Button>
          <Button
            onClick={() => {
              const payload: any = { ...addForm };
              if (isNewCustomer) {
                delete payload.customer_id;
              } else {
                payload.customer_id = Number(addForm.customer_id);
                delete payload.customer_name;
                delete payload.customer_email;
                delete payload.customer_phone;
                delete payload.customer_company;
              }
              create.mutate(payload, {
                onSuccess: () => {
                  setAddOpen(false);
                  setIsNewCustomer(false);
                  setAddForm({ customer_id: '', customer_name: '', customer_email: '', customer_phone: '', customer_company: '', source: 'portal', priority: 'normal', notes: '' });
                }
              });
            }}
            disabled={create.isPending || (isNewCustomer ? (!addForm.customer_name || !addForm.customer_email) : !addForm.customer_id)}
            className="flex-1 bg-zeronix-blue text-white hover:bg-zeronix-blue-hover h-12 rounded-xl font-black shadow-lg shadow-zeronix-blue/20"
          >
            {create.isPending ? <Loader2 className="animate-spin" /> : 'REGISTER ENQUIRY'}
          </Button>
        </DialogFooter>
      </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
