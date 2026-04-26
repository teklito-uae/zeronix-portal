import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import api from '@/lib/axios';
import type { PaymentReceipt, PaginatedResponse } from '@/types';
import { Receipt, Search, Loader2, Calendar, Building2, Banknote, Eye, Download, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const PaymentReceipts = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sendingId, setSendingId] = useState<number | null>(null);

  const { data: receiptsData, isLoading } = useQuery<PaginatedResponse<PaymentReceipt>>({
    queryKey: ['payment-receipts', page, search],
    queryFn: async () => {
      const res = await api.get('/admin/payment-receipts', {
        params: { page, search, per_page: 15 }
      });
      return res.data;
    }
  });

  const sendMutation = useMutation({
    mutationFn: async (id: number) => {
      setSendingId(id);
      return api.post(`/admin/payment-receipts/${id}/send-email`);
    },
    onSuccess: () => {
      toast.success('Receipt email sent successfully');
      queryClient.invalidateQueries({ queryKey: ['payment-receipts'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to send email');
    },
    onSettled: () => {
      setSendingId(null);
    }
  });

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  const columns: ColumnDef<PaymentReceipt>[] = [
    {
      accessorKey: 'receipt_number',
      header: 'Receipt #',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-zeronix-blue">{row.original.receipt_number}</span>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="text-sm text-admin-text-primary">{row.original.customer?.name}</p>
          <p className="text-[11px] text-admin-text-muted">{row.original.customer?.company || 'Private'}</p>
        </div>
      ),
    },
    {
      accessorKey: 'invoice',
      header: 'Invoice',
      cell: ({ row }) => (
        row.original.invoice
          ? <span className="text-xs font-mono text-zeronix-blue bg-zeronix-blue/5 px-1.5 py-0.5 rounded border border-zeronix-blue/10">
              {row.original.invoice.invoice_number}
            </span>
          : <span className="text-admin-text-muted text-xs">—</span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-sm font-medium text-admin-text-primary">
            {Number(row.original.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} AED
          </span>
          <p className={cn("text-[11px] flex items-center gap-1 capitalize", row.original.payment_method === 'cash' ? "text-emerald-500" : "text-indigo-500")}>
            {row.original.payment_method === 'cash' ? <Banknote size={10} /> : <Building2 size={10} />}
            {row.original.payment_method}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'payment_date',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-xs text-admin-text-muted flex items-center gap-1">
          <Calendar size={11} />
          {new Date(row.original.payment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs" 
            onClick={() => window.open(`${apiBase}/admin/receipts/${row.original.id}/view`, '_blank')}
          >
            <Eye size={12} className="mr-1" /> View
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs"
            disabled={sendingId === row.original.id}
            onClick={() => sendMutation.mutate(row.original.id)}
          >
            {sendingId === row.original.id ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Mail size={12} />
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs" 
            onClick={() => window.open(`${apiBase}/admin/receipts/${row.original.id}/download`, '_blank')}
          >
            <Download size={12} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt size={18} className="text-zeronix-blue" />
          <div>
            <h2 className="text-base font-semibold text-admin-text-primary">Payment Receipts</h2>
            <p className="text-xs text-admin-text-muted">Track all incoming payments from customers.</p>
          </div>
        </div>
      </div>

      <div className="bg-admin-surface border border-admin-border rounded-md p-3 flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" size={13} />
          <Input
            placeholder="Search receipts…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 h-9 bg-admin-bg border-admin-border rounded-md text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-zeronix-blue" size={24} />
        </div>
      ) : (
        <>
          <DataTable columns={columns} data={receiptsData?.data || []} hidePagination={true} />
          {receiptsData && receiptsData.total > 0 && (
            <div className="flex items-center justify-between py-2 mt-2">
              <p className="text-xs text-admin-text-muted">{receiptsData.total} items</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-8 text-xs rounded-md">Previous</Button>
                <span className="text-xs text-admin-text-muted">Page {page} of {receiptsData.last_page}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= receiptsData.last_page} className="h-8 text-xs rounded-md">Next</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

