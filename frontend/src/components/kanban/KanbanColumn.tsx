import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { ReactNode } from 'react';

interface KanbanColumnProps {
  id: string;
  label: string;
  count: number;
  colorClassName?: string;
  emptyLabel?: string;
  headerExtra?: ReactNode;
  children: ReactNode;
}

export function KanbanColumn({
  id,
  label,
  count,
  colorClassName = 'bg-gray-500',
  emptyLabel = 'Drop here',
  headerExtra,
  children,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${id}`, data: { stage: id } });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'w-[320px] flex-shrink-0 flex flex-col bg-admin-bg rounded-2xl p-4 border border-admin-border transition-colors duration-200',
        isOver && 'bg-admin-surface-hover border-zeronix-blue/40'
      )}
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-sm font-black capitalize tracking-wider text-admin-text-primary flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full', colorClassName)} />
          {label.replace(/_/g, ' ')}
        </h2>
        <div className="flex items-center gap-1.5">
          {headerExtra}
          <Badge variant="secondary" className="text-[10px] font-black h-5 px-1.5 bg-admin-surface border-admin-border">
            {count}
          </Badge>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1 min-h-[100px]">
        {count === 0 && (
          <div className="h-24 rounded-xl border border-dashed border-admin-border/50 flex items-center justify-center">
            <p className="text-[11px] font-bold text-admin-text-muted italic">{emptyLabel}</p>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
