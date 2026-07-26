import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { isPast } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import api from '@/lib/axios';
import type { Deal, DealStage } from '@/types';
import type { CurrencyCode } from '@/lib/currency';
import { SEO } from '@/components/shared/SEO';
import { PageLoader } from '@/components/shared/PageLoader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DataTable } from '@/components/shared/DataTable';
import { Pagination } from '@/components/shared/Pagination';
import { CurrencyAmount } from '@/components/shared/CurrencyAmount';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrencyStore } from '@/store/useCurrencyStore';

import { useDealsViewModeStore } from '@/store/useDealsViewModeStore';
import { useDealsFiltersStore } from '@/store/useDealsFiltersStore';
import { useSelectedDealStore } from '@/store/useSelectedDealStore';
import { usePipelineStats, useUpdateDeal } from '@/hooks/useDeals';

import { DealsHeader } from '@/components/deals/DealsHeader';
import { DealStats } from '@/components/deals/DealStats';
import { DealFilters } from '@/components/deals/DealFilters';
import { KanbanBoard } from '@/components/deals/KanbanBoard';
import { CreateDealDialog } from '@/components/deals/CreateDealDialog';
import { DealDrawer } from '@/components/deals/DealDrawer/DealDrawer';
import {
  DealLostCancelDialog,
  type DealLostCancelReason,
} from '@/components/deals/DealDrawer/DealLostCancelDialog';

const CLOSED_STAGES: DealStage[] = ['won', 'lost', 'cancelled'];

const STAGES: { id: DealStage; label: string }[] = [
  { id: 'new', label: 'New' },
  { id: 'qualified', label: 'Qualified' },
  { id: 'requirement', label: 'Requirement' },
  { id: 'proposal_sent', label: 'Proposal Sent' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'won', label: 'Won' },
  { id: 'lost', label: 'Lost' },
  { id: 'cancelled', label: 'Cancelled' },
];

type PipelineResponse = Record<DealStage, { deals: Deal[]; count: number; value: number }>;

// ---------------------------------------------------------------------------
// List view (unchanged, copied verbatim from the retired pages/workspace/Deals.tsx
// per the approved plan — only the Kanban view was rebuilt).
// ---------------------------------------------------------------------------
const getDealColumns = (currency: CurrencyCode): ColumnDef<Deal>[] => [
  {
    accessorKey: 'title',
    header: 'Deal',
    cell: ({ row }) => (
      <div>
        <p className="font-semibold text-brand-primary">{row.original.title}</p>
        <p className="text-[11px] text-brand-subtle">{row.original.deal_code}</p>
      </div>
    ),
  },
  {
    id: 'company',
    header: 'Company',
    cell: ({ row }) => {
      const d = row.original;
      return <span>{d.customer?.company || d.customer?.name || d.lead?.company || d.lead?.name || '—'}</span>;
    },
  },
  {
    accessorKey: 'value',
    header: 'Value',
    cell: ({ row }) => (
      <span className="font-semibold">
        <CurrencyAmount amount={row.original.value} currency={currency} />
      </span>
    ),
  },
  {
    accessorKey: 'stage',
    header: 'Stage',
    cell: ({ row }) => <StatusBadge status={row.original.stage} />,
  },
  {
    accessorKey: 'probability',
    header: 'Probability',
    cell: ({ row }) => <span>{row.original.probability ?? 0}%</span>,
  },
  {
    id: 'next_action',
    header: 'Next Action',
    cell: ({ row }) => {
      const d = row.original;
      if (!d.next_action_at) return <span className="text-brand-subtle">—</span>;
      const overdue = isPast(new Date(d.next_action_at)) && !CLOSED_STAGES.includes(d.stage);
      return (
        <span className={overdue ? 'text-brand-danger font-semibold' : ''}>
          {new Date(d.next_action_at).toLocaleString()}
        </span>
      );
    },
  },
  {
    id: 'owner',
    header: 'Owner',
    cell: ({ row }) => row.original.user?.name || '—',
  },
];

interface LostCancelState {
  dealId: number;
  stage: DealStage;
  beforeId: number | null;
  afterId: number | null;
}

export default function DealsPage() {
  const currency = useCurrencyStore((s) => s.currency);
  const [searchParams, setSearchParams] = useSearchParams();

  const viewMode = useDealsViewModeStore((s) => s.viewMode);
  const setViewMode = useDealsViewModeStore((s) => s.setViewMode);

  const { filters, setFilter, resetFilters } = useDealsFiltersStore();

  const selectedDealId = useSelectedDealStore((s) => s.selectedDealId);
  const setSelectedDealId = useSelectedDealStore((s) => s.setSelectedDealId);

  const [createDealOpen, setCreateDealOpen] = useState(false);
  const [createDealDefaultStage, setCreateDealDefaultStage] = useState<DealStage | undefined>(undefined);

  const [lostCancelState, setLostCancelState] = useState<LostCancelState | null>(null);

  const updateDeal = useUpdateDeal();

  const { data: pipelineStats, isLoading: statsLoading } = usePipelineStats({
    owner_id: filters.ownerId,
    company_id: filters.companyId,
    tag_id: filters.tagId,
    search: filters.search || undefined,
    priority: (filters.priority as Deal['priority']) || undefined,
  });

  // Deep-link support: /workspace/deals?dealId=123 (used by the Calendar
  // page's follow-up cards) opens that deal's detail drawer on load.
  useEffect(() => {
    const dealId = searchParams.get('dealId');
    if (dealId) setSelectedDealId(Number(dealId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mobile default: Kanban's multi-column layout is cramped on small
  // screens, so default to List on first mount when below the `md`
  // breakpoint. Runs once — any explicit toggle afterwards (via
  // DealsHeader) is never overridden since this effect doesn't re-run.
  useEffect(() => {
    const isMobile = !window.matchMedia('(min-width: 768px)').matches;
    if (isMobile) setViewMode('list');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the URL in sync whenever the selected deal changes (opening a deal
  // from the Kanban/list view, or closing the drawer) so deep-linking and
  // page refreshes keep working the same way the old Deals.tsx behaved.
  useEffect(() => {
    if (selectedDealId) {
      if (searchParams.get('dealId') !== String(selectedDealId)) {
        searchParams.set('dealId', String(selectedDealId));
        setSearchParams(searchParams, { replace: true });
      }
    } else if (searchParams.has('dealId')) {
      searchParams.delete('dealId');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDealId]);

  const handleNewDeal = () => {
    setCreateDealDefaultStage(undefined);
    setCreateDealOpen(true);
  };

  const handleAddDeal = (stage: DealStage) => {
    setCreateDealDefaultStage(stage);
    setCreateDealOpen(true);
  };

  const handleRequireLostReason = (
    dealId: number,
    stage: DealStage,
    beforeId: number | null,
    afterId: number | null
  ) => {
    setLostCancelState({ dealId, stage, beforeId, afterId });
  };

  const handleLostCancelConfirm = (reason: DealLostCancelReason) => {
    if (!lostCancelState) return;
    updateDeal.mutate(
      { id: lostCancelState.dealId, data: { stage: lostCancelState.stage, ...reason } },
      { onSuccess: () => setLostCancelState(null) }
    );
  };

  // ---- List view data (unchanged from the old Deals.tsx) ----
  const [stageFilter, setStageFilter] = useState<DealStage | 'all'>('all');

  const { data: pipeline, isLoading: listLoading } = useQuery({
    queryKey: ['deals', 'pipeline'],
    queryFn: async () => (await api.get('/admin/deals/pipeline')).data.data as PipelineResponse,
    enabled: viewMode === 'list',
  });

  const allDeals = useMemo(() => Object.values(pipeline ?? {}).flatMap((g) => g.deals), [pipeline]);
  const filteredDeals = useMemo(
    () => (stageFilter === 'all' ? allDeals : allDeals.filter((d) => d.stage === stageFilter)),
    [allDeals, stageFilter]
  );

  // NOTE: /admin/deals/pipeline returns the full unpaginated deal list (it's
  // shared with the Kanban board, which needs every deal per stage), so the
  // List view paginates client-side. A true DB-level page/per_page endpoint
  // would need a backend follow-up if this list grows large.
  const [listPage, setListPage] = useState(1);
  const [listPerPage, setListPerPage] = useState(10);
  useEffect(() => { setListPage(1); }, [stageFilter]);
  const pagedDeals = useMemo(
    () => filteredDeals.slice((listPage - 1) * listPerPage, listPage * listPerPage),
    [filteredDeals, listPage, listPerPage]
  );
  const listLastPage = Math.max(1, Math.ceil(filteredDeals.length / listPerPage));

  return (
    <div className="bg-brand-white flex flex-col h-full overflow-hidden animate-in fade-in duration-200">
      <SEO title="Deals" />

      <DealsHeader viewMode={viewMode} onViewModeChange={setViewMode} onNewDeal={handleNewDeal} />
      <DealStats stats={pipelineStats?.data} isLoading={statsLoading} />
      <DealFilters filters={filters} onChange={setFilter} onReset={resetFilters} />

      <div className="flex-1 overflow-auto bg-brand-white px-3 pt-2">
        {viewMode === 'kanban' ? (
          <KanbanBoard
            filters={filters}
            onOpenDeal={setSelectedDealId}
            onEditDeal={setSelectedDealId}
            onConvertToQuote={setSelectedDealId}
            onAddDeal={handleAddDeal}
            onRequireLostReason={handleRequireLostReason}
          />
        ) : listLoading ? (
          <PageLoader label="Loading deals..." iconSize={32} className="h-full min-h-[400px] gap-3" />
        ) : (
          <div className="pb-3 space-y-3">
            <div className="flex justify-end">
              <Select value={stageFilter} onValueChange={(v) => setStageFilter(v as DealStage | 'all')}>
                <SelectTrigger className="h-[34px] w-40 text-[12px] rounded-lg font-medium">
                  <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {STAGES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DataTable<Deal, unknown>
              columns={getDealColumns(currency)}
              data={pagedDeals}
              onRowClick={(deal) => setSelectedDealId(deal.id)}
              hidePagination
            />
            <Pagination
              page={listPage}
              perPage={listPerPage}
              total={filteredDeals.length}
              lastPage={listLastPage}
              onPageChange={setListPage}
              onPerPageChange={(next) => { setListPerPage(next); setListPage(1); }}
            />
          </div>
        )}
      </div>

      <DealDrawer />
      <CreateDealDialog
        open={createDealOpen}
        onOpenChange={setCreateDealOpen}
        defaultStage={createDealDefaultStage}
      />
      <DealLostCancelDialog
        open={lostCancelState !== null}
        targetStage={(lostCancelState?.stage ?? 'lost') as 'lost' | 'cancelled'}
        onConfirm={handleLostCancelConfirm}
        onCancel={() => setLostCancelState(null)}
        isSubmitting={updateDeal.isPending}
      />
    </div>
  );
}
