import { memo, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { ChevronDown, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useColumnDeals } from '@/hooks/useDeals';
import { useDealsColumnsStore } from '@/store/useDealsColumnsStore';
import { useDealsDragStore } from '@/store/useDealsDragStore';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { CurrencyAmount } from '@/components/shared/CurrencyAmount';
import { DealCard } from './DealCard';
import { DealsEmptyState } from './DealsEmptyState';
import { KanbanColumnSkeleton } from './KanbanColumnSkeleton';
import type { KanbanColumnConfig } from './KanbanColumn.config';
import type { DealsFilters } from '@/store/useDealsFiltersStore';
import type { Deal, DealStage } from '@/types';

const ESTIMATED_CARD_HEIGHT = 190;

interface KanbanColumnProps {
  config: KanbanColumnConfig;
  filters: DealsFilters;
  stats?: { count: number; value: number };
  onOpenDeal: (id: number) => void;
  onEditDeal: (id: number) => void;
  onConvertToQuote: (id: number) => void;
  onMoveToStage: (id: number, stage: DealStage) => void;
  onAddDeal: (stage: DealStage) => void;
}

export const KanbanColumn = memo(function KanbanColumn({
  config,
  filters,
  stats,
  onOpenDeal,
  onEditDeal,
  onConvertToQuote,
  onMoveToStage,
  onAddDeal,
}: KanbanColumnProps) {
  const queryClient = useQueryClient();
  const currency = useCurrencyStore((s) => s.currency);

  const collapsed = useDealsColumnsStore((s) => !!s.collapsedColumns[config.key]);
  const toggleCollapsed = useDealsColumnsStore((s) => s.toggleCollapsed);
  const setColumnIds = useDealsColumnsStore((s) => s.setColumnIds);
  const ids = useDealsColumnsStore((s) => s.columns[config.key] ?? []);
  const draggingDealId = useDealsDragStore((s) => s.draggingDealId);

  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useColumnDeals(config.stageFilter, {
    owner_id: filters.ownerId,
    tag_id: filters.tagId,
    search: filters.search || undefined,
    priority: (filters.priority as Deal['priority']) || undefined,
  });

  const flatDeals = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

  // Cache individual deals by id so cards that live in this column's ordered
  // ID list (via the columns store) but were fetched under a *different*
  // column's query (e.g. just dragged in from another stage, cache not yet
  // refetched) can still be resolved for rendering.
  useEffect(() => {
    flatDeals.forEach((deal) => {
      queryClient.setQueryData(['deals', 'byId', deal.id], deal);
    });
  }, [flatDeals, queryClient]);

  const localDealsMap = useMemo(() => new Map(flatDeals.map((d) => [d.id, d])), [flatDeals]);

  const getDealById = (id: number): Deal | undefined =>
    localDealsMap.get(id) ?? queryClient.getQueryData<Deal>(['deals', 'byId', id]);

  // Sync the flattened, freshly-fetched ID list into the shared columns
  // store — but skip while ANY drag is in flight so a stale background
  // refetch can't clobber an in-flight optimistic reorder/cross-column move.
  useEffect(() => {
    if (draggingDealId !== null) return;
    setColumnIds(config.key, flatDeals.map((d) => d.id));
  }, [flatDeals, draggingDealId, config.key, setColumnIds]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: config.key,
    data: { type: 'column', columnKey: config.key, stage: config.writeStage },
  });

  const setRefs = (node: HTMLDivElement | null) => {
    scrollRef.current = node;
    setDroppableRef(node);
  };

  const showLoadMoreRow = !!hasNextPage;
  const rowCount = ids.length + (showLoadMoreRow ? 1 : 0);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ESTIMATED_CARD_HEIGHT,
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Infinite-scroll feel: fetch the next page once the last few rendered
  // rows are close to the end of what's currently loaded.
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;
    if (lastItem.index >= ids.length - 3) {
      fetchNextPage();
    }
  }, [virtualItems, hasNextPage, isFetchingNextPage, ids.length, fetchNextPage]);

  const isFirstLoad = isLoading && ids.length === 0;
  const isEmpty = !isLoading && ids.length === 0;

  return (
    <div className="flex flex-col w-[85vw] max-w-[300px] sm:w-[300px] shrink-0 snap-start rounded-2xl bg-brand-surface/60 border border-brand-border/40 h-full">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-brand-border/40 shrink-0">
        <button
          type="button"
          onClick={() => toggleCollapsed(config.key)}
          className="flex items-center gap-1.5 min-w-0 text-left"
        >
          {collapsed ? (
            <ChevronRight size={14} className="text-brand-subtle shrink-0" />
          ) : (
            <ChevronDown size={14} className="text-brand-subtle shrink-0" />
          )}
          <span className="text-[12px] font-bold text-brand-primary truncate">{config.label}</span>
          <span className="text-[10px] font-semibold text-brand-subtle bg-brand-white rounded-full px-1.5 py-0.5 shrink-0">
            {stats?.count ?? ids.length}
          </span>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onAddDeal(config.writeStage)}
          className="h-6 w-6 rounded-lg text-brand-subtle hover:text-brand-primary shrink-0"
          title={`Add deal to ${config.label}`}
        >
          <Plus size={14} />
        </Button>
      </div>

      {!collapsed && (stats?.value ?? 0) > 0 && (
        <div className="px-3 py-1.5 text-[11px] font-semibold text-brand-subtle border-b border-brand-border/30 shrink-0">
          <CurrencyAmount amount={stats?.value ?? 0} currency={currency} />
        </div>
      )}

      {!collapsed && (
        <div ref={setRefs} className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 min-h-[120px]">
          {isFirstLoad ? (
            <KanbanColumnSkeleton />
          ) : isEmpty ? (
            <DealsEmptyState message="No deals in this column." />
          ) : (
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
                {virtualItems.map((virtualRow) => {
                  const isLoadMoreRow = virtualRow.index >= ids.length;
                  const dealId = !isLoadMoreRow ? ids[virtualRow.index] : undefined;
                  const deal = dealId !== undefined ? getDealById(dealId) : undefined;

                  return (
                    <div
                      key={virtualRow.key}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                        paddingBottom: 10,
                      }}
                    >
                      {isLoadMoreRow ? (
                        <div className="flex justify-center py-2">
                          {isFetchingNextPage ? (
                            <Loader2 size={16} className="animate-spin text-brand-subtle" />
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => fetchNextPage()}
                              className="h-[28px] rounded-lg text-[11px]"
                            >
                              Load more
                            </Button>
                          )}
                        </div>
                      ) : deal ? (
                        <DealCard
                          deal={deal}
                          onOpen={onOpenDeal}
                          onEdit={onEditDeal}
                          onConvertToQuote={onConvertToQuote}
                          onMoveToStage={onMoveToStage}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
});
