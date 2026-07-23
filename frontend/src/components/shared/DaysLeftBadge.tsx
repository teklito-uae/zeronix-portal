import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface DaysLeftBadgeProps {
  date?: string | null;
  className?: string;
}

export const DaysLeftBadge = ({ date, className }: DaysLeftBadgeProps) => {
  if (!date) return null;

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let colorClass = 'bg-brand-bg text-brand-subtle'; // default/far away
  let label = `${diffDays} days left`;

  if (diffDays < 0) {
    colorClass = 'bg-[#EF44441F] text-[#EF4444]';
    label = `${Math.abs(diffDays)} days expired`;
  } else if (diffDays === 0) {
    colorClass = 'bg-[#F59E0B1F] text-[#F59E0B]';
    label = 'Expires today';
  } else if (diffDays <= 3) {
    colorClass = 'bg-[#F59E0B1F] text-[#F59E0B]';
    label = `${diffDays} days left`;
  } else {
    colorClass = 'bg-[#10B9811F] text-[#10B981]';
  }

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border-0', colorClass, className)}>
      <Clock size={10} />
      {label}
    </span>
  );
};
