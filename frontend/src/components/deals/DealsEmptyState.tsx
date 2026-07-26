import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DealsEmptyStateProps {
  message: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * Reusable "nothing here" block — used both for "no deals in this column"
 * and "no deals match your filters" contexts.
 */
export const DealsEmptyState = ({ message, icon, actionLabel, onAction, className }: DealsEmptyStateProps) => (
  <div className={cn('flex flex-col items-center justify-center gap-2 py-10 px-4 text-center', className)}>
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-surface text-brand-subtle">
      {icon ?? <Inbox size={18} />}
    </div>
    <p className="text-[12px] font-medium text-brand-subtle max-w-[180px]">{message}</p>
    {actionLabel && onAction && (
      <Button type="button" variant="outline" size="sm" onClick={onAction} className="h-[28px] rounded-lg text-[11px]">
        {actionLabel}
      </Button>
    )}
  </div>
);
