import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface KanbanCardProps {
  id: number;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}

export function KanbanCard({ id, onClick, className, children }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `card-${id}`,
    data: { cardId: id },
  });

  return (
    <div
      ref={setNodeRef}
      style={transform ? { transform: CSS.Translate.toString(transform) } : undefined}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(
        'cursor-grab active:cursor-grabbing touch-none select-none transition-opacity',
        isDragging && 'opacity-40',
        className
      )}
    >
      {children}
    </div>
  );
}
