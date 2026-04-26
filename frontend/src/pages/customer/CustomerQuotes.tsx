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
import { FileText, Loader2, Search, Calendar, Package, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { SEO } from '@/components/shared/SEO';

export const CustomerQuotes = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { company } = useParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data: quotesData, isLoading } = useQuery<PaginatedResponse<Quote>>({
    queryKey: ['customer-quotes', page, search],
    queryFn: async () => {
      const res = await api.get('/customer/quotes', { params: { page, search, per_page: 15 } });
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
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update quote status');
    }
  });

  const columns: ColumnDef<Quote>[] = [
    {
      accessorKey: 'quote_number',
      header: 'Quote #',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-zeronix-blue font-medium">
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
        <span className="font-mono text-sm font-medium text-admin-text-primary">
          {Number(row.original.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} AED
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-admin-text-muted">
          <Calendar size={13} />
          {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString() : '—'}
        </div>
      ),
    },
    {
      accessorKey: 'valid_until',
      header: 'Expires',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-admin-text-muted">
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
          <DownloadButton type="quote" id={row.original.id} number={row.original.quote_number} mode="view" variant="ghost" size="icon" />
          <DownloadButton type="quote" id={row.original.id} number={row.original.quote_number} mode="download" variant="ghost" size="icon" />
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
          <div className="p-2 bg-zeronix-blue/10 rounded-lg">
            <FileText size={20} className="text-zeronix-blue" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-admin-text-primary">My Quotations</h2>
            <p className="text-xs text-admin-text-muted">Review and accept your project quotes.</p>
          </div>
        </div>
        <Button onClick={() => navigate(`/portal/${company}/products`)} className="bg-zeronix-blue hover:bg-zeronix-blue-hover text-white h-9 rounded-md text-sm font-medium px-4">
          <Package size={14} className="mr-2" /> Request New Quote
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-admin-surface border border-admin-border rounded-xl p-3 shadow-sm">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" size={14} />
          <Input
            placeholder="Search by quote number…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-10 bg-admin-bg border-admin-border text-sm rounded-lg focus:ring-zeronix-blue/20"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="animate-spin text-zeronix-blue" size={32} />
            <p className="text-xs font-medium text-admin-text-muted uppercase tracking-widest">Fetching quotes...</p>
          </div>
        ) : quotesData?.data && quotesData.data.length > 0 ? (
          <>
            <DataTable 
              columns={columns} 
              data={quotesData.data} 
              hidePagination={true}
              renderRowDetails={(quote) => (
                <div className="p-4 bg-admin-bg/50 rounded-lg m-2 border border-admin-border space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-admin-text-muted uppercase tracking-widest">Quote Items Summary</h4>
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
                      <div key={idx} className="flex justify-between items-center text-sm p-2 bg-admin-surface rounded border border-admin-border">
                        <span className="text-admin-text-primary font-medium">{item.product_name || item.description}</span>
                        <span className="text-admin-text-secondary">Qty: {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            />
            
            {/* Pagination Control */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-admin-border bg-admin-surface">
              <p className="text-xs text-admin-text-muted font-medium">
                Showing {quotesData.data.length} of {quotesData.total} quotes
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
                <div className="flex items-center gap-1 px-3 py-1.5 bg-admin-bg rounded-md border border-admin-border">
                  <span className="text-xs font-bold text-admin-text-primary">{page}</span>
                  <span className="text-[10px] text-admin-text-muted font-bold uppercase mx-1">of</span>
                  <span className="text-xs font-bold text-admin-text-muted">{quotesData.last_page}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => p + 1)} 
                  disabled={page >= quotesData.last_page} 
                  className="h-9 px-4 text-xs font-bold border-admin-border text-admin-text-secondary hover:bg-admin-bg"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 text-center bg-admin-surface">
            <div className="w-16 h-16 bg-admin-bg rounded-full flex items-center justify-center mb-4 border border-admin-border">
              <FileText size={32} className="text-admin-text-muted/40" />
            </div>
            <h3 className="text-lg font-bold text-admin-text-primary mb-1">No Quotes Found</h3>
            <p className="text-sm text-admin-text-secondary max-w-[250px] mx-auto leading-relaxed">
              We couldn't find any quotes matching your criteria. Start a new request to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
