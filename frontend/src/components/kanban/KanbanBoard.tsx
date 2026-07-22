import { useState } from 'react';
import type { ReactNode } from 'react';
import { DndContext, DragOverlay, PointerSensor, closestCorners, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';

export interface KanbanColumnConfig {
  id: string;
  label: string;
  colorClassName?: string;
}

interface KanbanBoardProps<T extends { id: number }> {
  columns: KanbanColumnConfig[];
  items: T[];
  getItemStage: (item: T) => string;
  onItemMove: (itemId: number, newStage: string) => void;
  onItemClick?: (item: T) => void;
  renderCard: (item: T) => ReactNode;
  headerExtra?: (columnId: string) => ReactNode;
  emptyLabel?: string;
}

/**
 * Generic drag-and-drop Kanban board (dnd-kit). Shared by Deals and Enquiries
 * so both boards behave identically and stay in one place to maintain.
 */
export function KanbanBoard<T extends { id: number }>({
  columns,
  items,
  getItemStage,
  onItemMove,
  onItemClick,
  renderCard,
  headerExtra,
  emptyLabel,
}: KanbanBoardProps<T>) {
  const [activeItem, setActiveItem] = useState<T | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragStart = (event: DragStartEvent) => {
    const cardId = event.active.data.current?.cardId as number | undefined;
    setActiveItem(items.find((i) => i.id === cardId) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const cardId = active.data.current?.cardId as number | undefined;
    const targetStage = over.data.current?.stage as string | undefined;
    if (!cardId || !targetStage) return;

    const item = items.find((i) => i.id === cardId);
    if (item && getItemStage(item) !== targetStage) {
      onItemMove(cardId, targetStage);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveItem(null)}
    >
      <div className="flex overflow-x-auto gap-4 p-2 pb-6 min-h-[500px]">
        {columns.map((col) => {
          const cards = items.filter((item) => getItemStage(item) === col.id);
          return (
            <KanbanColumn
              key={col.id}
              id={col.id}
              label={col.label}
              count={cards.length}
              colorClassName={col.colorClassName}
              emptyLabel={emptyLabel}
              headerExtra={headerExtra?.(col.id)}
            >
              {cards.map((item) => (
                <KanbanCard key={item.id} id={item.id} onClick={() => onItemClick?.(item)}>
                  {renderCard(item)}
                </KanbanCard>
              ))}
            </KanbanColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeItem ? <div className="rotate-2 shadow-2xl">{renderCard(activeItem)}</div> : null}
      </DragOverlay>
    </DndContext>
  );
}
