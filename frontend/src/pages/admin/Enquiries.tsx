import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { toast } from 'sonner';
import api from '@/lib/axios';
import { timeAgo } from '@/lib/utils';
import type { Enquiry, Customer, User } from '@/types';
import { Filter, X, Building2, Mail, Phone, Calendar, FileText, Package, Loader2, Search, Plus, UserCircle2, Tag, XCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const Enquiries = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [addForm, setAddForm] = useState({ 
    customer_id: '', customer_name: '', customer_email: '', customer_phone: '', customer_company: '',
    source: 'portal', priority: 'normal', notes: '' 
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: async () => {
      const res = await api.get('/admin/customers?per_page=100');
      return res.data.data as Customer[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/admin/enquiries', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      setAddOpen(false);
      setIsNewCustomer(false);
      setAddForm({ customer_id: '', customer_name: '', customer_email: '', customer_phone: '', customer_company: '', source: 'portal', priority: 'normal', notes: '' });
      toast.success('Enquiry created');
    },
    onError: () => toast.error('Failed to create enquiry'),
  });

  const { data: enquiriesData, isLoading } = useQuery({
    queryKey: ['enquiries', page, search, filterStatus, filterPriority, filterSource],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), per_page: '15' });
      if (search) params.set('search', search);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterPriority !== 'all') params.set('priority', filterPriority);
      if (filterSource !== 'all') params.set('source', filterSource);
      
      const res = await api.get(`/admin/enquiries?${params}`);
      return res.data;
    }
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
    mutationFn: async ({ id, userId }: { id: number; userId: string }) => {
      return api.put(`/admin/enquiries/${id}/assign`, { assigned_to: userId || null });
    },
    onMutate: async ({ id, userId }) => {
      // Cancel in-flight fetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['enquiries'] });
      const prev = queryClient.getQueryData<any>(['enquiries', page, search, filterStatus, filterPriority, filterSource]);
      // Optimistically update the cached list
      queryClient.setQueryData<any>(['enquiries', page, search, filterStatus, filterPriority, filterSource], (old: any) => {
        if (!old?.data) return old;
        const assignedUser = userId ? usersList.find((u) => String(u.id) === userId) : null;
        return {
          ...old,
          data: old.data.map((enq: any) =>
            enq.id === id
              ? { ...enq, assigned_to: userId ? Number(userId) : null, assignedUser: assignedUser || null }
              : enq
          ),
        };
      });
      return { prev };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      toast.success('Enquiry assigned');
    },
    onError: (_err, _vars, ctx: any) => {
      // Roll back on failure
      if (ctx?.prev) queryClient.setQueryData(['enquiries', page, search, filterStatus, filterPriority, filterSource], ctx.prev);
      toast.error('Failed to assign enquiry');
    },
  });

  const { data: usersList = [] } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () => (await api.get('/admin/users?per_page=100')).data.data as User[],
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterSource('all');
    setPage(1);
  };

  const openDetail = (enquiry: Enquiry) => {
    setSelectedId(enquiry.id);
    setSheetOpen(true);
  };

  const hasActiveFilters = filterStatus !== 'all' || filterPriority !== 'all' || filterSource !== 'all';
  const enquiries = enquiriesData?.data || [];

  const columns: ColumnDef<Enquiry>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-zeronix-blue font-medium">
          ENQ-{String(row.original.id).padStart(3, '0')}
        </span>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-admin-text-primary">{row.original.customer?.name || '—'}</p>
          {row.original.customer?.company && (
            <p className="text-xs text-admin-text-muted flex items-center gap-1 mt-0.5">
              <Building2 size={11} /> {row.original.customer.company}
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
      accessorKey: 'source',
      header: 'Source',
      cell: ({ row }) => (
        <span className="text-admin-text-secondary text-sm capitalize">{row.original.source}</span>
      ),
    },
    {
      accessorKey: 'items_count',
      header: 'Items',
      cell: ({ row }) => (
        <span className="text-admin-text-secondary">{row.original.items_count || 0}</span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-admin-text-muted text-xs">
          {row.original.created_at ? timeAgo(row.original.created_at) : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'user',
      header: 'Created By',
      cell: ({ row }) => {
        const u = row.original.user;
        if (!u) return <span className="text-admin-text-muted text-xs">—</span>;
        const initials = u.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
        return (
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded-full bg-zeronix-blue/15 text-zeronix-blue flex items-center justify-center text-[10px] font-semibold shrink-0">
              {initials}
            </div>
            <span className="text-xs text-admin-text-secondary">{u.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'assigned_to',
      header: 'Assigned To',
      cell: ({ row }) => {
        const enq = row.original;
        const assigned = enq.assignedUser;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Select
              value={String(enq.assigned_to || '')}
              onValueChange={(v) => assignMutation.mutate({ id: enq.id, userId: v === 'unassigned' ? '' : v })}
            >
              <SelectTrigger className="h-7 text-xs bg-admin-bg border-admin-border rounded w-32">
                <SelectValue placeholder="Assign…">
                  {assigned ? (
                    <span className="flex items-center gap-1">
                      <div className="h-4 w-4 rounded-full bg-zeronix-blue/15 text-zeronix-blue flex items-center justify-center text-[9px] font-semibold">
                        {assigned.name[0]}
                      </div>
                      {assigned.name.split(' ')[0]}
                    </span>
                  ) : <span className="text-admin-text-muted">Unassigned</span>}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-admin-surface border-admin-border">
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {usersList.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Search & Filter Top Bar */}
      <div className="flex flex-col sm:flex-row gap-2 items-center">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" />
          <Input
            placeholder="Search by customer, email, company, or ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9 h-[38px] bg-admin-surface border-admin-border text-admin-text-primary w-full"
          />
        </div>
        <Button onClick={handleSearch} className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover h-[38px]">
          Search
        </Button>
        <Button onClick={() => setAddOpen(true)} className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover h-[38px] font-medium">
          <Plus size={16} className="mr-1" /> Add Enquiry
        </Button>
        <Button
          variant="ghost"
          onClick={() => setShowFilters(!showFilters)}
          className={`h-[38px] text-sm font-medium border border-admin-border rounded-lg ${
            hasActiveFilters
              ? 'bg-zeronix-blue/10 text-zeronix-blue border-zeronix-blue/30'
              : 'text-admin-text-secondary hover:bg-admin-surface-hover'
          }`}
        >
          <Filter size={16} className="mr-1" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 bg-zeronix-blue text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {[filterStatus, filterPriority, filterSource].filter((f) => f !== 'all').length}
            </span>
          )}
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-admin-surface border border-admin-border rounded-xl">
          <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
            <SelectTrigger className="h-[34px] w-36 bg-admin-bg border-admin-border text-admin-text-primary text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-admin-surface border-admin-border">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="quoted">Quoted</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={(v) => { setFilterPriority(v); setPage(1); }}>
            <SelectTrigger className="h-[34px] w-36 bg-admin-bg border-admin-border text-admin-text-primary text-sm">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent className="bg-admin-surface border-admin-border">
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterSource} onValueChange={(v) => { setFilterSource(v); setPage(1); }}>
            <SelectTrigger className="h-[34px] w-36 bg-admin-bg border-admin-border text-admin-text-primary text-sm">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent className="bg-admin-surface border-admin-border">
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="portal">Portal</SelectItem>
              <SelectItem value="chat">Chat</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-admin-text-muted hover:text-admin-text-primary h-[34px] text-xs">
              <X size={14} className="mr-1" /> Clear
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-zeronix-blue" size={32} />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={enquiries}
            onRowClick={openDetail}
            hidePagination={true}
          />

          <div className="flex items-center justify-between py-2">
            <p className="text-sm text-admin-text-muted">{enquiriesData?.total || 0} enquiries total</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="bg-admin-surface border-admin-border text-admin-text-secondary">Previous</Button>
              <span className="text-sm text-admin-text-muted px-2">Page {page} of {enquiriesData?.last_page || 1}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= (enquiriesData?.last_page || 1)} className="bg-admin-surface border-admin-border text-admin-text-secondary">Next</Button>
            </div>
          </div>
        </>
      )}

      {/* Enquiry Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-admin-surface border-l border-admin-border overflow-y-auto">
          {isEnquiryLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="animate-spin text-zeronix-blue" size={32} />
            </div>
          ) : selectedEnquiry && (
            <>
              <SheetHeader className="pb-4">
                <SheetTitle className="text-admin-text-primary flex items-center gap-2">
                  <span className="font-mono text-zeronix-blue">ENQ-{String(selectedEnquiry.id).padStart(3, '0')}</span>
                </SheetTitle>
                <SheetDescription className="text-admin-text-secondary">
                  Enquiry details and management
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6">
                {/* Status & Priority Controls */}
                <div className="flex gap-3">
                  <div className="flex-1 space-y-2">
                    <Label className="text-admin-text-muted text-xs uppercase font-medium">Status</Label>
                    <Select value={selectedEnquiry.status} onValueChange={(v) => updateMutation.mutate({ status: v as any })}>
                      <SelectTrigger className="h-[34px] bg-admin-bg border-admin-border text-admin-text-primary text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-admin-surface border-admin-border">
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="quoted">Quoted</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="won">Won</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label className="text-admin-text-muted text-xs uppercase font-medium">Priority</Label>
                    <Select value={selectedEnquiry.priority} onValueChange={(v) => updateMutation.mutate({ priority: v as any })}>
                      <SelectTrigger className="h-[34px] bg-admin-bg border-admin-border text-admin-text-primary text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-admin-surface border-admin-border">
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedEnquiry.status === 'cancelled' && (
                  <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                       <Label className="text-red-600 text-[10px] uppercase font-bold flex items-center gap-1.5">
                         <XCircle size={12} /> Cancellation Details
                       </Label>
                       {selectedEnquiry.cancelled_at && (
                         <span className="text-[10px] text-red-400 font-medium italic">
                           Cancelled on {new Date(selectedEnquiry.cancelled_at).toLocaleString()}
                         </span>
                       )}
                    </div>
                    <Textarea
                      defaultValue={selectedEnquiry.cancellation_reason || ''}
                      id="cancellation-reason"
                      placeholder="Why was this enquiry cancelled?"
                      className="bg-white border-red-200 text-sm min-h-[80px] focus:ring-red-100"
                    />
                    <Button 
                      size="sm" 
                      onClick={() => {
                        const reason = (document.getElementById('cancellation-reason') as HTMLTextAreaElement).value;
                        if (!reason) {
                          toast.error('Please provide a reason for cancellation');
                          return;
                        }
                        updateMutation.mutate({ status: 'cancelled', cancellation_reason: reason });
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold h-7"
                    >
                      Update Reason
                    </Button>
                  </div>
                )}

                <Separator className="bg-admin-border" />

                {/* Customer Info */}
                <div>
                  <h4 className="text-xs font-medium uppercase text-admin-text-muted mb-3">Customer</h4>
                  <div className="bg-admin-bg rounded-lg p-4 space-y-2 cursor-pointer hover:ring-1 ring-zeronix-blue" onClick={() => navigate(`/admin/customers/${selectedEnquiry.customer_id}`)}>
                    <p className="font-medium text-admin-text-primary">{selectedEnquiry.customer?.name}</p>
                    {selectedEnquiry.customer?.company && (
                      <p className="text-sm text-admin-text-secondary flex items-center gap-2">
                        <Building2 size={14} className="text-admin-text-muted" />
                        {selectedEnquiry.customer.company}
                      </p>
                    )}
                    <p className="text-sm text-admin-text-secondary flex items-center gap-2">
                      <Mail size={14} className="text-admin-text-muted" />
                      {selectedEnquiry.customer?.email}
                    </p>
                    {selectedEnquiry.customer?.phone && (
                      <p className="text-sm text-admin-text-secondary flex items-center gap-2">
                        <Phone size={14} className="text-admin-text-muted" />
                        {selectedEnquiry.customer.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-admin-bg rounded-lg p-3">
                    <p className="text-[10px] uppercase text-admin-text-muted font-medium mb-1">Source</p>
                    <p className="text-sm text-admin-text-primary capitalize">{selectedEnquiry.source}</p>
                  </div>
                  <div className="bg-admin-bg rounded-lg p-3">
                    <p className="text-[10px] uppercase text-admin-text-muted font-medium mb-1">Date</p>
                    <p className="text-sm text-admin-text-primary flex items-center gap-1">
                      <Calendar size={12} />
                      {selectedEnquiry.created_at ? new Date(selectedEnquiry.created_at).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>

                <Separator className="bg-admin-border" />

                {/* Items */}
                <div>
                  <h4 className="text-xs font-medium uppercase text-admin-text-muted mb-3">
                    Items ({selectedEnquiry.items?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {selectedEnquiry.items?.length > 0 ? (
                      selectedEnquiry.items.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 bg-admin-bg rounded-lg">
                          <div className="p-2 rounded-lg bg-zeronix-blue/10 flex-shrink-0">
                            <Package size={16} className="text-zeronix-blue" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              {!item.product_id && (
                                <Badge variant="outline" className="h-4 text-[8px] font-bold uppercase tracking-tighter border-zeronix-blue/30 text-zeronix-blue bg-zeronix-blue/5">
                                  <Tag size={8} className="mr-1" /> Manual
                                </Badge>
                              )}
                              <p className="text-sm font-medium text-admin-text-primary truncate">
                                {item.product?.name || item.description || 'Unknown Product'}
                              </p>
                            </div>
                            {item.product?.part_number && (
                              <p className="text-xs font-mono text-admin-text-muted">{item.product.part_number}</p>
                            )}
                            {item.description && !item.product && (
                              <p className="text-xs text-admin-text-muted italic">"{item.description}"</p>
                            )}
                          </div>
                          <span className="text-sm text-admin-text-secondary flex-shrink-0 font-medium">
                            Qty: {item.quantity}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-admin-text-muted italic">No items listed.</p>
                    )}
                  </div>
                </div>

                <Separator className="bg-admin-border" />

                {/* Notes */}
                <div>
                  <h4 className="text-xs font-medium uppercase text-admin-text-muted mb-2">Notes</h4>
                  <div className="flex gap-2">
                    <Textarea
                      defaultValue={selectedEnquiry.notes || ''}
                      id="enquiry-notes"
                      className="bg-admin-bg border-admin-border text-admin-text-primary focus:border-zeronix-blue resize-none"
                      rows={3}
                      placeholder="Add internal notes..."
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 pb-8">
                  <Button onClick={() => navigate('/admin/quotes/create', { state: { enquiryId: selectedEnquiry.id, customerId: selectedEnquiry.customer_id } })} className="flex-1 bg-zeronix-blue text-white hover:bg-zeronix-blue-hover h-[38px]">
                    <FileText size={16} className="mr-1" /> Create Quote
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      const notes = (document.getElementById('enquiry-notes') as HTMLTextAreaElement).value;
                      if (notes !== selectedEnquiry.notes) {
                        updateMutation.mutate({ notes });
                      }
                    }}
                    disabled={updateMutation.isPending}
                    className="border border-admin-border text-admin-text-secondary hover:bg-admin-surface-hover h-[38px]"
                  >
                    {updateMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : 'Save Notes'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Enquiry Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-admin-surface border-admin-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-admin-text-primary">Add Enquiry</DialogTitle>
            <DialogDescription className="text-admin-text-secondary">
              Create a new enquiry manually.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-admin-text-secondary text-sm">Customer *</Label>
                <Button variant="ghost" size="sm" onClick={() => setIsNewCustomer(!isNewCustomer)} className="h-6 text-xs text-zeronix-blue hover:bg-zeronix-blue/10">
                  {isNewCustomer ? 'Select Existing' : '+ Add New Lead'}
                </Button>
              </div>
              
              {isNewCustomer ? (
                <div className="grid grid-cols-2 gap-3 p-3 bg-admin-bg rounded-lg border border-admin-border">
                  <div className="space-y-1">
                    <Label className="text-xs text-admin-text-secondary">Name *</Label>
                    <Input value={addForm.customer_name} onChange={e => setAddForm({...addForm, customer_name: e.target.value})} className="h-8 text-sm bg-admin-surface border-admin-border text-admin-text-primary" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-admin-text-secondary">Email *</Label>
                    <Input type="email" value={addForm.customer_email} onChange={e => setAddForm({...addForm, customer_email: e.target.value})} className="h-8 text-sm bg-admin-surface border-admin-border text-admin-text-primary" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-admin-text-secondary">Phone</Label>
                    <Input value={addForm.customer_phone} onChange={e => setAddForm({...addForm, customer_phone: e.target.value})} className="h-8 text-sm bg-admin-surface border-admin-border text-admin-text-primary" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-admin-text-secondary">Company</Label>
                    <Input value={addForm.customer_company} onChange={e => setAddForm({...addForm, customer_company: e.target.value})} className="h-8 text-sm bg-admin-surface border-admin-border text-admin-text-primary" />
                  </div>
                </div>
              ) : (
                <Select value={addForm.customer_id} onValueChange={(v) => setAddForm({ ...addForm, customer_id: v })}>
                  <SelectTrigger className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent className="bg-admin-surface border-admin-border">
                    {customersData?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name} {c.company ? `(${c.company})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-admin-text-secondary text-sm">Source</Label>
                <Select value={addForm.source} onValueChange={(v) => setAddForm({ ...addForm, source: v })}>
                  <SelectTrigger className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-admin-surface border-admin-border">
                    <SelectItem value="portal">Portal</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="chat">Chat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-admin-text-secondary text-sm">Priority</Label>
                <Select value={addForm.priority} onValueChange={(v) => setAddForm({ ...addForm, priority: v })}>
                  <SelectTrigger className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-admin-surface border-admin-border">
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-admin-text-secondary text-sm">Notes</Label>
              <Textarea 
                value={addForm.notes} 
                onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                className="bg-admin-bg border-admin-border text-admin-text-primary resize-none"
                placeholder="Initial details..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)} className="text-admin-text-secondary">Cancel</Button>
            <Button 
              onClick={() => {
                const payload: any = { ...addForm };
                if (!isNewCustomer) {
                  payload.customer_id = Number(addForm.customer_id);
                  delete payload.customer_name;
                  delete payload.customer_email;
                  delete payload.customer_phone;
                  delete payload.customer_company;
                } else {
                  delete payload.customer_id;
                }
                createMutation.mutate(payload);
              }} 
              disabled={createMutation.isPending || (isNewCustomer ? (!addForm.customer_name || !addForm.customer_email) : !addForm.customer_id)}
              className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover"
            >
              {createMutation.isPending ? <Loader2 className="animate-spin" /> : 'Create Enquiry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
