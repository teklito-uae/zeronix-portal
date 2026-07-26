import { TrendingUp, Trophy } from 'lucide-react';
import type { DealStage } from '@/types';
import { CurrencyAmount } from '@/components/shared/CurrencyAmount';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrencyStore } from '@/store/useCurrencyStore';

type PipelineStats = Record<DealStage, { count: number; value: number }>;

interface DealStatsProps {
  stats: PipelineStats | undefined;
  isLoading: boolean;
}

const OPEN_STAGES: DealStage[] = ['new', 'qualified', 'requirement', 'proposal_sent', 'negotiation'];

export const DealStats = ({ stats, isLoading }: DealStatsProps) => {
  const currency = useCurrencyStore((s) => s.currency);

  const openPipeline = OPEN_STAGES.reduce(
    (acc, stage) => ({
      count: acc.count + (stats?.[stage]?.count ?? 0),
      value: acc.value + (stats?.[stage]?.value ?? 0),
    }),
    { count: 0, value: 0 }
  );

  const won = stats?.won ?? { count: 0, value: 0 };

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 md:px-5 py-3 border-b border-brand-border bg-brand-white flex-shrink-0">
      <div className="flex items-center gap-2.5 px-3.5 py-2 bg-brand-surface border border-brand-border/50 rounded-xl">
        <div className="h-8 w-8 rounded-lg bg-brand-accent-light dark:bg-brand-accent/20 flex items-center justify-center flex-shrink-0">
          <TrendingUp size={15} className="text-brand-accent" />
        </div>
        <div>
          <p className="text-[10px] font-medium text-brand-subtle uppercase tracking-wide">Open Pipeline</p>
          {isLoading ? (
            <Skeleton className="h-4 w-20 mt-0.5" />
          ) : (
            <p className="text-[14px] font-bold text-brand-primary">
              <CurrencyAmount amount={openPipeline.value} currency={currency} />
              <span className="text-[11px] font-medium text-brand-subtle ml-1.5">({openPipeline.count} deals)</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 px-3.5 py-2 bg-brand-surface border border-brand-border/50 rounded-xl">
        <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <Trophy size={15} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-[10px] font-medium text-brand-subtle uppercase tracking-wide">Won</p>
          {isLoading ? (
            <Skeleton className="h-4 w-20 mt-0.5" />
          ) : (
            <p className="text-[14px] font-bold text-brand-primary">
              <CurrencyAmount amount={won.value} currency={currency} />
              <span className="text-[11px] font-medium text-brand-subtle ml-1.5">({won.count} deals)</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
