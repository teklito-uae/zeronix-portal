import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useResourceList } from '@/hooks/useApi';
import { getBasePath } from '@/hooks/useBasePath';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Avatar } from '@/components/shared/Avatar';
import { PurchaseBillDetailView } from '@/components/shared/purchase-bill/PurchaseBillDetailView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageLoader } from '@/components/shared/PageLoader';
import { SEO } from '@/components/shared/SEO';
import type { PurchaseBill } from '@/types';
import { Search, ChevronLeft, ChevronRight, Building2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const purchasebillTabs = [
  { id: 'all', label: 'All Purchase Bills' },
  { id: 'draft', label: 'Drafts' },
  { id: 'posted', label: 'Posted' },
  { id: 'partially_paid', label: 'Partially Paid' },
  { id: 'paid', label: 'Paid' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'cancelled', label: 'Cancelled' },
];

/**
 * Zoho-Books-style master-detail layout for Purchase Bills, mirroring
 * QuotesSplitView.tsx: a compact scrollable left column list, and a right
 * column detail pane (PurchaseBillDetailView). Below `md:` only the list is
 * shown (row click navigates to the full-page editor instead).
 */
export const PurchasesSplitView = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('id');

  const [activeTab, setActiveTab] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: resourceData, isLoading } = useResourceList<PurchaseBill>('purchase-bills', {
    search: search || undefined,
    status: activeTab !== 'all' ? activeTab : undefined,
    page,
    per_page: 20,
  });

  const purchases: PurchaseBill[] = resourceData?.data || [];
  const total = resourceData?.total || 0;
  const lastPage = resourceData?.last_page || 1;

  // Auto-select the first invoice once data loads, if nothing is selected yet.
  useEffect(() => {
    if (!selectedId && purchases.length > 0) {
      setSearchParams({ id: String(purchases[0].id) }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchases, selectedId]);

  const handleRowClick = (row: PurchaseBill) => {
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    if (isDesktop) {
      setSearchParams({ id: String(row.id) });
    } else {
      navigate(`${getBasePath()}/purchases/${row.id}`);
    }
  };

  return (
    <div className="bg-brand-white flex flex-col h-full overflow-hidden animate-in fade-in duration-200">
      <SEO title="Purchase Bills" />

      {/* Body: list + detail */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[360px_1fr]">
        {/* Left column: compact list */}
        <div className="flex flex-col min-h-0 border-r border-brand-border/50 bg-brand-white">
          {/* Search + New Purchase Bill */}
          <div className="px-4 py-3 flex items-center gap-2 border-b border-brand-border/50 flex-shrink-0">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-subtle" size={13} />
              <Input
                placeholder="Search by bill # or supplier..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8 h-[34px] text-[12px] bg-brand-white border-brand-border rounded-lg shadow-sm w-full"
              />
            </div>
            <Button
              size="icon"
              onClick={() => navigate(`${getBasePath()}/purchases/create`)}
              className="h-[34px] w-[34px] rounded-lg shadow-sm flex-shrink-0"
              title="New Purchase Bill"
            >
              <Plus size={17} />
            </Button>
          </div>

          {/* Tabs */}
          <div className="px-4 border-b border-brand-border flex items-center gap-5 flex-shrink-0 overflow-x-auto no-scrollbar">
            {purchasebillTabs.map((tab) => {
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
              <PageLoader label="Loading purchases..." iconSize={28} className="h-full min-h-[200px] gap-3" />
            ) : purchases.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[200px] px-4">
                <p className="text-[12px] text-brand-subtle text-center">No purchases found.</p>
              </div>
            ) : (
              <ul>
                {purchases.map((bill) => {
                  const isSelected = String(bill.id) === selectedId;
                  return (
                    <li key={bill.id}>
                      <button
                        type="button"
                        onClick={() => handleRowClick(bill)}
                        className={cn(
                          'w-full text-left px-4 py-3 border-b border-brand-border/50 transition-colors hover:bg-brand-bg',
                          isSelected && 'bg-brand-accent/5 border-l-2 border-l-brand-accent'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <Avatar
                              name={bill.supplier?.name}
                              className="w-8 h-8 text-[10px] mt-0.5"
                            />
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-brand-primary truncate">
                                {bill.supplier?.name || '—'}
                              </p>
                              {bill.supplier?.supplier_code && (
                                <p className="text-[11px] text-brand-subtle flex items-center gap-1 truncate mt-0.5">
                                  <Building2 size={11} /> {bill.supplier.supplier_code}
                                </p>
                              )}
                              <p className="text-[11px] text-brand-subtle mt-1">
                                <span className="font-mono text-brand-accent">{bill.bill_number}</span>
                                {' · '}
                                {bill.created_at ? new Date(bill.created_at).toLocaleDateString() : '—'}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <p className="font-mono text-[13px] font-semibold text-brand-primary">
                              {Number(bill.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                            <StatusBadge status={bill.status} className="text-[10px] px-2 py-0" />
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
          {!isLoading && purchases.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-brand-border/50 flex-shrink-0">
              <span className="text-[11px] text-brand-subtle">
                Page {page} of {lastPage} ({total})
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-md border-brand-border"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft size={13} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-md border-brand-border"
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  disabled={page === lastPage || lastPage === 0}
                >
                  <ChevronRight size={13} />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right column: detail */}
        <div className="hidden md:block min-h-0 overflow-y-auto bg-brand-white">
          {selectedId ? (
            <PurchaseBillDetailView
              id={selectedId}
              onDeleted={() => setSearchParams({}, { replace: true })}
            />
          ) : (
            <div className="h-full flex items-center justify-center min-h-[300px]">
              <p className="text-[13px] text-brand-subtle">Select a purchase bill to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
