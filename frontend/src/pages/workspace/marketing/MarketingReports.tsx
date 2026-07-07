import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { StatCard } from '@/components/shared/StatCard';
import { PageLoader } from '@/components/shared/PageLoader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Send, Radio, MousePointerClick, AlertTriangle, UserMinus } from 'lucide-react';
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const MarketingReports = () => {
  const navigate = useNavigate();

  const { data: overview, isLoading } = useQuery({
    queryKey: ['marketing/reports/overview'],
    queryFn: async () => (await api.get('/admin/marketing/reports/overview', { params: { days: 30 } })).data,
  });

  const { data: trends } = useQuery({
    queryKey: ['marketing/reports/trends'],
    queryFn: async () => (await api.get('/admin/marketing/reports/trends', { params: { days: 30 } })).data.data,
  });

  if (isLoading) {
    return (
      <MarketingLayout title="Reports">
        <PageLoader label="Loading reports..." />
      </MarketingLayout>
    );
  }

  const totals = overview?.totals || {};
  const campaigns = overview?.campaigns || [];
  const domains = overview?.domains || [];
  const trendData = (trends || []).map((row: any) => ({ ...row, date: row.date?.slice(5) }));

  return (
    <MarketingLayout title="Reports">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard title="Sent (30d)" value={totals.sent ?? 0} icon={<Send size={16} />} />
        <StatCard title="Open Rate" value={`${totals.open_rate ?? 0}%`} icon={<Radio size={16} />} />
        <StatCard title="Click Rate" value={`${totals.click_rate ?? 0}%`} icon={<MousePointerClick size={16} />} />
        <StatCard title="Bounce Rate" value={`${totals.bounce_rate ?? 0}%`} icon={<AlertTriangle size={16} />} />
        <StatCard title="Unsubscribe Rate" value={`${totals.unsubscribe_rate ?? 0}%`} icon={<UserMinus size={16} />} />
      </div>

      <div className="bg-brand-white border border-brand-border rounded-xl p-4 mb-6">
        <h3 className="text-[13px] font-semibold text-brand-primary mb-3">30-Day Trend</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: 6, fontSize: 12 }} />
            <Area type="monotone" dataKey="sent" stroke="#10B981" fillOpacity={0.1} fill="#10B981" strokeWidth={2} name="Sent" />
            <Area type="monotone" dataKey="opens" stroke="#6366F1" fillOpacity={0} strokeWidth={2} name="Opens" />
            <Area type="monotone" dataKey="clicks" stroke="#F59E0B" fillOpacity={0} strokeWidth={2} name="Clicks" />
            <Area type="monotone" dataKey="bounces" stroke="#EF4444" fillOpacity={0} strokeWidth={2} name="Bounces" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-brand-white border border-brand-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-border">
            <h3 className="text-[13px] font-semibold text-brand-primary">Campaign Comparison</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[12px]">Campaign</TableHead>
                <TableHead className="text-[12px]">Status</TableHead>
                <TableHead className="text-[12px]">Sent</TableHead>
                <TableHead className="text-[12px]">Open</TableHead>
                <TableHead className="text-[12px]">Click</TableHead>
                <TableHead className="text-[12px]">Bounce</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-[13px] text-brand-subtle">No launched campaigns in this period.</TableCell></TableRow>
              )}
              {campaigns.map((c: any) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/workspace/marketing/campaigns/${c.id}`)}>
                  <TableCell className="text-[13px] font-medium">{c.name}</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell className="text-[12px]">{c.sent}</TableCell>
                  <TableCell className="text-[12px]">{c.open_rate}%</TableCell>
                  <TableCell className="text-[12px]">{c.click_rate}%</TableCell>
                  <TableCell className="text-[12px]">{c.bounce_rate}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="bg-brand-white border border-brand-border rounded-xl p-4">
          <h3 className="text-[13px] font-semibold text-brand-primary mb-3">Recipient Domains</h3>
          <div className="space-y-2">
            {domains.length === 0 && <p className="text-[12px] text-brand-subtle">No data yet.</p>}
            {domains.map((d: any) => (
              <div key={d.domain} className="flex items-center justify-between text-[12px]">
                <span className="text-brand-secondary">{d.domain}</span>
                <span className="font-semibold text-brand-primary">{d.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
};
