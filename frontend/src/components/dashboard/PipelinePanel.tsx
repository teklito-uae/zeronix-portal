import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { PageLoader } from '@/components/shared/PageLoader';
import { StatCard } from '@/components/shared/StatCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getBasePath } from '@/hooks/useBasePath';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell,
} from 'recharts';
import {
  UserCircle2, TrendingUp, MessageSquareText, Building2, Trophy, Wallet, Tags,
} from 'lucide-react';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { CurrencyAmount } from '@/components/shared/CurrencyAmount';

const STATUS_COLORS: Record<string, string> = {
  won: '#10B981',
  lost: '#EF4444',
  closed: '#10B981',
};
const DEFAULT_STATUS_COLOR = '#6366F1';
const SOURCE_COLORS = ['#6366F1', '#A78BFA', '#FCD34D', '#10B981', '#F472B6', '#38BDF8', '#F59E0B'];

const statusColor = (status: string) => STATUS_COLORS[status] ?? DEFAULT_STATUS_COLOR;

// Lead-funnel / enquiry-pipeline view, formerly the standalone CRM Dashboard
// page — now a tab within the main Dashboard since it drew from the same
// audience and overlapped with the KPIs already shown there. Data is scoped
// server-side to what the current user is allowed to see (own records for
// salesman/staff, team for manager, everything for admin).
export const PipelinePanel = () => {
  const currency = useCurrencyStore((s) => s.currency);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const params = { date_from: dateFrom || undefined, date_to: dateTo || undefined };

  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'crm-dashboard', params],
    queryFn: async () => (await api.get('/admin/reports/crm-dashboard', { params })).data,
  });

  const leadsByStatus = data?.leads_by_status || {};
  const enquiriesByStatus = data?.enquiries_by_status || {};
  const leadsBySource = data?.leads_by_source || {};

  const leadChartData = Object.entries(leadsByStatus).map(([status, count]) => ({ status, count }));
  const enquiryChartData = Object.entries(enquiriesByStatus).map(([status, count]) => ({ status, count }));
  const sourceChartData = Object.entries(leadsBySource).map(([source, count]) => ({ source, count }));
  const monthlyTrend = data?.monthly_trend || [];

  const openDeals = Object.entries(enquiriesByStatus)
    .filter(([s]) => !['won', 'lost', 'closed'].includes(s))
    .reduce((sum, [, c]) => sum + Number(c), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-3 flex-wrap">
        <div className="space-y-1">
          <Label className="text-[10px] text-brand-subtle">From</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-[12px] w-36" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-brand-subtle">To</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-[12px] w-36" />
        </div>
      </div>

      {isLoading ? (
        <PageLoader label="Loading pipeline data..." iconSize={32} className="h-full min-h-[300px] gap-3" />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard title="Total Leads" value={data?.total_leads ?? 0} icon={<UserCircle2 size={16} />} href={`${getBasePath()}/leads`} />
            <StatCard title="Converted" value={data?.converted_leads ?? 0} icon={<TrendingUp size={16} />} href={`${getBasePath()}/leads`} />
            <StatCard title="Conversion Rate" value={`${data?.conversion_rate ?? 0}%`} icon={<TrendingUp size={16} />} />
            <StatCard title="Open Deals" value={openDeals} icon={<MessageSquareText size={16} />} href={`${getBasePath()}/deals`} />
            <StatCard title="Win Rate" value={`${data?.win_rate ?? 0}%`} subtitle={`${data?.won_deals ?? 0} won / ${data?.lost_deals ?? 0} lost`} icon={<Trophy size={16} />} />
            <StatCard title="Avg. Deal Value" value={<CurrencyAmount amount={data?.avg_deal_value ?? 0} currency={currency} />} icon={<Wallet size={16} />} />
          </div>

          <div className="bg-brand-white border border-brand-border rounded-xl p-4 shadow-sm">
            <h3 className="text-[13px] font-semibold text-brand-primary mb-3 flex items-center gap-2">
              <TrendingUp size={14} /> Pipeline Trend — Last 6 Months
            </h3>
            <div className="h-[220px] sm:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="leads" name="Leads" stroke="#6366F1" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="deals" name="Deals" stroke="#FCD34D" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="won" name="Won" stroke="#10B981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-brand-white border border-brand-border rounded-xl p-4 shadow-sm">
              <h3 className="text-[13px] font-semibold text-brand-primary mb-3">Lead Funnel by Status</h3>
              <div className="h-[200px] sm:h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {leadChartData.map((entry) => (
                        <Cell key={entry.status} fill={statusColor(entry.status)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-brand-white border border-brand-border rounded-xl p-4 shadow-sm">
              <h3 className="text-[13px] font-semibold text-brand-primary mb-3">Deal Funnel by Stage</h3>
              <div className="h-[200px] sm:h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={enquiryChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {enquiryChartData.map((entry) => (
                        <Cell key={entry.status} fill={statusColor(entry.status)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-brand-white border border-brand-border rounded-xl p-4 shadow-sm">
              <h3 className="text-[13px] font-semibold text-brand-primary mb-3 flex items-center gap-2">
                <Tags size={14} /> Leads by Source
              </h3>
              {sourceChartData.length > 0 ? (
                <div className="h-[200px] sm:h-[240px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Pie data={sourceChartData} dataKey="count" nameKey="source" innerRadius={50} outerRadius={80} strokeWidth={3}>
                        {sourceChartData.map((entry, i) => (
                          <Cell key={entry.source} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-[12px] text-brand-subtle py-8 text-center">No lead source data yet.</p>
              )}
            </div>

            <div className="bg-brand-white border border-brand-border rounded-xl p-4 shadow-sm">
              <h3 className="text-[13px] font-semibold text-brand-primary mb-3 flex items-center gap-2">
                <Building2 size={14} /> Top Customers by Invoiced Value
              </h3>
              <div className="space-y-2">
                {(data?.top_customers || []).map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-brand-surface">
                    <span className="text-[13px] font-medium text-brand-primary">{c.name}{c.company ? ` — ${c.company}` : ''}</span>
                    <span className="text-[13px] font-mono font-semibold text-brand-secondary"><CurrencyAmount amount={c.total_invoiced || 0} currency={currency} /></span>
                  </div>
                ))}
                {(!data?.top_customers || data.top_customers.length === 0) && (
                  <p className="text-[12px] text-brand-subtle py-8 text-center">No customer data yet.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
