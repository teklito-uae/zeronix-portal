import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  isPast,
  isToday,
  isTomorrow,
  isWithinInterval,
  addDays,
  format,
  parseISO,
} from 'date-fns';
import { CalendarClock, Building2 } from 'lucide-react';
import { getBasePath } from '@/hooks/useBasePath';
import api from '@/lib/axios';
import type { Deal, DealStage } from '@/types';
import { SEO } from '@/components/shared/SEO';
import { PageLoader } from '@/components/shared/PageLoader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CurrencyAmount } from '@/components/shared/CurrencyAmount';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { type CurrencyCode } from '@/lib/currency';

type PipelineResponse = Record<DealStage, { deals: Deal[]; count: number; value: number }>;

const CLOSED_STAGES: DealStage[] = ['won', 'lost', 'cancelled'];

type BucketId = 'overdue' | 'today' | 'tomorrow' | 'this_week';

const BUCKETS: { id: BucketId; label: string; danger?: boolean }[] = [
  { id: 'overdue', label: 'Overdue', danger: true },
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'this_week', label: 'This Week' },
];

const formatNextAction = (iso: string) => {
  const d = parseISO(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const isMidnight = d.getHours() === 0 && d.getMinutes() === 0;
  return isMidnight ? format(d, 'MMM d') : format(d, 'MMM d, h:mm a');
};

const DealRow = ({ deal, currency, onClick }: { deal: Deal; currency: CurrencyCode; onClick: () => void }) => {
  const company = deal.customer?.company || deal.customer?.name || deal.lead?.company || deal.lead?.name || 'Unlinked';
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left p-3 bg-brand-white border border-brand-border/50 rounded-lg hover:border-brand-accent/40 hover:shadow-sm transition-all flex flex-col gap-1.5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-brand-primary truncate">{deal.title}</p>
          <p className="text-[11px] text-brand-subtle flex items-center gap-1 mt-0.5 truncate">
            <Building2 size={10} /> {company}
          </p>
        </div>
        <StatusBadge status={deal.stage} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-semibold text-brand-secondary">
          <CurrencyAmount amount={deal.value} currency={currency} />
        </span>
        <span className="text-[11px] font-medium text-brand-subtle flex items-center gap-1">
          <CalendarClock size={11} /> {formatNextAction(deal.next_action_at as string)}
        </span>
      </div>
      {deal.next_action_note && (
        <p className="text-[11px] text-brand-subtle truncate">{deal.next_action_note}</p>
      )}
    </button>
  );
};

export const Calendar = () => {
  const currency = useCurrencyStore((s) => s.currency);
  const navigate = useNavigate();

  const { data: pipeline, isLoading } = useQuery({
    queryKey: ['deals', 'pipeline'],
    queryFn: async () => (await api.get('/admin/deals/pipeline')).data.data as PipelineResponse,
  });

  const buckets = useMemo(() => {
    const result: Record<BucketId, Deal[]> = { overdue: [], today: [], tomorrow: [], this_week: [] };
    if (!pipeline) return result;

    const allDeals = Object.values(pipeline).flatMap((g) => g.deals);
    const now = new Date();
    const weekEnd = addDays(now, 7);

    const withFollowUps = allDeals.filter(
      (d) => !CLOSED_STAGES.includes(d.stage) && typeof d.next_action_at === 'string' && d.next_action_at
    );

    for (const deal of withFollowUps) {
      const date = parseISO(deal.next_action_at as string);
      if (Number.isNaN(date.getTime())) continue;

      if (isPast(date) && !isToday(date)) {
        result.overdue.push(deal);
      } else if (isToday(date)) {
        result.today.push(deal);
      } else if (isTomorrow(date)) {
        result.tomorrow.push(deal);
      } else if (isWithinInterval(date, { start: now, end: weekEnd })) {
        result.this_week.push(deal);
      }
    }

    const sortAsc = (deals: Deal[]) =>
      [...deals].sort(
        (a, b) => new Date(a.next_action_at as string).getTime() - new Date(b.next_action_at as string).getTime()
      );

    return {
      overdue: sortAsc(result.overdue),
      today: sortAsc(result.today),
      tomorrow: sortAsc(result.tomorrow),
      this_week: sortAsc(result.this_week),
    };
  }, [pipeline]);

  const totalCount = buckets.overdue.length + buckets.today.length + buckets.tomorrow.length + buckets.this_week.length;

  const goToDeal = (dealId: number) => navigate(`${getBasePath()}/deals?dealId=${dealId}`);

  if (isLoading) {
    return <PageLoader label="Loading follow-ups..." iconSize={32} className="h-full min-h-[400px] gap-3" />;
  }

  return (
    <div className="bg-brand-white flex flex-col h-full overflow-hidden animate-in fade-in duration-200">
      <SEO title="Calendar" />

      <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-brand-border bg-brand-white flex-shrink-0">
        <h1 className="text-[16px] md:text-[18px] font-bold text-brand-primary flex items-center gap-2">
          <CalendarClock size={18} className="text-brand-subtle" />
          Follow-ups
        </h1>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-5">
        {totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-3 text-center">
            <div className="h-12 w-12 rounded-xl bg-brand-accent-light dark:bg-brand-accent/20 flex items-center justify-center">
              <CalendarClock size={22} className="text-brand-accent" />
            </div>
            <p className="text-[14px] font-semibold text-brand-primary">No upcoming follow-ups</p>
            <p className="text-[12px] text-brand-subtle max-w-xs">
              Deals with a next action date will show up here, grouped by when they're due.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BUCKETS.map((bucket) => {
              const deals = buckets[bucket.id];
              return (
                <div
                  key={bucket.id}
                  className={`bg-brand-white border rounded-xl overflow-hidden flex flex-col ${
                    bucket.danger ? 'border-brand-danger/30' : 'border-brand-border/50'
                  }`}
                >
                  <div
                    className={`px-4 py-3 border-b flex items-center justify-between flex-shrink-0 ${
                      bucket.danger ? 'bg-brand-danger-bg border-brand-danger/20' : 'bg-brand-surface border-brand-border/50'
                    }`}
                  >
                    <span className={`text-[13px] font-semibold ${bucket.danger ? 'text-brand-danger' : 'text-brand-secondary'}`}>
                      {bucket.label}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        bucket.danger
                          ? 'text-brand-danger bg-brand-danger/10'
                          : 'text-brand-subtle bg-brand-surface border border-brand-border/50'
                      }`}
                    >
                      {deals.length}
                    </span>
                  </div>
                  <div className="p-3 space-y-2 flex-1">
                    {deals.length === 0 ? (
                      <p className="text-[12px] text-brand-subtle text-center py-4">Nothing due</p>
                    ) : (
                      deals.map((deal) => (
                        <DealRow key={deal.id} deal={deal} currency={currency} onClick={() => goToDeal(deal.id)} />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
