import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DownloadButton } from '@/components/shared/DownloadButton';
import { PaymentReceiptModal } from '@/components/shared/PaymentReceiptModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Invoice, PaginatedResponse } from '@/types';
import { Receipt, Building2, Loader2, Search, Mail, CheckCircle2, DollarSign, Calendar, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

export const Invoices = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const admin = useAuthStore(s => s.admin);

  const { data: invoicesData, isLoading } = useQuery<PaginatedResponse<Invoice>>({
    queryKey: ['invoices', page, search],
    queryFn: async () => {
      const res = await api.get('/admin/invoices', { params: { page, search, per_page: 15 } });
      return res.data;
    }
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (id: number) => (await api.post(`/admin/invoices/${id}/send-email`)).data,
    onSuccess: () => { toast.success('Invoice email sent'); queryClient.invalidateQueries({ queryKey: ['invoices'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to send email'),
  });

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'invoice_number',
      header: 'Invoice #',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-sm text-zeronix-blue">{row.original.invoice_number}</span>
          {row.original.email_sent_at && (
            <p className="text-[11px] text-green-500 flex items-center gap-0.5 mt-0.5">
              <CheckCircle2 size={10} /> Sent
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="text-sm text-admin-text-primary">{row.original.customer?.name || '—'}</p>
          {row.original.customer?.company && (
            <p className="text-[11px] text-admin-text-muted flex items-center gap-1">
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
      accessorKey: 'total',
      header: 'Amount',
      cell: ({ row }) => (
        <div className="text-right">
          <p className="font-mono text-sm font-medium text-admin-text-primary">
            {Number(row.original.total).toLocaleString(undefined, { minimumFractionDigits: 2 })} AED
          </p>
          {row.original.amount_paid > 0 && (
            <p className="text-[11px] text-green-500">Paid: {row.original.amount_paid.toLocaleString()}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'due_info',
      header: 'Due',
      cell: ({ row }) => {
        const days = row.original.days_due;
        if (row.original.status === 'paid') return <span className="text-[11px] text-green-600">Settled</span>;
        return (
          <div>
            <p className="text-[11px] text-admin-text-muted flex items-center gap-1">
              <Calendar size={10} /> {row.original.due_date ? new Date(row.original.due_date).toLocaleDateString() : '—'}
            </p>
            <span className={cn(
              "text-[11px] font-medium flex items-center gap-0.5",
              days < 0 ? "text-red-500" : "text-blue-500"
            )}>
              <Clock size={10} />
              {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
            </span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {row.original.status !== 'paid' && (
            <Button
              variant="outline" size="sm"
              onClick={() => { setSelectedInvoice(row.original); setIsReceiptModalOpen(true); }}
              className="h-7 px-2 text-[11px] bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
            >
              <DollarSign size={11} className="mr-0.5" /> Pay
            </Button>
          )}
          <Button
            variant="ghost" size="sm"
            onClick={() => sendEmailMutation.mutate(row.original.id)}
            disabled={sendEmailMutation.isPending || !!row.original.email_sent_at || (row.original.delivery_status === 'delivered' && admin?.role !== 'admin')}
            className={row.original.email_sent_at ? "text-green-500 h-7" : "text-admin-text-muted hover:text-zeronix-blue h-7"}
          >
            {sendEmailMutation.isPending && sendEmailMutation.variables === row.original.id
              ? <Loader2 className="animate-spin" size={13} />
              : <Mail size={13} />
            }
          </Button>
          <DownloadButton type="invoice" id={row.original.id} mode="view" variant="ghost" size="sm" />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Receipt className="text-zeronix-blue" size={20} />
        <div>
          <h2 className="text-base font-semibold text-admin-text-primary">Invoices</h2>
          <p className="text-xs text-admin-text-muted">Billing and transactions.</p>
        </div>
      </div>

      <div className="bg-admin-surface border border-admin-border rounded-md p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" size={14} />
          <Input
            placeholder="Search invoices…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 h-9 bg-admin-bg border-admin-border text-sm rounded-md"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-zeronix-blue" size={24} />
        </div>
      ) : (
        <>
          <DataTable 
            columns={columns} 
            data={invoicesData?.data || []} 
            onRowClick={(row) => {
              if (row.delivery_status === 'delivered' && admin?.role !== 'admin') {
                toast.error('Invoice cannot be edited after delivery confirmation.');
                return;
              }
              navigate(`/admin/invoices/${row.id}`);
            }} 
            hidePagination={true} 
          />
          {invoicesData && invoicesData.total > 0 && (
            <div className="flex items-center justify-between py-2 mt-2">
              <p className="text-xs text-admin-text-muted">{invoicesData.total} invoices</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-8 text-xs rounded-md">Previous</Button>
                <span className="text-xs text-admin-text-muted">Page {page}/{invoicesData.last_page}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= invoicesData.last_page} className="h-8 text-xs rounded-md">Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      <PaymentReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => { setIsReceiptModalOpen(false); setSelectedInvoice(null); }}
        invoice={selectedInvoice}
      />

      {!isLoading && (invoicesData?.data?.length === 0) && (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-admin-border rounded-md bg-admin-surface">
          <Receipt size={32} className="text-admin-text-muted/50 mb-3" />
          <h3 className="text-sm font-medium text-admin-text-primary mb-1">No Invoices</h3>
          <p className="text-xs text-admin-text-secondary">Converted quotes will appear here.</p>
        </div>
      )}
    </div>
  );
};
