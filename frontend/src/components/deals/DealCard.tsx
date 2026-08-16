import { memo, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, formatDistanceToNow } from 'date-fns';
import Avatar from 'boring-avatars';
import { Building2, Calendar, Clock, Eye, MoreHorizontal, Pencil, FileText, ChevronRight } from 'lucide-react';
import { CurrencyAmount } from '@/components/shared/CurrencyAmount';
import { SharedTagBadge } from '@/components/shared/SharedTagBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { KANBAN_COLUMNS } from './KanbanColumn.config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { cn, toTitleCase } from '@/lib/utils';
import { avatarColorsFor } from '@/lib/avatarColors';
import type { Deal, DealStage } from '@/types';

interface DealCardProps {
  deal: Deal;
  onOpen: (id: number) => void;
  onEdit: (id: number) => void;
  onConvertToQuote: (id: number) => void;
  onMoveToStage: (id: number, stage: DealStage) => void;
}

export const DealCard = memo(function DealCard({ deal, onOpen, onEdit, onConvertToQuote, onMoveToStage }: DealCardProps) {
  const currency = useCurrencyStore((s) => s.currency);

  const sortableData = useMemo(
    () => ({ type: 'card' as const, dealId: deal.id, stage: deal.stage }),
    [deal.id, deal.stage]
  );

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
    data: sortableData,
  });

  // Plain CSS transform/transition here (not framer-motion) — dnd-kit
  // updates `transform` on every pointer-move frame during a drag, and a
  // motion component intercepting that same property fights the drag
  // engine's own RAF loop, which is what caused the drag-time jank. The
  // drag-scale is folded into this same transform string (rather than a
  // Tailwind `scale-*` class) since an inline `transform` style overrides
  // any class-based transform.
  const style = {
    transform: [CSS.Transform.toString(transform), isDragging ? 'scale(1.02)' : null]
      .filter(Boolean)
      .join(' '),
    transition,
  };

  const owner = deal.primary_assignee ?? deal.user;
  const company = deal.customer?.company || deal.customer?.name || deal.lead?.company || deal.lead?.name;

  const visibleTags = deal.tags?.slice(0, 3) ?? [];
  const overflowTagsCount = (deal.tags?.length ?? 0) - visibleTags.length;

  const lastActivity = useMemo(() => {
    const activities = deal.activities;
    if (activities && activities.length > 0) {
      const latest = [...activities].sort(
        (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      )[0];
      if (latest?.created_at) return latest.created_at;
    }
    return deal.updated_at ?? null;
  }, [deal.activities, deal.updated_at]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group relative rounded-2xl border border-brand-border/50 bg-brand-white p-3.5 cursor-grab active:cursor-grabbing',
        'shadow-sm hover:shadow-md transition-[transform,box-shadow,opacity] duration-150',
        isDragging && 'opacity-60 shadow-lg'
      )}
      onClick={() => onOpen(deal.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {owner && <Avatar size={18} name={owner.name} variant="beam" colors={avatarColorsFor(owner)} />}
          <span className="text-[11px] font-medium text-brand-subtle truncate">{owner?.name ? toTitleCase(owner.name) : 'Unassigned'}</span>
        </div>
        <PriorityBadge priority={deal.priority} />
      </div>

      <div className="mt-2 min-w-0">
        <p className="text-[13px] font-bold text-brand-primary leading-tight truncate">{deal.title}</p>
        {company && (
          <p className="text-[11px] text-brand-subtle flex items-center gap-1 mt-0.5 truncate font-medium">
            <Building2 size={10} className="shrink-0" />
            {toTitleCase(company)}
          </p>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <p className="text-[13px] font-bold text-brand-primary">
          <CurrencyAmount amount={deal.value} currency={currency} />
        </p>
        {deal.stage === 'cancelled' && <StatusBadge status="cancelled" className="text-[10px] px-1.5 py-0" />}
      </div>

      {(visibleTags.length > 0 || overflowTagsCount > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {visibleTags.map((tag) => (
            <SharedTagBadge key={tag.id} tag={tag.name} color={tag.color} className="px-1.5 py-0 text-[10px]" />
          ))}
          {overflowTagsCount > 0 && (
            <span className="text-[11px] font-semibold text-brand-subtle px-1">+{overflowTagsCount}</span>
          )}
        </div>
      )}

      <div className="mt-2.5 pt-2 border-t border-brand-border/30 flex items-center justify-between text-[11px] text-brand-subtle">
        {deal.expected_close_date ? (
          <span className="flex items-center gap-1">
            <Calendar size={10} />
            {format(new Date(deal.expected_close_date), 'MMM d, yyyy')}
          </span>
        ) : (
          <span />
        )}
        {lastActivity && (
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {formatDistanceToNow(new Date(lastActivity), { addSuffix: true })}
          </span>
        )}
      </div>

      {/* Action row — in normal flow (always reachable) on touch; becomes a
          hover-reveal absolute overlay from md up, matching the old desktop look. */}
      <div
        className="static md:absolute inset-x-0 md:bottom-0 mt-2 md:mt-0 translate-y-0 opacity-100 pointer-events-auto md:translate-y-full md:opacity-0 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all flex items-center justify-end gap-1 p-1.5 md:pointer-events-none md:group-hover:pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1 rounded-lg border border-brand-border/50 bg-brand-white shadow-md px-1 py-1">
          <button
            type="button"
            title="View"
            onClick={() => onOpen(deal.id)}
            className="h-9 w-9 md:h-6 md:w-6 flex items-center justify-center rounded-md text-brand-subtle hover:bg-brand-surface hover:text-brand-primary"
          >
            <Eye size={13} />
          </button>
          <button
            type="button"
            title="Edit"
            onClick={() => onEdit(deal.id)}
            className="h-9 w-9 md:h-6 md:w-6 flex items-center justify-center rounded-md text-brand-subtle hover:bg-brand-surface hover:text-brand-primary"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            title="Convert to Quote"
            onClick={() => onConvertToQuote(deal.id)}
            className="h-9 w-9 md:h-6 md:w-6 flex items-center justify-center rounded-md text-brand-subtle hover:bg-brand-surface hover:text-brand-primary"
          >
            <FileText size={13} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="More"
                className="h-9 w-9 md:h-6 md:w-6 flex items-center justify-center rounded-md text-brand-subtle hover:bg-brand-surface hover:text-brand-primary"
              >
                <MoreHorizontal size={13} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent align="end" className="text-[12px]">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-[12px]">
                    Move to stage
                    <ChevronRight size={12} className="ml-auto" />
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="text-[12px]">
                      {KANBAN_COLUMNS.filter((c) => c.writeStage !== deal.stage).map((c) => (
                        <DropdownMenuItem key={c.key} onClick={() => onMoveToStage(deal.id, c.writeStage)}>
                          {c.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(deal.id)}>Edit deal</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
});
