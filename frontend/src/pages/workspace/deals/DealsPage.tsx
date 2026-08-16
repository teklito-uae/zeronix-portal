import { useEffect, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { isPast, format } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import Avatar from 'boring-avatars';
import * as dealsApi from '@/api/dealsApi';
import type { Deal, DealStage } from '@/types';
import type { CurrencyCode } from '@/lib/currency';
import { SEO } from '@/components/shared/SEO';
import { PageLoader } from '@/components/shared/PageLoader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SharedTagBadge } from '@/components/shared/SharedTagBadge';
import { DataTable } from '@/components/shared/DataTable';
import { Pagination } from '@/components/shared/Pagination';
import { CurrencyAmount } from '@/components/shared/CurrencyAmount';
import { Button } from '@/components/ui/button';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { avatarColorsFor } from '@/lib/avatarColors';
import { toTitleCase } from '@/lib/utils';
import { KanbanSquare, List, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useDealsViewModeStore } from '@/store/useDealsViewModeStore';
import { useDealsFiltersStore } from '@/store/useDealsFiltersStore';
import { useSelectedDealStore } from '@/store/useSelectedDealStore';
import { usePipelineStats, useUpdateDeal } from '@/hooks/useDeals';
import { useTopbarActions } from '@/hooks/useTopbarActions';

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

// ---------------------------------------------------------------------------
// List view columns
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
    id: 'tags',
    header: 'Tags',
    cell: ({ row }) => {
      const tags = row.original.tags ?? [];
      if (tags.length === 0) return <span className="text-brand-subtle">—</span>;
      const visible = tags.slice(0, 2);
      const rest = tags.length - visible.length;
      return (
        <div className="flex flex-wrap items-center gap-1 max-w-[160px]">
          {visible.map((t) => (
            <SharedTagBadge key={t.id} tag={t.name} color={t.color} className="px-2 py-0.5" />
          ))}
          {rest > 0 && <span className="text-[11px] text-brand-subtle font-medium">+{rest}</span>}
        </div>
      );
    },
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
    cell: ({ row }) => {
      const owner = row.original.user;
      if (!owner) return <span className="text-brand-subtle">Unassigned</span>;
      return (
        <div className="flex items-center gap-1.5" title={owner.name}>
          <Avatar size={20} name={owner.name} variant="beam" colors={avatarColorsFor(owner)} />
          <span className="text-[12px] font-medium text-brand-secondary truncate max-w-[110px]">
            {toTitleCase(owner.name)}
          </span>
        </div>
      );
    },
  },
  {
    id: 'created_at',
    header: 'Created',
    cell: ({ row }) => {
      const created = row.original.created_at;
      if (!created) return <span className="text-brand-subtle">—</span>;
      return <span className="text-brand-subtle">{format(new Date(created), 'dd MMM yyyy')}</span>;
    },
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

  // ---- List view data: server-side filtered + paginated via the same
  // /admin/deals index endpoint the Kanban columns use, so every filter in
  // DealFilters (search/owner/company/tag/priority) actually applies here
  // too — the old version fetched the unfiltered pipeline() endpoint and
  // only ever filtered by stage, client-side.
  const [stageFilter, setStageFilter] = useState<DealStage | 'all'>('all');
  const [listPage, setListPage] = useState(1);
  const [listPerPage, setListPerPage] = useState(10);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: resets to page 1 whenever any filter changes, so a stale page number from a previous filter set doesn't produce an out-of-range/empty page.
    setListPage(1);
  }, [stageFilter, filters.search, filters.ownerId, filters.companyId, filters.tagId, filters.priority]);

  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ['deals', 'list', stageFilter, listPage, listPerPage, filters],
    queryFn: () =>
      dealsApi.getDealsPage({
        stage: stageFilter === 'all' ? undefined : stageFilter,
        page: listPage,
        per_page: listPerPage,
        owner_id: filters.ownerId,
        company_id: filters.companyId,
        tag_id: filters.tagId,
        search: filters.search || undefined,
        priority: (filters.priority as Deal['priority']) || undefined,
      }),
    enabled: viewMode === 'list',
    placeholderData: keepPreviousData,
  });

  const pagedDeals = listData?.data ?? [];
  const listLastPage = listData?.last_page ?? 1;
  const listTotal = listData?.total ?? 0;

  // Page actions render in the shared Topbar (top-right), not in a
  // duplicate page-local header bar.
  useTopbarActions(
    <>
      <div className="flex items-center gap-0.5 bg-brand-surface border border-brand-border rounded-lg p-0.5">
        <button
          type="button"
          onClick={() => setViewMode('list')}
          className={cn(
            'flex items-center gap-1.5 px-2.5 h-[26px] rounded-md text-[12px] font-medium transition-colors',
            viewMode === 'list'
              ? 'bg-brand-white text-brand-primary shadow-sm'
              : 'text-brand-subtle hover:text-brand-primary'
          )}
        >
          <List size={13} /> List
        </button>
        <button
          type="button"
          onClick={() => setViewMode('kanban')}
          className={cn(
            'flex items-center gap-1.5 px-2.5 h-[26px] rounded-md text-[12px] font-medium transition-colors',
            viewMode === 'kanban'
              ? 'bg-brand-white text-brand-primary shadow-sm'
              : 'text-brand-subtle hover:text-brand-primary'
          )}
        >
          <KanbanSquare size={13} /> Pipeline
        </button>
      </div>
      <Button onClick={handleNewDeal} size="sm" className="rounded-lg shadow-sm">
        <Plus size={14} /> <span className="hidden sm:inline">New Deal</span>
      </Button>
    </>
  );

  return (
    <div className="bg-brand-white flex flex-col h-full overflow-hidden animate-in fade-in duration-200">
      <SEO title="Deals" />

      <DealStats stats={pipelineStats?.data} isLoading={statsLoading} />

      <DealFilters
        filters={filters}
        onChange={setFilter}
        onReset={resetFilters}
        stageFilter={viewMode === 'list' ? stageFilter : undefined}
        onStageFilterChange={viewMode === 'list' ? setStageFilter : undefined}
      />

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
        ) : listLoading && !listData ? (
          <PageLoader label="Loading deals..." iconSize={32} className="h-full min-h-[400px] gap-3" />
        ) : (
          <div className="pb-3">
            <DataTable<Deal, unknown>
              columns={getDealColumns(currency)}
              data={pagedDeals}
              onRowClick={(deal) => setSelectedDealId(deal.id)}
              hidePagination
            />
          </div>
        )}
      </div>

      {/* Pagination — kept outside the scrollable content area (like
          ResourceListingPage's list pages, e.g. Companies) so it stays
          pinned to the bottom of the page instead of scrolling with the
          table. */}
      {viewMode === 'list' && !(listLoading && !listData) && (
        <Pagination
          page={listPage}
          perPage={listPerPage}
          total={listTotal}
          lastPage={listLastPage}
          onPageChange={setListPage}
          onPerPageChange={(next) => { setListPerPage(next); setListPage(1); }}
        />
      )}

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
