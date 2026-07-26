import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DealPriority } from '@/types';

interface PriorityBadgeProps {
  priority: DealPriority;
  className?: string;
}

const PRIORITY_CONFIG: Record<DealPriority, { label: string; dotClassName: string; className: string }> = {
  normal: {
    label: 'Normal',
    dotClassName: 'bg-brand-subtle',
    className: 'bg-[#F3F4F6] text-[#374151] border-transparent',
  },
  high: {
    label: 'High',
    dotClassName: 'bg-amber-500',
    className: 'bg-[#FEF3C7] text-[#92400E] border-transparent',
  },
  urgent: {
    label: 'Urgent',
    dotClassName: 'bg-red-500 animate-pulse',
    className: 'bg-[#FEE2E2] text-[#991B1B] border-transparent',
  },
};

export const PriorityBadge = memo(function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.normal;

  return (
    <Badge
      variant="outline"
      className={cn('h-[20px] gap-1 px-1.5 text-[10px] font-semibold', config.className, className)}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', config.dotClassName)} />
      {config.label}
    </Badge>
  );
});
