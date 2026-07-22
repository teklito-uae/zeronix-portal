import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PageTab {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface PageTabsProps {
  tabs: PageTab[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export const PageTabs = ({ tabs, value, onChange, className }: PageTabsProps) => {
  return (
    <div className={cn('flex items-center gap-5', className)}>
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-1.5 py-3.5 text-[13px] whitespace-nowrap transition-colors border-b-2',
              active
                ? 'font-semibold text-brand-primary border-brand-accent'
                : 'font-medium text-brand-subtle hover:text-brand-primary border-transparent'
            )}
          >
            {tab.icon && (
              <span className={cn('flex-shrink-0', active ? 'text-brand-accent' : 'text-brand-subtle')}>
                {tab.icon}
              </span>
            )}
            {tab.label}
            {typeof tab.count === 'number' && (
              <span className="text-[11px] text-brand-subtle">{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};
