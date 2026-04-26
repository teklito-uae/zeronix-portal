import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DownloadButton } from '@/components/shared/DownloadButton';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Invoice, PaginatedResponse } from '@/types';
import { Receipt, Loader2, Search, Calendar, Wallet, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SEO } from '@/components/shared/SEO';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export const CustomerInvoices = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{ open: boolean, invoiceId: number | null, status: 'accepted' | 'rejected' | null }>({
    open: false,
    invoiceId: null,
    status: null
  });
  const [confirmNotes, setConfirmNotes] = useState('');

  const { data: invoicesData, isLoading } = useQuery<PaginatedResponse<Invoice>>({
    queryKey: ['customer-invoices', page, search],
    queryFn: async () => {
      const res = await api.get('/customer/invoices', { params: { page, search, per_page: 15 } });
      return res.data;
    }
  });

  const confirmMutation = useMutation({
    mutationFn: (data: { id: number, status: 'accepted' | 'rejected', notes: string }) => 
      api.post(`/customer/invoices/${data.id}/confirm-delivery`, { status: data.status, notes: data.notes }),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['customer-invoices'] });
      const previousInvoices = queryClient.getQueryData(['customer-invoices', page, search]);
      
      if (previousInvoices) {
        queryClient.setQueryData(['customer-invoices', page, search], (old: any) => ({
          ...old,
          data: old.data.map((inv: any) => 
            inv.id === newData.id 
              ? { ...inv, delivery_status: newData.status === 'accepted' ? 'delivered' : 'rejected' } 
              : inv
          )
        }));
      }
      return { previousInvoices };
    },
    onSuccess: () => {
      toast.success('Delivery confirmation submitted successfully.');
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
      setConfirmModal({ open: false, invoiceId: null, status: null });
      setConfirmNotes('');
    },
    onError: (_err, _newData, context) => {
      if (context?.previousInvoices) {
        queryClient.setQueryData(['customer-invoices', page, search], context.previousInvoices);
      }
      toast.error('Failed to submit confirmation.');
    }
  });

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'invoice_number',
      header: 'Invoice #',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-zeronix-blue font-bold tracking-tight">
          {row.original.invoice_number}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-bold text-admin-text-primary">
          {Number(row.original.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} AED
        </span>
      ),
    },
    {
      accessorKey: 'delivery_status',
      header: 'Delivery',
      cell: ({ row }) => (
        <StatusBadge status={row.original.delivery_status || 'pending'} />
      )
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-admin-text-muted">
          <Calendar size={13} />
          {row.original.date ? new Date(row.original.date).toLocaleDateString() : '—'}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button 
            size="sm" 
            variant="outline" 
            disabled={row.original.delivery_status === 'delivered' || (confirmMutation.isPending && confirmModal.invoiceId === row.original.id)}
            className={`h-8 text-[10px] font-bold uppercase tracking-wider transition-all ${
              row.original.delivery_status === 'delivered' 
                ? "border-emerald-500/20 text-emerald-500/50 bg-emerald-500/5 cursor-not-allowed" 
                : "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500 hover:text-white"
            }`}
            onClick={() => setConfirmModal({ open: true, invoiceId: row.original.id, status: 'accepted' })}
          >
            {row.original.delivery_status === 'delivered' ? 'Delivery Confirmed' : (confirmMutation.isPending && confirmModal.invoiceId === row.original.id ? '...' : 'Confirm Delivery')}
          </Button>
          <DownloadButton type="invoice" id={row.original.id} number={row.original.invoice_number} mode="view" variant="ghost" size="icon" />
          <DownloadButton type="invoice" id={row.original.id} number={row.original.invoice_number} mode="download" variant="ghost" size="icon" />
        </div>
      ),
    },
  ];

  const handleConfirmAction = () => {
    if (!confirmModal.invoiceId || !confirmModal.status) return;
    confirmMutation.mutate({
      id: confirmModal.invoiceId,
      status: confirmModal.status,
      notes: confirmNotes
    });
  };

  return (
    <div className="space-y-4">
      <SEO title="My Invoices" description="Manage your billing and payments." />
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Receipt size={20} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-admin-text-primary tracking-tight">MY INVOICES</h2>
            <p className="text-xs text-admin-text-muted font-medium">Track your orders and verify delivery status.</p>
          </div>
        </div>
        <div className="hidden md:flex bg-admin-surface border border-admin-border rounded-lg px-4 h-10 items-center gap-3 shadow-sm">
           <Wallet size={14} className="text-emerald-500" />
           <p className="text-xs font-bold text-admin-text-primary uppercase tracking-widest">
             Account Balance: <span className="text-emerald-500 font-black">AED 0.00</span>
           </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-admin-surface border border-admin-border rounded-lg p-3 shadow-sm">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" size={14} />
          <Input
            placeholder="Search by invoice number…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-10 bg-admin-bg border-admin-border text-sm rounded-lg focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-admin-surface border border-admin-border rounded-lg overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
            <p className="text-xs font-bold text-admin-text-muted uppercase tracking-widest">Fetching Invoices...</p>
          </div>
        ) : invoicesData?.data && invoicesData.data.length > 0 ? (
          <>
            <DataTable 
              columns={columns} 
              data={invoicesData.data} 
              hidePagination={true}
              renderRowDetails={(inv) => (
                <div className="p-4 bg-admin-bg/50 rounded-lg m-2 border border-admin-border space-y-4">
                   <div className="flex justify-between items-center">
                     <h4 className="text-[10px] font-bold text-admin-text-muted uppercase tracking-widest">Invoice Line Items</h4>
                     {inv.delivery_confirmed_at && (
                       <p className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                         <CheckCircle2 size={10} /> Confirmed on {new Date(inv.delivery_confirmed_at).toLocaleString()}
                       </p>
                     )}
                   </div>
                  <div className="space-y-2">
                    {inv.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm p-2 bg-admin-surface rounded border border-admin-border">
                        <span className="text-admin-text-primary font-medium">{item.product_name || item.description}</span>
                        <div className="flex items-center gap-6">
                           <span className="text-xs text-admin-text-muted">Qty: {item.quantity}</span>
                           <span className="text-xs font-bold text-admin-text-primary">{Number(item.total).toLocaleString()} AED</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {inv.delivery_notes && (
                    <div className="mt-2 p-3 bg-admin-surface rounded border border-admin-border">
                       <p className="text-[9px] font-bold text-admin-text-muted uppercase mb-1">Customer Delivery Notes</p>
                       <p className="text-xs text-admin-text-primary italic">"{inv.delivery_notes}"</p>
                    </div>
                  )}
                </div>
              )}
            />
            
            {/* Pagination Control */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-admin-border bg-admin-surface">
              <p className="text-[10px] text-admin-text-muted font-bold uppercase tracking-widest">
                {invoicesData.total} Invoices Total
              </p>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1} 
                  className="h-9 px-4 text-xs font-bold border-admin-border text-admin-text-secondary hover:bg-admin-bg"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-admin-bg rounded-md border border-admin-border">
                  <span className="text-xs font-bold text-admin-text-primary">{page}</span>
                  <span className="text-[10px] text-admin-text-muted font-bold uppercase">/</span>
                  <span className="text-xs font-bold text-admin-text-muted">{invoicesData.last_page}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => p + 1)} 
                  disabled={page >= invoicesData.last_page} 
                  className="h-9 px-4 text-xs font-bold border-admin-border text-admin-text-secondary hover:bg-admin-bg"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 text-center">
            <div className="w-16 h-16 bg-admin-bg rounded-full flex items-center justify-center mb-4 border border-admin-border">
              <Receipt size={32} className="text-admin-text-muted/30" />
            </div>
            <h3 className="text-lg font-bold text-admin-text-primary mb-1 uppercase tracking-tight">No Invoices</h3>
            <p className="text-sm text-admin-text-secondary max-w-[250px] mx-auto leading-relaxed">
              Your billing history and invoices will appear here once orders are processed.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmModal.open} onOpenChange={(v) => !v && setConfirmModal({ ...confirmModal, open: false })}>
        <DialogContent className="bg-admin-surface border-admin-border sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-admin-text-primary flex items-center gap-2">
              {confirmModal.status === 'accepted' ? <CheckCircle2 className="text-emerald-500" /> : <XCircle className="text-red-500" />}
              {confirmModal.status === 'accepted' ? 'Confirm Delivery' : 'Report Issue / Reject'}
            </DialogTitle>
            <DialogDescription className="text-sm text-admin-text-secondary">
              {confirmModal.status === 'accepted' 
                ? 'Are you sure you have received the items listed in this invoice in good condition?' 
                : 'Please let us know why you are rejecting the delivery or what issue you encountered.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
             <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-admin-text-muted uppercase tracking-widest">Additional Notes (Optional)</label>
                <Textarea 
                  placeholder={confirmModal.status === 'accepted' ? "e.g. Received in perfect condition..." : "e.g. Items damaged, wrong quantity..."}
                  value={confirmNotes}
                  onChange={(e) => setConfirmNotes(e.target.value)}
                  className="bg-admin-bg border-admin-border focus:ring-zeronix-blue/20 min-h-[100px] text-sm"
                />
             </div>
             
             {confirmModal.status === 'accepted' ? (
                <div className="p-3 bg-warning/10 rounded-lg border border-warning/30 flex gap-3">
                   <AlertCircle size={18} className="text-warning shrink-0 mt-0.5" />
                   <p className="text-[11px] text-admin-text-primary leading-relaxed font-medium">
                     By accepting, you acknowledge that the goods have been delivered as per the invoice specifications.
                   </p>
                </div>
             ) : (
                <div className="p-3 bg-danger/10 rounded-lg border border-danger/30 flex gap-3">
                   <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
                   <p className="text-[11px] text-admin-text-primary leading-relaxed font-medium">
                     Our team will be notified immediately to investigate the issue and contact you.
                   </p>
                </div>
             )}
          </div>

          <DialogFooter className="flex gap-2 sm:justify-between">
            <div className="flex gap-2">
               {confirmModal.status === 'accepted' ? (
                 <Button variant="ghost" onClick={() => setConfirmModal({ ...confirmModal, status: 'rejected' })} className="h-9 text-xs font-bold text-red-500 hover:bg-red-500/10">
                   Reject Instead
                 </Button>
               ) : (
                 <Button variant="ghost" onClick={() => setConfirmModal({ ...confirmModal, status: 'accepted' })} className="h-9 text-xs font-bold text-emerald-500 hover:bg-emerald-500/10">
                   Accept Instead
                 </Button>
               )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setConfirmModal({ open: false, invoiceId: null, status: null })} className="h-9 text-xs font-bold border-admin-border">Cancel</Button>
              <Button 
                onClick={handleConfirmAction} 
                disabled={confirmMutation.isPending}
                className={`h-9 px-6 text-xs font-bold text-white shadow-lg ${confirmModal.status === 'accepted' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' : 'bg-red-600 hover:bg-red-500 shadow-red-900/20'}`}
              >
                {confirmMutation.isPending ? 'Submitting...' : 'Submit Response'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
