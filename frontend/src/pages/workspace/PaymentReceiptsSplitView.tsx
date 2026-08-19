import { useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getBasePath } from '@/hooks/useBasePath';
import { useResourceList } from '@/hooks/useApi';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Avatar } from '@/components/shared/Avatar';
import { TransactionDetailView } from '@/components/shared/TransactionDetailView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageLoader } from '@/components/shared/PageLoader';
import { SEO } from '@/components/shared/SEO';
import { Pagination } from '@/components/shared/Pagination';
import api from '@/lib/axios';
import type { PaymentReceipt, PaginatedResponse } from '@/types';
import { Search, Building2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatAmount } from '@/lib/currency';

const paymentreceiptTabs = [
  { id: 'all', label: 'All Payment Receipts' },
  { id: 'cash', label: 'Cash' },
  { id: 'bank', label: 'Bank' },
];

/**
 * Zoho-Books-style master-detail layout for Payment Receipts, mirroring
 * QuotesSplitView.tsx: a compact scrollable left column list, and a right
 * column detail pane (PaymentReceiptDetailView). Below `md:` only the list is
 * shown (row click navigates to the full-page editor instead).
 */
export const PaymentReceiptsSplitView = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  // The URL identifier is the human-readable receipt_number (e.g. RCP-1786186958),
  // not the numeric primary key — resolved server-side (PaymentReceipt::resolveRouteBinding).
  const selectedNumber = searchParams.get('id');

  const [activeTab, setActiveTab] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: resourceData, isLoading } = useResourceList<PaginatedResponse<PaymentReceipt>>('payment-receipts', {
    search: search || undefined,
    payment_method: activeTab !== 'all' ? activeTab : undefined,
    page,
    per_page: perPage,
  });

  const paymentreceipts: PaymentReceipt[] = resourceData?.data || [];
  const total = resourceData?.total || 0;
  const lastPage = resourceData?.last_page || 1;

  // Auto-select the first invoice once data loads, if nothing is selected yet.
  useEffect(() => {
    if (!selectedNumber && paymentreceipts.length > 0) {
      setSearchParams({ id: paymentreceipts[0].receipt_number }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentreceipts, selectedNumber]);

  const sendEmailMutation = useMutation({
    mutationFn: async (id: number | string) => (await api.post(`/admin/payment-receipts/${id}/send-email`)).data,
    onSuccess: () => {
      toast.success('Payment Receipt email sent');
      queryClient.invalidateQueries({ queryKey: ['payment-receipts'] });
    },
    onError: (e: AxiosError<{ message?: string }>) => toast.error(e.response?.data?.message || 'Failed to send email'),
  });

  const handleRowClick = (row: PaymentReceipt) => {
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    if (isDesktop) {
      setSearchParams({ id: row.receipt_number });
    } else {
      navigate(`${getBasePath()}/payment-receipts/${row.receipt_number}`);
    }
  };

  return (
    <div className="bg-brand-white flex flex-col h-full overflow-hidden animate-in fade-in duration-200">
      <SEO title="Payment Receipts" />

      {/* Body: list + detail */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[360px_1fr]">
        {/* Left column: compact list */}
        <div className="flex flex-col min-h-0 border-r border-brand-border/50 bg-brand-white">
          {/* Search + New Payment Receipt */}
          <div className="px-4 py-3 flex items-center gap-2 border-b border-brand-border/50 flex-shrink-0">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-subtle" size={13} />
              <Input
                placeholder="Search by invoice # or customer..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8 h-[34px] text-[12px] bg-brand-white border-brand-border rounded-lg shadow-sm w-full"
              />
            </div>
            <Button
              size="icon"
              onClick={() => navigate(`${getBasePath()}/payment-receipts/create`)}
              className="h-[34px] w-[34px] rounded-lg shadow-sm flex-shrink-0"
              title="New Payment Receipt"
            >
              <Plus size={17} />
            </Button>
          </div>

          {/* Tabs */}
          <div className="px-4 border-b border-brand-border flex items-center gap-5 flex-shrink-0 overflow-x-auto no-scrollbar">
            {paymentreceiptTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setPage(1); }}
                  className={cn(
                    'py-3 text-[13px] whitespace-nowrap transition-colors border-b-2',
                    isActive
                      ? 'font-semibold text-brand-primary border-brand-accent'
                      : 'font-medium text-brand-subtle hover:text-brand-primary border-transparent'
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <PageLoader label="Loading paymentreceipts..." iconSize={28} className="h-full min-h-[200px] gap-3" />
            ) : paymentreceipts.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[200px] px-4">
                <p className="text-[12px] text-brand-subtle text-center">No paymentreceipts found.</p>
              </div>
            ) : (
              <ul>
                {paymentreceipts.map((inv) => {
                  const isSelected = inv.receipt_number === selectedNumber;
                  return (
                    <li key={inv.id}>
                      <button
                        type="button"
                        onClick={() => handleRowClick(inv)}
                        className={cn(
                          'w-full text-left px-4 py-3 border-b border-brand-border/50 transition-colors hover:bg-brand-bg',
                          isSelected && 'bg-brand-accent/5 border-l-2 border-l-brand-accent'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <Avatar
                              name={inv.customer?.company || inv.customer?.name}
                              className="w-8 h-8 text-[10px] mt-0.5"
                            />
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-brand-primary truncate">
                                {inv.customer?.name || '—'}
                              </p>
                              {inv.customer?.company && (
                                <p className="text-[11px] text-brand-subtle flex items-center gap-1 truncate mt-0.5">
                                  <Building2 size={11} /> {inv.customer.company}
                                </p>
                              )}
                              <p className="text-[11px] text-brand-subtle mt-1">
                                <span className="font-mono text-brand-accent">{inv.receipt_number}</span>
                                {' · '}
                                {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '—'}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <p className="font-mono text-[13px] font-semibold text-brand-primary">
                              {formatAmount(inv.amount)}
                            </p>
                            <StatusBadge status={inv.payment_method} className="text-[10px] px-2 py-0" />
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Pagination */}
          {!isLoading && paymentreceipts.length > 0 && (
            <div className="px-4 py-2.5 border-t border-brand-border/50 flex-shrink-0">
              <Pagination
                page={page}
                perPage={perPage}
                total={total}
                lastPage={lastPage}
                onPageChange={setPage}
                onPerPageChange={(next) => { setPerPage(next); setPage(1); }}
              />
            </div>
          )}
        </div>

        {/* Right column: detail */}
        <div className="hidden md:block min-h-0 overflow-y-auto bg-brand-white">
          {selectedNumber ? (
            <TransactionDetailView type="payment-receipt"
              id={selectedNumber}
              onSend={(recordId) => sendEmailMutation.mutate(recordId)}
              isSendPending={sendEmailMutation.isPending}
              onDeleted={() => setSearchParams({}, { replace: true })}
            />
          ) : (
            <div className="h-full flex items-center justify-center min-h-[300px]">
              <p className="text-[13px] text-brand-subtle">Select an invoice to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
