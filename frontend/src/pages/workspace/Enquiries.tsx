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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { timeAgo } from '@/lib/utils';
import type { Enquiry, Customer, User as UserType } from '@/types';
import { MessageSquare, Building2, Plus, User as UserIcon, ArrowDown, ArrowUp, Zap, Phone, Mail, Globe, MessageCircle, LayoutList, Kanban, ArrowRightLeft } from 'lucide-react';
import { Spinner } from '@/components/shared/Spinner';
import { ResourceListingPage } from '@/components/shared/ResourceListingPage';
import Avatar from 'boring-avatars';
import { useThemeStore } from '@/store/useThemeStore';

import { Badge } from '@/components/ui/badge';
import { ActionGroup } from '@/components/shared/ActionGroup';

/**
 * Enquiries Module
 * Refactored to use the standardized State-Driven architecture.
 */
export const Enquiries = () => {

  const { theme } = useThemeStore();
  const avatarColors = theme === 'dark' 
    ? ['#ff4d6d', '#ff758f', '#ffbe0b', '#fdfcdc', '#48cae4']
    : ['#cc063e', '#e83535', '#fd9407', '#e2d9c2', '#10898b'];

  const queryClient = useQueryClient();
  const admin = useAuthStore(state => state.admin);

  // Dialog & Sheet States
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  // View mode toggle between table and kanban
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  // Dynamic stages for kanban columns
  const [stages, setStages] = useState<string[]>(['new', 'in_progress', 'quoted', 'won', 'lost', 'closed']);

  const [activeTab, setActiveTab] = useState('all');
  const enquiryTabs = [
    { id: 'all', label: 'All Leads' },
    { id: 'new', label: 'New' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'quoted', label: 'Quoted' },
    { id: 'won', label: 'Won' },
    { id: 'lost', label: 'Lost' },
    { id: 'closed', label: 'Closed' },
  ];

  const [addForm, setAddForm] = useState({
    customer_id: '', customer_name: '', customer_email: '', customer_phone: '', customer_company: '',
    source: 'manual', priority: 'normal', notes: ''
  });

  // Queries
  const { data: usersList = [] } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () => (await api.get(`/admin/users?per_page=100`)).data.data as UserType[],
  });

  const { data: customersData = [] } = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: async () => (await api.get(`/admin/customers?per_page=100`)).data.data as Customer[],
  });

  // Fetch all enquiries for kanban view
  const { data: enquiries = [] } = useQuery({
    queryKey: ['enquiries', 'all'],
    queryFn: async () => (await api.get(`/admin/enquiries?per_page=1000`)).data.data as Enquiry[],
  });

  const { data: selectedEnquiry, isLoading: isEnquiryLoading } = useQuery({
    queryKey: ['enquiry', selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const res = await api.get(`/admin/enquiries/${selectedId}`);
      return res.data;
    },
    enabled: !!selectedId && sheetOpen,
  });

  // CRUD Mutations
  const { create, update } = useResourceMutation('enquiries', [['enquiry', selectedId ? String(selectedId) : '']]);

  const assignMutation = useMutation({
    mutationFn: async ({ id, userIds }: { id: number; userIds: number[] }) =>
      api.put(`/admin/enquiries/${id}/assign`, { user_ids: userIds }),
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

  const convertMutation = useMutation({
    mutationFn: async (leadId: number) => (await api.post(`/admin/leads/${leadId}/convert`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['enquiry', selectedId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead converted to Customer');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to convert lead'),
  });

  const columns: ColumnDef<Enquiry>[] = useMemo(() => {
    const baseColumns: ColumnDef<Enquiry>[] = [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => (
          <span className="font-mono text-[11px] font-bold text-brand-accent bg-brand-accent/5 px-2 py-0.5 rounded border border-brand-accent/10">
            #ENQ{String(row.original.id).padStart(3, '0')}
          </span>
        ),
      },
      {
        accessorKey: 'customer',
        header: 'Lead Details',
        cell: ({ row }) => (
          <div className="max-w-[220px]">
            <p className="text-[13px] font-semibold text-brand-primary truncate">{row.original.customer?.name || row.original.lead?.name || 'Unknown'}</p>
            {(row.original.customer?.company || row.original.lead?.company) && (
              <p className="text-[11px] text-brand-subtle flex items-center gap-1.5 truncate font-medium uppercase mt-0.5">
                <Building2 size={12} /> {row.original.customer?.company || row.original.lead?.company}
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
        header: 'Received',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-[12px] font-semibold text-brand-secondary">
              {row.original.created_at ? timeAgo(row.original.created_at) : '—'}
            </span>
            <span className="text-[11px] text-brand-subtle capitalize mt-0.5">{row.original.source}</span>
          </div>
        ),
      },
      {
        accessorKey: 'items_count',
        header: 'Items',
        cell: ({ row }) => (
          <div className="text-[12px] font-bold text-brand-secondary">
            {row.original.items_count || 0} <span className="text-[10px] text-brand-subtle font-medium ml-0.5">Items</span>
          </div>
        ),
      },
      {
        accessorKey: 'notes',
        header: 'Notes',
        cell: ({ row }) => (
          <div className="max-w-[150px] truncate text-[11px] text-brand-secondary" title={row.original.notes || ''}>
            {row.original.notes || <span className="italic text-brand-subtle">No notes</span>}
          </div>
        ),
      },
    ];

    if (admin?.role !== 'salesman') {
      baseColumns.push({
        accessorKey: 'assigned_to',
        header: 'Assigned Agent',
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
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm text-admin-text-primary leading-tight truncate">
              {enquiry.customer?.name || enquiry.lead?.name || 'Unknown'}
            </p>
            {(enquiry.customer?.company || enquiry.lead?.company) && (
              <p className="text-[11px] text-brand-subtle flex items-center gap-1 mt-0.5 truncate font-medium">
                <Building2 size={10} /> {enquiry.customer?.company || enquiry.lead?.company}
              </p>
            )}
          </div>
          <span className="text-[10px] font-black text-zeronix-blue bg-zeronix-blue/10 px-1.5 py-0.5 rounded shrink-0">
            #{enquiry.id}
          </span>
        </div>

        {enquiry.notes && (
          <p className="text-[11px] text-brand-secondary line-clamp-2 leading-relaxed" title={enquiry.notes}>
            {enquiry.notes}
          </p>
        )}

        <div className="flex justify-between items-end mt-1 pt-2 border-t border-brand-border/30">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-[10px] font-medium text-admin-text-muted capitalize mr-1">
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

            {/* Avatars */}
            {admin?.role !== 'salesman' && enquiry.assigned_users && enquiry.assigned_users.length > 0 && (
              <div className="flex -space-x-1.5 mt-1">
                {enquiry.assigned_users.slice(0, 3).map((u: any, i: number) => (
                  <div key={u.id} className="relative border border-brand-white rounded-full bg-brand-surface shadow-sm" style={{ zIndex: 10 - i }}>
                    <Avatar size={20} name={u.name} variant="beam" colors={avatarColors} />
                  </div>
                ))}
                {enquiry.assigned_users.length > 3 && (
                  <div className="relative z-0 h-[20px] w-[20px] rounded-full bg-brand-surface border border-brand-border/50 flex items-center justify-center text-[8px] font-bold text-brand-subtle shadow-sm cursor-default">
                    +{enquiry.assigned_users.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
          <StatusBadge status={enquiry.priority} className="scale-[0.8] origin-bottom-right" />
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
                  <div className={`w-2 h-2 rounded-full ${stage === 'new' ? 'bg-blue-500' :
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
      <ResourceListingPage<Enquiry>
        resource="enquiries"
        title="Enquiry Hub"
        subtitle={admin?.role === 'salesman' ? "Process your incoming leads and convert them to quotes." : "Process incoming leads, assign agents, and convert to quotes."}
        icon={<MessageSquare size={20} />}
        columns={columns}
        onRowClick={(row) => { setSelectedId(row.id); setSheetOpen(true); }}
        createLabel="Add Enquiry"
        createPath="#" // Using modal
        onCreateClick={() => {
          setIsEditing(false);
          setIsNewCustomer(false);
          setAddForm({ customer_id: '', customer_name: '', customer_email: '', customer_phone: '', customer_company: '', source: 'manual', priority: 'normal', notes: '' });
          setAddOpen(true);
        }}
        searchPlaceholder="Search leads by name, company, or ID..."
        tabs={enquiryTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        baseFilters={{ status: activeTab !== 'all' ? activeTab : undefined }}
        extraActions={
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === 'table' ? 'kanban' : 'table')} className="h-[34px] w-[34px] text-brand-secondary hover:text-brand-primary border-brand-border/50 bg-brand-surface shadow-sm">
                    {viewMode === 'table' ? <Kanban size={16} /> : <LayoutList size={16} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Switch to {viewMode === 'table' ? 'Kanban' : 'Table'} View</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {viewMode === 'kanban' && (
              <Button variant="secondary" size="sm" onClick={() => {
                const name = prompt('Enter new stage name');
                if (name) setStages([...stages, name.trim()]);
              }} className="h-[34px] px-3 font-medium text-[13px] bg-brand-surface border border-brand-border/50 hover:bg-brand-bg text-brand-primary">
                Add Stage
              </Button>
            )}
          </div>
        }
        customContent={
          viewMode === 'kanban' ? (
            <div className="h-full min-h-[500px]">
              <KanbanBoard
                enquiries={enquiries}
                stages={stages}
                onCardMove={(cardId, newStage) => {
                  update.mutate({ id: cardId, data: { status: newStage } });
                }}
                onCardClick={(cardId) => { setSelectedId(cardId); setSheetOpen(true); }}
              />
            </div>
          ) : undefined
        }
      />

      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent className="sm:max-w-lg bg-brand-white border-brand-border/50 p-0 overflow-hidden shadow-xl rounded-xl">
          {isEnquiryLoading ? (
            <div className="flex justify-center items-center w-full h-80">
              <Spinner size={40} className="text-brand-accent" />
            </div>
          ) : selectedEnquiry && (
            <div className="flex flex-col h-full max-h-[85vh]">
              {/* Premium Glass Header */}
              <div className="p-5 pb-4 border-b border-brand-border/50 bg-brand-surface sticky top-0 z-20">
                <DialogHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-brand-accent-light dark:bg-brand-accent/20 flex items-center justify-center">
                        <MessageSquare size={20} className="text-brand-accent" />
                      </div>
                      <div>
                        <DialogTitle className="text-[16px] font-semibold text-brand-primary flex items-center gap-2">
                          <span className="text-brand-accent">ENQ</span>
                          <span className="opacity-30">/</span>
                          <span>{String(selectedEnquiry.id).padStart(3, '0')}</span>
                        </DialogTitle>
                        <DialogDescription className="text-[13px] font-medium text-brand-subtle mt-0.5">
                          Lead Management Console
                        </DialogDescription>
                      </div>
                    </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-[28px] text-[11px] font-medium border-brand-border/50 text-brand-secondary"
                          onClick={() => {
                            setIsEditing(true);
                            setAddForm({
                              customer_id: String(selectedEnquiry.customer_id || ''),
                              customer_name: '', customer_email: '', customer_phone: '', customer_company: '',
                              source: selectedEnquiry.source || 'portal',
                              priority: selectedEnquiry.priority || 'normal',
                              notes: selectedEnquiry.notes || ''
                            });
                            setIsNewCustomer(false);
                            setAddOpen(true);
                          }}
                        >
                          Edit Lead
                        </Button>
                        <StatusBadge status={selectedEnquiry.status} />
                      </div>
                  </div>
                </DialogHeader>
              </div>

              <div className="flex-1 p-5 space-y-6 overflow-y-auto">
                {/* Core Workflow Controls */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-brand-secondary mb-1">
                    <div className="h-1.5 w-3 bg-brand-accent rounded-full" />
                    <h4 className="text-[13px] font-semibold text-brand-primary">Workflow & Priority</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-[12px] font-medium text-brand-secondary ml-1">Current Status</Label>
                      <Select value={selectedEnquiry.status} onValueChange={(v) => {
                        update.mutate({ id: selectedId!, data: { status: v as any } });
                        toast.success(`Status updated to ${v.replace('_', ' ')}`);
                      }}>
                        <SelectTrigger className="h-[36px] bg-brand-surface border-brand-border/50 text-brand-primary rounded-lg font-medium text-[13px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-brand-white border-brand-border/50 rounded-xl shadow-lg">
                          {['new', 'assigned', 'in_progress', 'quoted', 'won', 'lost', 'closed', 'cancelled'].map(s => (
                            <SelectItem key={s} value={s} className="capitalize font-medium text-[13px]">{s.replace('_', ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[12px] font-medium text-brand-secondary ml-1">Urgency Level</Label>
                      <Select value={selectedEnquiry.priority} onValueChange={(v) => {
                        update.mutate({ id: selectedId!, data: { priority: v as any } });
                        toast.success(`Priority updated to ${v}`);
                      }}>
                        <SelectTrigger className="h-[36px] bg-brand-surface border-brand-border/50 text-brand-primary rounded-lg font-medium text-[13px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-brand-white border-brand-border/50 rounded-xl shadow-lg">
                          {['normal', 'high', 'urgent'].map(p => (
                            <SelectItem key={p} value={p} className="capitalize font-medium text-[13px]">{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                {/* Team Assignment Segment */}
                {admin?.role !== 'salesman' && (
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-brand-secondary mb-1">
                        <div className="h-1.5 w-3 bg-brand-warning rounded-full" />
                        <h4 className="text-[13px] font-semibold text-brand-primary">Team Assignment</h4>
                      </div>
                      <span className="text-[11px] font-medium text-brand-subtle">
                        {selectedEnquiry.assigned_users?.length || 0} agents attached
                      </span>
                    </div>
                    <div className="bg-brand-surface border border-brand-border/50 rounded-xl p-3">
                      <div className="flex flex-wrap gap-2">
                        {usersList.map((u) => {
                          const isAssigned = selectedEnquiry.assigned_users?.some((au: any) => au.id === u.id);
                          return (
                            <button
                              key={u.id}
                              onClick={() => {
                                const currentIds = selectedEnquiry.assigned_users?.map((au: any) => au.id) || [];
                                const newIds = isAssigned 
                                  ? currentIds.filter((id: number) => id !== u.id)
                                  : [...currentIds, u.id];
                                assignMutation.mutate({ id: selectedId!, userIds: newIds });
                              }}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                                isAssigned 
                                  ? 'bg-brand-primary border-brand-primary shadow-md scale-105' 
                                  : 'bg-brand-white border-brand-border/50 hover:border-brand-primary/30 opacity-70 hover:opacity-100'
                              }`}
                            >
                              <div className={`transition-transform ${isAssigned ? 'scale-110' : ''}`}>
                                <Avatar size={18} name={u.name} variant="beam" colors={avatarColors} />
                              </div>
                              <span className={`text-[11px] font-bold ${isAssigned ? 'text-brand-white' : 'text-brand-secondary'}`}>
                                {u.name.split(' ')[0]}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                )}
                {/* Customer Details Segment */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-brand-secondary mb-1">
                    <div className="h-1.5 w-3 bg-brand-info rounded-full" />
                    <h4 className="text-[13px] font-semibold text-brand-primary">Client Identification</h4>
                  </div>
                  <div className="bg-brand-surface border border-brand-border/50 rounded-xl p-5 flex items-center gap-5">
                    <Avatar
                      size={48}
                      name={selectedEnquiry.customer?.name || selectedEnquiry.lead?.name || 'Unknown'}
                      variant="marble"
                      colors={avatarColors}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-brand-primary text-[14px]">{selectedEnquiry.customer?.name || selectedEnquiry.lead?.name || 'Unknown'}</p>
                        {!selectedEnquiry.customer_id && selectedEnquiry.lead_id && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-brand-warning bg-brand-warning-bg px-1.5 py-0.5 rounded">
                            Lead
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-[12px] font-medium text-brand-subtle flex items-center gap-1.5">
                          <Building2 size={12} className="text-brand-info" /> {selectedEnquiry.customer?.company || selectedEnquiry.lead?.company || 'Personal Account'}
                        </p>
                        <div className="h-1 w-1 bg-brand-border rounded-full" />
                        <p className="text-[12px] font-medium text-brand-subtle">
                          Source: <span className="text-brand-primary capitalize">{selectedEnquiry.source}</span>
                        </p>
                      </div>
                    </div>
                    {!selectedEnquiry.customer_id && selectedEnquiry.lead_id && (
                      <Button
                        size="sm"
                        onClick={() => convertMutation.mutate(selectedEnquiry.lead_id!)}
                        disabled={convertMutation.isPending}
                        className="h-[32px] px-3 text-[12px] font-medium bg-brand-accent text-brand-white hover:opacity-90 rounded-lg shrink-0"
                      >
                        {convertMutation.isPending ? <Spinner size={14} className="mr-1.5" /> : <ArrowRightLeft size={13} className="mr-1.5" />}
                        Convert to Customer
                      </Button>
                    )}
                  </div>
                </section>

                {/* Operational Notes Segment */}
                <section className="space-y-3 pb-2">
                  <div className="flex items-center gap-2 text-brand-secondary mb-1">
                    <div className="h-1.5 w-3 bg-brand-success rounded-full" />
                    <h4 className="text-[13px] font-semibold text-brand-primary">Internal Collaboration</h4>
                  </div>
                  <div className="space-y-3">
                    <Textarea
                      defaultValue={selectedEnquiry.notes || ''}
                      id="enquiry-notes"
                      className="bg-brand-surface border-brand-border/50 text-brand-primary focus:ring-1 focus:ring-brand-accent/30 rounded-xl min-h-[120px] resize-none text-[13px] p-4"
                      placeholder="Type internal notes, quality assessments, or follow-up details..."
                    />
                    <Button
                      onClick={() => {
                        const notes = (document.getElementById('enquiry-notes') as HTMLTextAreaElement).value;
                        update.mutate({ id: selectedId!, data: { notes } });
                        toast.success('Internal notes updated successfully');
                      }}
                      disabled={update.isPending}
                      className="w-full bg-brand-primary text-brand-white hover:opacity-90 h-[36px] rounded-lg font-medium text-[13px] shadow-sm"
                    >
                      {update.isPending ? <Spinner className="mr-2" size={14} /> : null} Sync Internal Log
                    </Button>
                  </div>
                </section>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Enquiry Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-brand-white border-brand-border/50 sm:max-w-lg rounded-2xl shadow-2xl overflow-hidden p-0">
          {/* Premium Header */}
          <div className="bg-brand-surface p-5 border-b border-brand-border/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <MessageSquare size={100} />
            </div>
            <DialogHeader className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand-accent-light dark:bg-brand-accent/20 flex items-center justify-center">
                  <Plus size={20} className="text-brand-accent" />
                </div>
                <div>
                  <DialogTitle className="text-[16px] font-bold text-brand-primary">
                    {isEditing ? 'Edit Lead Details' : 'Register New Lead'}
                  </DialogTitle>
                  <DialogDescription className="text-[13px] font-medium text-brand-subtle mt-0.5">
                    {isEditing ? 'Update client linkage and core details.' : 'Capture manual enquiries from calls or external channels.'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-5 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* SECTION 1: CONTACT INFO */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-secondary mb-1">
                  <div className="h-1.5 w-3 bg-brand-info rounded-full" />
                  <h4 className="text-[13px] font-semibold text-brand-primary">Client Details</h4>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsNewCustomer(!isNewCustomer)}
                  className="h-[28px] px-3 text-[11px] font-bold bg-brand-accent/10 text-brand-accent hover:bg-brand-accent hover:text-brand-white rounded-full transition-all"
                >
                  {isNewCustomer ? 'Select Existing Customer' : 'New Lead Instead'}
                </Button>
              </div>

              {isNewCustomer ? (
                <div className="grid grid-cols-2 gap-4 p-4 bg-brand-surface rounded-xl border border-brand-border/50">
                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-medium text-brand-secondary ml-1">Full Name <span className="text-brand-danger">*</span></Label>
                    <Input value={addForm.customer_name} onChange={e => setAddForm({ ...addForm, customer_name: e.target.value })} className="h-[38px] text-[13px] bg-brand-white border-brand-border/50 rounded-lg focus-visible:ring-brand-accent/30" placeholder="e.g. John Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-medium text-brand-secondary ml-1">Email <span className="text-brand-danger">*</span></Label>
                    <Input type="email" value={addForm.customer_email} onChange={e => setAddForm({ ...addForm, customer_email: e.target.value })} className="h-[38px] text-[13px] bg-brand-white border-brand-border/50 rounded-lg focus-visible:ring-brand-accent/30" placeholder="john@example.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-medium text-brand-secondary ml-1">Company</Label>
                    <Input value={addForm.customer_company} onChange={e => setAddForm({ ...addForm, customer_company: e.target.value })} className="h-[38px] text-[13px] bg-brand-white border-brand-border/50 rounded-lg focus-visible:ring-brand-accent/30" placeholder="e.g. Acme Corp" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-medium text-brand-secondary ml-1">Phone</Label>
                    <Input value={addForm.customer_phone} onChange={e => setAddForm({ ...addForm, customer_phone: e.target.value })} className="h-[38px] text-[13px] bg-brand-white border-brand-border/50 rounded-lg focus-visible:ring-brand-accent/30" placeholder="+971 50 123 4567" />
                  </div>
                </div>
              ) : (
                <Select value={addForm.customer_id} onValueChange={(v) => setAddForm({ ...addForm, customer_id: v })}>
                  <SelectTrigger className="h-[42px] bg-brand-surface border-brand-border/50 text-brand-primary rounded-xl font-medium text-[13px] shadow-sm focus:ring-brand-accent/30">
                    <SelectValue placeholder="Search existing client profiles..." />
                  </SelectTrigger>
                  <SelectContent className="bg-brand-white border-brand-border/50 rounded-xl shadow-xl max-h-[300px]">
                    {customersData.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)} className="font-medium text-[13px] cursor-pointer focus:bg-brand-surface">
                        <div className="flex items-center gap-2 py-1">
                           <Avatar size={20} name={c.name} variant="marble" colors={avatarColors} />
                           <span>{c.name} {c.company ? <span className="text-brand-subtle font-normal ml-1">— {c.company}</span> : ''}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <Separator className="bg-brand-border/50" />

            {/* SECTION 2: ENQUIRY DETAILS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-brand-secondary mb-1">
                <div className="h-1.5 w-3 bg-brand-warning rounded-full" />
                <h4 className="text-[13px] font-semibold text-brand-primary">Enquiry Context</h4>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-brand-secondary ml-1">Channel Source</Label>
                  <Select value={addForm.source} onValueChange={(v) => setAddForm({ ...addForm, source: v })}>
                    <SelectTrigger className="h-[38px] bg-brand-surface border-brand-border/50 text-brand-primary rounded-lg font-medium text-[13px] focus:ring-brand-accent/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-brand-white border-brand-border/50 rounded-xl shadow-xl">
                      <SelectItem value="manual" className="font-medium text-[13px] cursor-pointer"><div className="flex items-center gap-2"><UserIcon size={14} className="text-brand-subtle" /> Manual</div></SelectItem>
                      <SelectItem value="website" className="font-medium text-[13px] cursor-pointer"><div className="flex items-center gap-2"><Globe size={14} className="text-blue-500" /> Website</div></SelectItem>
                      <SelectItem value="email" className="font-medium text-[13px] cursor-pointer"><div className="flex items-center gap-2"><Mail size={14} className="text-orange-500" /> Email</div></SelectItem>
                      <SelectItem value="referral" className="font-medium text-[13px] cursor-pointer"><div className="flex items-center gap-2"><MessageCircle size={14} className="text-emerald-500" /> Referral</div></SelectItem>
                      <SelectItem value="import" className="font-medium text-[13px] cursor-pointer"><div className="flex items-center gap-2"><MessageSquare size={14} className="text-indigo-500" /> Import</div></SelectItem>
                      <SelectItem value="other" className="font-medium text-[13px] cursor-pointer"><div className="flex items-center gap-2"><Phone size={14} className="text-purple-500" /> Other</div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-brand-secondary ml-1">Initial Priority</Label>
                  <Select value={addForm.priority} onValueChange={(v) => setAddForm({ ...addForm, priority: v })}>
                    <SelectTrigger className="h-[38px] bg-brand-surface border-brand-border/50 text-brand-primary rounded-lg font-medium text-[13px] focus:ring-brand-accent/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-brand-white border-brand-border/50 rounded-xl shadow-xl">
                      <SelectItem value="normal" className="font-medium text-[13px] cursor-pointer"><div className="flex items-center gap-2"><ArrowDown size={14} className="text-blue-500" /> Normal</div></SelectItem>
                      <SelectItem value="high" className="font-medium text-[13px] cursor-pointer"><div className="flex items-center gap-2"><ArrowUp size={14} className="text-orange-500" /> High</div></SelectItem>
                      <SelectItem value="urgent" className="font-medium text-[13px] cursor-pointer"><div className="flex items-center gap-2"><Zap size={14} className="text-red-500" /> Urgent</div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-brand-secondary ml-1">Requirements & Notes</Label>
                <Textarea
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  className="bg-brand-surface border-brand-border/50 text-brand-primary rounded-xl resize-none min-h-[120px] text-[13px] p-4"
                  placeholder="Describe what the client is looking for in detail..."
                />
              </div>
            </div>
          </div>

          <div className="p-6 pt-2">
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setAddOpen(false)} className="rounded-lg text-[13px] font-medium">Cancel</Button>
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
                  
                  const onSuccessCallback = () => {
                    setAddOpen(false);
                    setIsNewCustomer(false);
                    setIsEditing(false);
                    setAddForm({ customer_id: '', customer_name: '', customer_email: '', customer_phone: '', customer_company: '', source: 'manual', priority: 'normal', notes: '' });
                    toast(isEditing ? "Lead updated" : "Lead has been registered", {
                      description: isEditing ? "The enquiry was updated successfully." : "The new enquiry was created successfully.",
                    });
                  };

                  if (isEditing) {
                    update.mutate({ id: selectedId!, data: payload }, { onSuccess: onSuccessCallback });
                  } else {
                    create.mutate(payload, { onSuccess: onSuccessCallback });
                  }
                }}
                disabled={create.isPending || update.isPending || (isNewCustomer ? (!addForm.customer_name || !addForm.customer_email) : !addForm.customer_id)}
                className="flex-1 bg-brand-primary text-brand-white hover:opacity-90 h-[36px] rounded-lg text-[13px] font-medium shadow-sm"
              >
                {(create.isPending || update.isPending) ? <Spinner size={14} className="mr-2" /> : null} 
                {isEditing ? 'Save Changes' : 'Create Lead'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
