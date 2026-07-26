import { useCallback, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import * as dealsApi from '@/api/dealsApi';
import type { MoveDealPayload } from '@/api/dealsApi';
import { useDealsColumnsStore } from '@/store/useDealsColumnsStore';
import { useDealsDragStore } from '@/store/useDealsDragStore';
import type { DealsFilters } from '@/store/useDealsFiltersStore';
import { KANBAN_COLUMNS } from './KanbanColumn.config';
import { KanbanColumn } from './KanbanColumn';
import { DealCard } from './DealCard';
import { usePipelineStats } from '@/hooks/useDeals';
import type { Deal, DealStage } from '@/types';

interface KanbanBoardProps {
  filters: DealsFilters;
  onOpenDeal: (id: number) => void;
  onEditDeal: (id: number) => void;
  onConvertToQuote: (id: number) => void;
  onAddDeal: (stage: DealStage) => void;
  onRequireLostReason?: (
    dealId: number,
    stage: DealStage,
    beforeId: number | null,
    afterId: number | null
  ) => void;
}

function findContainerForDealId(columns: Record<string, number[]>, dealId: number): string | undefined {
  return Object.keys(columns).find((key) => columns[key]?.includes(dealId));
}

/**
 * Owns the DndContext for the whole board: sensors, collision detection,
 * live cross-column reordering (onDragOver), and the optimistic move
 * mutation + rollback (onDragEnd).
 */
export function KanbanBoard({
  filters,
  onOpenDeal,
  onEditDeal,
  onConvertToQuote,
  onAddDeal,
  onRequireLostReason,
}: KanbanBoardProps) {
  const queryClient = useQueryClient();

  const draggingDealId = useDealsDragStore((s) => s.draggingDealId);
  const draggingFromStage = useDealsDragStore((s) => s.draggingFromStage);
  const setDragging = useDealsDragStore((s) => s.setDragging);
  const reorderWithinColumn = useDealsColumnsStore((s) => s.reorderWithinColumn);
  const moveCardAcrossColumns = useDealsColumnsStore((s) => s.moveCardAcrossColumns);

  const { data: pipelineStats } = usePipelineStats({
    owner_id: filters.ownerId,
    company_id: filters.companyId,
    tag_id: filters.tagId,
    search: filters.search || undefined,
    priority: (filters.priority as Deal['priority']) || undefined,
  });

  const statsByColumn = KANBAN_COLUMNS.reduce<Record<string, { count: number; value: number }>>((acc, col) => {
    const stages = Array.isArray(col.stageFilter) ? col.stageFilter : [col.stageFilter];
    acc[col.key] = stages.reduce(
      (sum, stage) => ({
        count: sum.count + (pipelineStats?.data?.[stage]?.count ?? 0),
        value: sum.value + (pipelineStats?.data?.[stage]?.value ?? 0),
      }),
      { count: 0, value: 0 }
    );
    return acc;
  }, {});

  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

  // Snapshot of ALL columns' ID arrays taken at drag start, for rollback on
  // a rejected/failed move. A ref (not state) since it never needs to
  // trigger a render.
  const snapshotRef = useRef<Record<string, number[]> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const restoreSnapshot = useCallback(() => {
    if (snapshotRef.current) {
      useDealsColumnsStore.setState({ columns: snapshotRef.current });
    }
  }, []);

  // Local mutation (rather than extending useMoveDeal in useDeals.ts) since
  // the optimistic rollback needs direct access to the drag snapshot ref and
  // drag-store cleanup that live only in this component — less invasive
  // than threading per-call options through the shared hook.
  const moveMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: number } & MoveDealPayload) => dealsApi.moveDeal(id, payload),
    onError: () => {
      restoreSnapshot();
      toast.error('Failed to move deal — reverted.');
    },
    onSettled: () => {
      if (useDealsDragStore.getState().draggingDealId === null) {
        queryClient.invalidateQueries({ queryKey: ['deals'] });
      }
    },
  });

  const getDealById = useCallback(
    (id: number) => queryClient.getQueryData<Deal>(['deals', 'byId', id]),
    [queryClient]
  );

  const performMove = useCallback(
    (dealId: number, stage: DealStage, beforeId: number | null, afterId: number | null) => {
      const deal = getDealById(dealId);
      const alreadyClosedLost = deal?.stage === 'lost' || deal?.stage === 'cancelled';

      if (stage === 'lost' && !alreadyClosedLost && !deal?.lost_reason && onRequireLostReason) {
        // The "collect lost reason" dialog is a separate, not-yet-built work
        // stream (DealLostCancelDialog). Hand off to it instead of firing
        // the move with no reason.
        onRequireLostReason(dealId, stage, beforeId, afterId);
        return;
      }

      moveMutation.mutate({ id: dealId, stage, before_id: beforeId, after_id: afterId });
    },
    [getDealById, moveMutation, onRequireLostReason]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const data = event.active.data.current as { dealId?: number; stage?: DealStage } | undefined;
      const dealId = (data?.dealId ?? Number(event.active.id)) as number;
      const fromStage = data?.stage ?? findContainerForDealId(useDealsColumnsStore.getState().columns, dealId);

      snapshotRef.current = { ...useDealsColumnsStore.getState().columns };
      setDragging(dealId, fromStage ?? null);
      setActiveDeal(getDealById(dealId) ?? null);
    },
    [setDragging, getDealById]
  );

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id;

    const columns = useDealsColumnsStore.getState().columns;
    const activeContainer = findContainerForDealId(columns, activeId);
    const overContainer =
      typeof overId === 'string' && KANBAN_COLUMNS.some((c) => c.key === overId)
        ? overId
        : findContainerForDealId(columns, overId as number);

    if (!activeContainer || !overContainer) return;

    if (activeContainer !== overContainer) {
      const overItems = columns[overContainer] ?? [];
      const overIndex = typeof overId === 'number' ? overItems.indexOf(overId) : -1;
      moveCardAcrossColumns(activeContainer, overContainer, activeId, overIndex === -1 ? overItems.length : overIndex);
    } else {
      const items = columns[activeContainer] ?? [];
      const oldIndex = items.indexOf(activeId);
      const newIndex = typeof overId === 'number' ? items.indexOf(overId) : items.length - 1;
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        reorderWithinColumn(activeContainer, oldIndex, newIndex);
      }
    }
  }, [moveCardAcrossColumns, reorderWithinColumn]);

  const cleanupDrag = useCallback(() => {
    setDragging(null, null);
    setActiveDeal(null);
    snapshotRef.current = null;
  }, [setDragging]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const dealId = active.id as number;

      if (!over) {
        restoreSnapshot();
        cleanupDrag();
        return;
      }

      const columnsNow = useDealsColumnsStore.getState().columns;
      const targetColumnKey = findContainerForDealId(columnsNow, dealId);
      const targetConfig = KANBAN_COLUMNS.find((c) => c.key === targetColumnKey);

      if (!targetConfig) {
        restoreSnapshot();
        cleanupDrag();
        return;
      }

      const targetIds = columnsNow[targetColumnKey!] ?? [];
      const index = targetIds.indexOf(dealId);
      const beforeId = index > 0 ? targetIds[index - 1] : null;
      const afterId = index >= 0 && index < targetIds.length - 1 ? targetIds[index + 1] : null;

      performMove(dealId, targetConfig.writeStage, beforeId, afterId);
      cleanupDrag();
    },
    [performMove, restoreSnapshot, cleanupDrag]
  );

  const handleDragCancel = useCallback(() => {
    restoreSnapshot();
    cleanupDrag();
  }, [restoreSnapshot, cleanupDrag]);

  // Non-drag stage change (the "Move to stage" submenu in DealCard's "More"
  // dropdown) — the required keyboard-accessible alternative to dragging.
  const handleMoveToStage = useCallback(
    (dealId: number, stage: DealStage) => {
      const columns = useDealsColumnsStore.getState().columns;
      const fromKey = findContainerForDealId(columns, dealId);
      const targetConfig = KANBAN_COLUMNS.find((c) => c.writeStage === stage);
      if (!targetConfig || !fromKey || fromKey === targetConfig.key) return;

      snapshotRef.current = { ...columns };
      const targetIds = columns[targetConfig.key] ?? [];
      moveCardAcrossColumns(fromKey, targetConfig.key, dealId, targetIds.length);

      const beforeId = targetIds.length > 0 ? targetIds[targetIds.length - 1] : null;
      performMove(dealId, stage, beforeId, null);
      snapshotRef.current = null;
    },
    [moveCardAcrossColumns, performMove]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      autoScroll={{ enabled: true, layoutShiftCompensation: false, acceleration: 10 }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-3 overflow-x-auto h-full pb-3 snap-x snap-mandatory sm:snap-none">
        {KANBAN_COLUMNS.map((config) => (
          <KanbanColumn
            key={config.key}
            config={config}
            filters={filters}
            stats={statsByColumn[config.key]}
            onOpenDeal={onOpenDeal}
            onEditDeal={onEditDeal}
            onConvertToQuote={onConvertToQuote}
            onMoveToStage={handleMoveToStage}
            onAddDeal={onAddDeal}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal ? (
          <motion.div
            initial={{ scale: 1, rotate: 0 }}
            animate={{ scale: 1.03, rotate: 1.5 }}
            className="w-[280px] shadow-2xl rounded-2xl"
          >
            <DealCard
              deal={activeDeal}
              onOpen={onOpenDeal}
              onEdit={onEditDeal}
              onConvertToQuote={onConvertToQuote}
              onMoveToStage={handleMoveToStage}
            />
          </motion.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
