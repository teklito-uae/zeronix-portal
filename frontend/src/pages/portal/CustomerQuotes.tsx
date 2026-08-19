import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DownloadButton } from '@/components/shared/DownloadButton';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Quote, PaginatedResponse } from '@/types';
import { FileText, Loader2, Search, Calendar, Package, CheckCircle2, XCircle, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SEO } from '@/components/shared/SEO';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { CurrencyAmount } from '@/components/shared/CurrencyAmount';
import { Pagination } from '@/components/shared/Pagination';
import type { ApiError } from '@/hooks/useApi';

const QUOTE_STATUSES = [
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Expired', value: 'expired' },
  { label: 'Invoiced', value: 'invoiced' },
];

export const CustomerQuotes = () => {
  const currency = useCurrencyStore((s) => s.currency);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { company } = useParams();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const { data: quotesData, isLoading } = useQuery<PaginatedResponse<Quote>>({
    queryKey: ['customer-quotes', page, perPage, search, status],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, search, per_page: perPage };
      if (status !== 'all') params.status = status;
      const res = await api.get('/customer/quotes', { params });
      return res.data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: 'accepted' | 'rejected' }) => {
      const res = await api.post(`/customer/quotes/${id}/update-status`, { status });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['customer-quotes'] });
      // We don't manually invalidate notifications here because Topbar interceptor handles it
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || 'Failed to update quote status');
    }
  });

  const columns: ColumnDef<Quote>[] = [
    {
      accessorKey: 'quote_number',
      header: 'Quote #',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-brand-accent font-medium">
          {row.original.quote_number || `QT-${String(row.original.id).padStart(5, '0')}`}
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
      header: 'Total Amount',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium text-brand-primary">
          <CurrencyAmount amount={row.original.total} currency={currency} />
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-brand-subtle">
          <Calendar size={13} />
          {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString() : '—'}
        </div>
      ),
    },
    {
      accessorKey: 'valid_until',
      header: 'Expires',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-brand-subtle">
          <Calendar size={13} />
          {row.original.valid_until ? new Date(row.original.valid_until).toLocaleDateString() : '—'}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <DownloadButton type="quote" id={row.original.id} mode="view" variant="ghost" size="icon" />
          <DownloadButton type="quote" id={row.original.id} mode="download" variant="ghost" size="icon" />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <SEO title="My Quotes" description="View and manage your project quotations." />
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-accent/10 rounded-lg">
            <FileText size={20} className="text-brand-accent" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-brand-primary">My Quotations</h2>
            <p className="text-xs text-brand-subtle">Review and accept your project quotes.</p>
          </div>
        </div>
        <Button onClick={() => navigate(`/portal/${company}/products`)} className="bg-brand-accent hover:bg-brand-accent-hover text-white h-9 rounded-md text-sm font-medium px-4">
          <Package size={14} className="mr-2" /> Request New Quote
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="bg-brand-white border border-brand-border rounded-xl p-3 flex flex-wrap items-center gap-2 shadow-sm">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-subtle" size={14} />
          <Input
            placeholder="Search by quote number…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-10 bg-brand-bg border-brand-border text-sm rounded-lg focus:ring-brand-accent/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={13} className="text-brand-subtle" />
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="h-10 w-40 bg-brand-bg border-brand-border text-xs rounded-lg font-medium">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-brand-white border-brand-border">
              <SelectItem value="all">All Statuses</SelectItem>
              {QUOTE_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-brand-white border border-brand-border rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="animate-spin text-brand-accent" size={32} />
            <p className="text-xs font-medium text-brand-subtle uppercase tracking-widest">Fetching quotes...</p>
          </div>
        ) : quotesData?.data && quotesData.data.length > 0 ? (
          <DataTable
            columns={columns}
            data={quotesData.data}
            hidePagination={true}
            renderRowDetails={(quote) => (
              <div className="p-4 bg-brand-bg/50 rounded-lg m-2 border border-brand-border space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-brand-subtle uppercase tracking-widest">Quote Items Summary</h4>
                  {(quote.status === 'sent' || quote.status === 'draft') && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={() => updateStatusMutation.mutate({ id: quote.id, status: 'rejected' })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <XCircle size={14} className="mr-1.5" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => updateStatusMutation.mutate({ id: quote.id, status: 'accepted' })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <CheckCircle2 size={14} className="mr-1.5" /> Accept Quote
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {quote.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm p-2 bg-brand-white rounded border border-brand-border">
                      <span className="text-brand-primary font-medium">{item.product_name || item.description}</span>
                      <span className="text-brand-secondary">Qty: {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-20 text-center bg-brand-white">
            <div className="w-16 h-16 bg-brand-bg rounded-full flex items-center justify-center mb-4 border border-brand-border">
              <FileText size={32} className="text-brand-subtle/40" />
            </div>
            <h3 className="text-lg font-bold text-brand-primary mb-1">No Quotes Found</h3>
            <p className="text-sm text-brand-secondary max-w-[250px] mx-auto leading-relaxed">
              We couldn't find any quotes matching your criteria. Start a new request to get started.
            </p>
          </div>
        )}
      </div>

      {/* Pagination Control */}
      {!isLoading && quotesData?.data && quotesData.data.length > 0 && (
        <Pagination
          page={page}
          perPage={perPage}
          total={quotesData.total}
          lastPage={quotesData.last_page}
          onPageChange={setPage}
          onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
        />
      )}
    </div>
  );
};
