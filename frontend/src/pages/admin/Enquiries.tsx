import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { timeAgo } from '@/lib/utils';
import type { Enquiry, Customer, User } from '@/types';
import { MessageSquare, Building2, Mail, Phone, FileText, Package, Loader2, Plus, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ResourceListingPage } from '@/components/shared/ResourceListingPage';
import { ActionGroup } from '@/components/shared/ActionGroup';

/**
 * Enquiries Module
 * Refactored to use the standardized State-Driven architecture.
 */
export const Enquiries = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Dialog & Sheet States
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  const [addForm, setAddForm] = useState({
    customer_id: '', customer_name: '', customer_email: '', customer_phone: '', customer_company: '',
    source: 'portal', priority: 'normal', notes: ''
  });

  // Queries
  const { data: usersList = [] } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () => (await api.get('/admin/users?per_page=100')).data.data as User[],
  });

  const { data: customersData = [] } = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: async () => (await api.get('/admin/customers?per_page=100')).data.data as Customer[],
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

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => api.post('/admin/enquiries', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      setAddOpen(false);
      setIsNewCustomer(false);
      setAddForm({ customer_id: '', customer_name: '', customer_email: '', customer_phone: '', customer_company: '', source: 'portal', priority: 'normal', notes: '' });
      toast.success('Enquiry registered successfully');
    },
    onError: () => toast.error('Failed to create enquiry'),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Enquiry>) => {
      if (!selectedId) return;
      return api.put(`/admin/enquiries/${selectedId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['enquiry', selectedId] });
      toast.success('Enquiry updated');
    },
    onError: () => toast.error('Failed to update enquiry'),
  });

  const assignMutation = useMutation({
    mutationFn: async ({ id, userId }: { id: number; userId: string }) =>
      api.put(`/admin/enquiries/${id}/assign`, { assigned_to: userId || null }),
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

  const columns: ColumnDef<Enquiry>[] = [
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
    {
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
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <ActionGroup
          onView={() => { setSelectedId(row.original.id); setSheetOpen(true); }}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <ResourceListingPage<Enquiry>
        resource="enquiries"
        title="Enquiry Hub"
        subtitle="Process incoming leads, assign agents, and convert to quotes."
        icon={<MessageSquare size={20} />}
        columns={columns}
        onRowClick={(row) => { setSelectedId(row.id); setSheetOpen(true); }}
        createLabel="Add Enquiry"
        createPath="#" // Using modal
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

      {/* Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-admin-surface border-l border-admin-border overflow-y-auto rounded-l-3xl shadow-2xl p-0">
          {isEnquiryLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="animate-spin text-zeronix-blue" size={40} />
            </div>
          ) : selectedEnquiry && (
            <div className="flex flex-col h-full">
              <div className="p-6 pb-4 border-b border-admin-border bg-admin-bg/30">
                <SheetHeader className="pb-0">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-2xl font-black text-admin-text-primary flex items-center gap-2">
                      <span className="text-zeronix-blue">ENQ</span>
                      <span className="opacity-30">/</span>
                      <span>{String(selectedEnquiry.id).padStart(3, '0')}</span>
                    </SheetTitle>
                    <StatusBadge status={selectedEnquiry.status} className="h-6 px-3 text-[10px]" />
                  </div>
                  <SheetDescription className="text-xs font-medium text-admin-text-muted mt-1 uppercase tracking-widest">
                    Lead Management & Lifecycle Tracking
                  </SheetDescription>
                </SheetHeader>
              </div>

              <div className="flex-1 p-6 space-y-8">
                {/* Status & Priority Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-admin-text-muted ml-1">Workflow Status</Label>
                    <Select value={selectedEnquiry.status} onValueChange={(v) => updateMutation.mutate({ status: v as any })}>
                      <SelectTrigger className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-admin-surface border-admin-border rounded-xl">
                        {['new', 'in_progress', 'quoted', 'delivered', 'closed', 'won', 'lost', 'cancelled'].map(s => (
                          <SelectItem key={s} value={s} className="capitalize font-medium">{s.replace('_', ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-admin-text-muted ml-1">Lead Priority</Label>
                    <Select value={selectedEnquiry.priority} onValueChange={(v) => updateMutation.mutate({ priority: v as any })}>
                      <SelectTrigger className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-admin-surface border-admin-border rounded-xl">
                        {['normal', 'high', 'urgent'].map(p => (
                          <SelectItem key={p} value={p} className="capitalize font-medium">{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedEnquiry.status === 'cancelled' && (
                  <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl space-y-3">
                    <Label className="text-red-600 text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5 ml-1">
                      <XCircle size={14} /> Cancellation Justification
                    </Label>
                    <Textarea
                      defaultValue={selectedEnquiry.cancellation_reason || ''}
                      id="cancellation-reason"
                      placeholder="Why was this lead cancelled?"
                      className="bg-white border-red-100 text-sm min-h-[100px] focus:ring-red-100 rounded-xl resize-none"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        const reason = (document.getElementById('cancellation-reason') as HTMLTextAreaElement).value;
                        if (!reason) {
                          toast.error('Reason required');
                          return;
                        }
                        updateMutation.mutate({ status: 'cancelled', cancellation_reason: reason });
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold h-9 rounded-xl"
                    >
                      Update Reason
                    </Button>
                  </div>
                )}

                <Separator className="bg-admin-border/50" />

                {/* Customer Info Card */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-admin-text-muted ml-1">Client Profile</h4>
                  <div
                    className="bg-admin-bg border border-admin-border rounded-2xl p-5 space-y-4 cursor-pointer hover:border-zeronix-blue/40 hover:shadow-lg hover:shadow-zeronix-blue/5 transition-all group"
                    onClick={() => navigate(`/admin/customers/${selectedEnquiry.customer_id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-zeronix-blue/10 flex items-center justify-center text-zeronix-blue text-lg font-black group-hover:scale-110 transition-transform">
                        {selectedEnquiry.customer?.name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-admin-text-primary text-base">{selectedEnquiry.customer?.name}</p>
                        <p className="text-xs font-bold text-admin-text-muted flex items-center gap-1.5 mt-0.5">
                          <Building2 size={12} /> {selectedEnquiry.customer?.company || 'Personal Account'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 pt-2 border-t border-admin-border/50">
                      <p className="text-xs font-bold text-admin-text-secondary flex items-center gap-2.5">
                        <Mail size={14} className="text-admin-text-muted opacity-60" />
                        {selectedEnquiry.customer?.email}
                      </p>
                      {selectedEnquiry.customer?.phone && (
                        <p className="text-xs font-bold text-admin-text-secondary flex items-center gap-2.5">
                          <Phone size={14} className="text-admin-text-muted opacity-60" />
                          {selectedEnquiry.customer.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="bg-admin-border/50" />

                {/* Items Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between ml-1">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-admin-text-muted">Line Items</h4>
                    <Badge variant="secondary" className="h-5 px-2 text-[9px] font-black bg-admin-bg border border-admin-border">
                      {selectedEnquiry.items?.length || 0} TOTAL
                    </Badge>
                  </div>
                  <div className="space-y-2.5">
                    {selectedEnquiry.items?.length > 0 ? (
                      selectedEnquiry.items.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-4 p-4 bg-admin-bg border border-admin-border rounded-2xl">
                          <div className="h-10 w-10 rounded-xl bg-white border border-admin-border flex items-center justify-center flex-shrink-0">
                            <Package size={20} className="text-admin-text-muted opacity-40" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-admin-text-primary truncate">
                              {item.product?.name || item.description || 'Custom Item'}
                            </p>
                            {item.product?.part_number && (
                              <p className="text-[10px] font-mono font-bold text-zeronix-blue mt-0.5">{item.product.part_number}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-[10px] font-black text-admin-text-muted uppercase tracking-tighter">Quantity</p>
                            <p className="text-sm font-black text-admin-text-primary">{item.quantity}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center bg-admin-bg border border-dashed border-admin-border rounded-2xl">
                        <p className="text-xs font-bold text-admin-text-muted italic">No products listed for this enquiry.</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="bg-admin-border/50" />

                {/* Internal Notes */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-admin-text-muted ml-1">Internal Log / Notes</h4>
                  <Textarea
                    defaultValue={selectedEnquiry.notes || ''}
                    id="enquiry-notes"
                    className="bg-admin-bg border-admin-border text-admin-text-primary focus:border-zeronix-blue rounded-2xl min-h-[120px] resize-none text-sm font-medium"
                    placeholder="Document client discussions, lead quality, or internal task updates..."
                  />
                  <Button
                    onClick={() => {
                      const notes = (document.getElementById('enquiry-notes') as HTMLTextAreaElement).value;
                      updateMutation.mutate({ notes });
                    }}
                    disabled={updateMutation.isPending}
                    className="w-full bg-admin-bg border border-admin-border text-admin-text-primary hover:bg-admin-bg/50 h-10 rounded-xl font-bold text-xs"
                  >
                    {updateMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : 'SYNC NOTES'}
                  </Button>
                </div>
              </div>

              <div className="p-6 bg-admin-surface border-t border-admin-border">
                <Button
                  onClick={() => navigate('/admin/quotes/create', { state: { enquiryId: selectedEnquiry.id, customerId: selectedEnquiry.customer_id } })}
                  className="w-full bg-zeronix-blue text-white hover:bg-zeronix-blue-hover h-14 rounded-2xl font-black text-sm shadow-xl shadow-zeronix-blue/20 flex items-center justify-center gap-2"
                >
                  <FileText size={18} /> GENERATE QUOTATION
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Enquiry Dialog */}
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

          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-admin-text-muted">Lead Origin</Label>
                <Button variant="ghost" size="sm" onClick={() => setIsNewCustomer(!isNewCustomer)} className="h-6 px-3 text-[10px] font-black bg-zeronix-blue/10 text-zeronix-blue hover:bg-zeronix-blue/20 rounded-full">
                  {isNewCustomer ? 'CHOOSE EXISTING CLIENT' : 'ADD AS NEW LEAD'}
                </Button>
              </div>

              {isNewCustomer ? (
                <div className="grid grid-cols-2 gap-3 p-4 bg-admin-bg rounded-2xl border border-admin-border shadow-inner">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-admin-text-muted uppercase">Full Name *</Label>
                    <Input value={addForm.customer_name} onChange={e => setAddForm({ ...addForm, customer_name: e.target.value })} className="h-10 text-sm bg-admin-surface border-admin-border rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-admin-text-muted uppercase">Email *</Label>
                    <Input type="email" value={addForm.customer_email} onChange={e => setAddForm({ ...addForm, customer_email: e.target.value })} className="h-10 text-sm bg-admin-surface border-admin-border rounded-xl" />
                  </div>
                </div>
              ) : (
                <Select value={addForm.customer_id} onValueChange={(v) => setAddForm({ ...addForm, customer_id: v })}>
                  <SelectTrigger className="h-12 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl font-bold">
                    <SelectValue placeholder="Select client profile..." />
                  </SelectTrigger>
                  <SelectContent className="bg-admin-surface border-admin-border rounded-xl max-h-[300px]">
                    {customersData.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)} className="font-medium">{c.name} {c.company ? `(${c.company})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-admin-text-muted ml-1">Channel Source</Label>
                <Select value={addForm.source} onValueChange={(v) => setAddForm({ ...addForm, source: v })}>
                  <SelectTrigger className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-admin-surface border-admin-border rounded-xl">
                    {['portal', 'email', 'phone', 'whatsapp', 'referral', 'chat'].map(s => (
                      <SelectItem key={s} value={s} className="capitalize font-medium">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-admin-text-muted ml-1">Initial Priority</Label>
                <Select value={addForm.priority} onValueChange={(v) => setAddForm({ ...addForm, priority: v })}>
                  <SelectTrigger className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-admin-surface border-admin-border rounded-xl">
                    {['normal', 'high', 'urgent'].map(p => (
                      <SelectItem key={p} value={p} className="capitalize font-medium">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-admin-text-muted ml-1">Initial Requirements / Notes</Label>
              <Textarea
                value={addForm.notes}
                onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                className="bg-admin-bg border-admin-border text-admin-text-primary rounded-2xl resize-none min-h-[100px] text-sm font-medium"
                placeholder="Describe what the client is looking for..."
              />
            </div>
          </div>

          <div className="p-6 pt-2">
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setAddOpen(false)} className="rounded-xl font-bold">CANCEL</Button>
              <Button
                onClick={() => {
                  const payload: any = { ...addForm };
                  if (!isNewCustomer) {
                    payload.customer_id = Number(addForm.customer_id);
                  }
                  createMutation.mutate(payload);
                }}
                disabled={createMutation.isPending || (isNewCustomer ? (!addForm.customer_name || !addForm.customer_email) : !addForm.customer_id)}
                className="flex-1 bg-zeronix-blue text-white hover:bg-zeronix-blue-hover h-12 rounded-xl font-black shadow-lg shadow-zeronix-blue/20"
              >
                {createMutation.isPending ? <Loader2 className="animate-spin" /> : 'REGISTER ENQUIRY'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
