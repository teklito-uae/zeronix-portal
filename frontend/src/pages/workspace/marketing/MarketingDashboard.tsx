import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { StatCard } from '@/components/shared/StatCard';
import { PageLoader } from '@/components/shared/PageLoader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Send, MousePointerClick, Radio, ListOrdered, Plus } from 'lucide-react';
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { MarketingCampaign } from '@/types';

export const MarketingDashboard = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['marketing-dashboard'],
    queryFn: async () => {
      const res = await api.get('/admin/marketing/dashboard');
      return res.data;
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <MarketingLayout title="Dashboard">
        <PageLoader label="Loading dashboard..." />
      </MarketingLayout>
    );
  }

  const stats = data?.stats || {};
  const trend = (data?.trend || []).map((row: any) => ({
    date: row.date?.slice(5),
    sent: row.sent,
    opened: row.opened,
    clicked: row.clicked,
  }));
  const recentCampaigns: MarketingCampaign[] = data?.recent_campaigns || [];

  return (
    <MarketingLayout
      title="Dashboard"
      actions={
        <Button onClick={() => navigate('/workspace/marketing/campaigns/new')} className="h-9 text-[13px] gap-1.5">
          <Plus size={14} /> New Campaign
        </Button>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Sent (30d)" value={stats.sent_30d ?? 0} icon={<Send size={18} />} href="/workspace/marketing/reports" />
        <StatCard title="Open Rate (30d)" value={`${stats.open_rate_30d ?? 0}%`} icon={<Radio size={18} />} href="/workspace/marketing/reports" />
        <StatCard title="Click Rate (30d)" value={`${stats.click_rate_30d ?? 0}%`} icon={<MousePointerClick size={18} />} href="/workspace/marketing/reports" />
        <StatCard title="Queue Depth" value={stats.queue_depth ?? 0} icon={<ListOrdered size={18} />} href="/workspace/marketing/queue" />
      </div>

      <div className="bg-brand-white border border-brand-border rounded-xl p-4 mb-6">
        <h3 className="text-[13px] font-semibold text-brand-primary mb-3">Send Activity (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={trend}>
            <defs>
              <linearGradient id="sentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: 6, fontSize: 12 }} />
            <Area type="monotone" dataKey="sent" stroke="#10B981" fill="url(#sentGradient)" strokeWidth={2} name="Sent" />
            <Area type="monotone" dataKey="opened" stroke="#6366F1" fillOpacity={0} strokeWidth={2} name="Opened" />
            <Area type="monotone" dataKey="clicked" stroke="#F59E0B" fillOpacity={0} strokeWidth={2} name="Clicked" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-brand-white border border-brand-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-brand-border">
          <h3 className="text-[13px] font-semibold text-brand-primary">Recent Campaigns</h3>
        </div>
        {recentCampaigns.length === 0 ? (
          <div className="p-6 text-center text-[13px] text-brand-subtle">No campaigns yet.</div>
        ) : (
          <div className="divide-y divide-brand-border">
            {recentCampaigns.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/workspace/marketing/campaigns/${c.id}`)}
                className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-brand-surface/50 transition-colors"
              >
                <div>
                  <p className="text-[13px] font-medium text-brand-primary">{c.name}</p>
                  <p className="text-[11px] text-brand-subtle">{c.sent_count} sent · {c.opened_count} opened · {c.clicked_count} clicked</p>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </MarketingLayout>
  );
};
