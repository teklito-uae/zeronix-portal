import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DownloadButton } from '@/components/shared/DownloadButton';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Quote, PaginatedResponse } from '@/types';
import { Plus, FileText, Building2, Loader2, Search, Mail, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export const Quotes = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data: quotesData, isLoading } = useQuery<PaginatedResponse<Quote>>({
    queryKey: ['quotes', page, search],
    queryFn: async () => {
      const res = await api.get('/admin/quotes', { params: { page, search, per_page: 15 } });
      return res.data;
    }
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (id: number) => (await api.post(`/admin/quotes/${id}/send-email`)).data,
    onSuccess: () => { toast.success('Quote email sent'); queryClient.invalidateQueries({ queryKey: ['quotes'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to send email'),
  });

  const columns: ColumnDef<Quote>[] = [
    {
      accessorKey: 'quote_number',
      header: 'Quote #',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-sm text-zeronix-blue">{row.original.quote_number}</span>
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
            <p className="text-[11px] text-admin-text-muted flex items-center gap-1 mt-0.5">
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
      header: 'Total',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-admin-text-primary">
          {Number(row.original.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} AED
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-xs text-admin-text-muted">
          {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'valid_until',
      header: 'Valid Until',
      cell: ({ row }) => (
        <span className="text-xs text-admin-text-muted">
          {row.original.valid_until ? new Date(row.original.valid_until).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost" size="sm"
            onClick={() => sendEmailMutation.mutate(row.original.id)}
            disabled={sendEmailMutation.isPending || !!row.original.email_sent_at}
            className={row.original.email_sent_at ? "text-green-500 h-8" : "text-admin-text-muted hover:text-zeronix-blue h-8"}
          >
            {sendEmailMutation.isPending && sendEmailMutation.variables === row.original.id
              ? <Loader2 className="animate-spin" size={14} />
              : <Mail size={14} />
            }
          </Button>
          <DownloadButton type="quote" id={row.original.id} mode="view" variant="ghost" size="sm" />
          <DownloadButton type="quote" id={row.original.id} mode="download" variant="ghost" size="sm" />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <FileText className="text-zeronix-blue" size={20} />
          <div>
            <h2 className="text-base font-semibold text-admin-text-primary">Quotations</h2>
            <p className="text-xs text-admin-text-muted">Manage and track customer quotes.</p>
          </div>
        </div>
        <Button onClick={() => navigate('/admin/quotes/create')} className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover h-9 rounded-md text-sm">
          <Plus size={14} className="mr-1" /> Create Quote
        </Button>
      </div>

      <div className="bg-admin-surface border border-admin-border rounded-md p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" size={14} />
          <Input
            placeholder="Search by quote # or customer…"
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
          <DataTable columns={columns} data={quotesData?.data || []} onRowClick={(row) => navigate(`/admin/quotes/${row.id}`)} hidePagination={true} />
          {quotesData && quotesData.total > 0 && (
            <div className="flex items-center justify-between py-2 mt-2">
              <p className="text-xs text-admin-text-muted">{quotesData.total} quotes</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-8 text-xs rounded-md">Previous</Button>
                <span className="text-xs text-admin-text-muted">Page {page}/{quotesData.last_page}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= quotesData.last_page} className="h-8 text-xs rounded-md">Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      {!isLoading && (!quotesData?.data || quotesData.data.length === 0) && (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-admin-border rounded-md bg-admin-surface">
          <FileText size={32} className="text-admin-text-muted/50 mb-3" />
          <h3 className="text-sm font-medium text-admin-text-primary mb-1">No Quotes Found</h3>
          <p className="text-xs text-admin-text-secondary">Create your first quotation to get started.</p>
        </div>
      )}
    </div>
  );
};
