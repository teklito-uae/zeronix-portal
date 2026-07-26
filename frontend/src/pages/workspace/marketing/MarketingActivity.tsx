import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { PageLoader } from '@/components/shared/PageLoader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { Activity as ActivityIcon, Send, MousePointerClick, Radio, UserMinus, AlertTriangle } from 'lucide-react';

const ICONS: Record<string, any> = {
  sent: Send,
  open: Radio,
  click: MousePointerClick,
  unsubscribe: UserMinus,
  bounce: AlertTriangle,
  failure: AlertTriangle,
};

export const MarketingActivity = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const { data, isLoading } = useQuery({
    queryKey: ['marketing/activity', page, perPage],
    queryFn: async () => (await api.get('/admin/marketing/activity', { params: { page, per_page: perPage } })).data,
    refetchInterval: 20000,
  });

  const items = data?.data || [];

  return (
    <MarketingLayout title="Activity Log">
      {isLoading ? (
        <PageLoader label="Loading activity..." />
      ) : items.length === 0 ? (
        <EmptyState icon={ActivityIcon} title="No activity yet" description="Admin actions and send events will appear here." />
      ) : (
        <div className="bg-brand-white border border-brand-border rounded-xl divide-y divide-brand-border">
          {items.map((item: any) => {
            const Icon = item.kind === 'event' ? ICONS[item.action] || ActivityIcon : ActivityIcon;
            return (
              <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                <div className="h-8 w-8 rounded-full bg-brand-accent-light text-brand-accent flex items-center justify-center flex-shrink-0">
                  <Icon size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] text-brand-primary">{item.description || item.action}</p>
                  <p className="text-[11px] text-brand-subtle">
                    {item.user ? `${item.user} · ` : ''}
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <Pagination
          page={page}
          perPage={perPage}
          total={data?.total || 0}
          lastPage={data?.last_page || 1}
          onPageChange={setPage}
          onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
          className="mt-4 static px-0"
        />
      )}
    </MarketingLayout>
  );
};
