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
} from 'recharts';
import { UserCircle2, TrendingUp, MessageSquareText, Building2 } from 'lucide-react';

// Lead-funnel / enquiry-pipeline view, formerly the standalone CRM Dashboard
// page — now a tab within the main Dashboard since it drew from the same
// audience and overlapped with the KPIs already shown there.
export const PipelinePanel = () => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const params = { date_from: dateFrom || undefined, date_to: dateTo || undefined };

  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'crm-dashboard', params],
    queryFn: async () => (await api.get('/admin/reports/crm-dashboard', { params })).data,
  });

  const leadsByStatus = data?.leads_by_status || {};
  const enquiriesByStatus = data?.enquiries_by_status || {};

  const leadChartData = Object.entries(leadsByStatus).map(([status, count]) => ({ status, count }));
  const enquiryChartData = Object.entries(enquiriesByStatus).map(([status, count]) => ({ status, count }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-3">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Leads" value={data?.total_leads ?? 0} icon={<UserCircle2 size={18} />} href={`${getBasePath()}/leads`} />
            <StatCard title="Converted Leads" value={data?.converted_leads ?? 0} icon={<TrendingUp size={18} />} href={`${getBasePath()}/leads`} />
            <StatCard title="Conversion Rate" value={`${data?.conversion_rate ?? 0}%`} icon={<TrendingUp size={18} />} />
            <StatCard title="Open Enquiries" value={Object.entries(enquiriesByStatus).filter(([s]) => !['won', 'lost', 'closed'].includes(s)).reduce((sum, [, c]) => sum + Number(c), 0)} icon={<MessageSquareText size={18} />} href={`${getBasePath()}/enquiries`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-brand-white border border-brand-border rounded-xl p-4 shadow-sm">
              <h3 className="text-[13px] font-semibold text-brand-primary mb-3">Lead Funnel by Status</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={leadChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-brand-white border border-brand-border rounded-xl p-4 shadow-sm">
              <h3 className="text-[13px] font-semibold text-brand-primary mb-3">Enquiry Pipeline by Status</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={enquiryChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-brand-white border border-brand-border rounded-xl p-4 shadow-sm">
            <h3 className="text-[13px] font-semibold text-brand-primary mb-3 flex items-center gap-2">
              <Building2 size={14} /> Top Customers by Invoiced Value
            </h3>
            <div className="space-y-2">
              {(data?.top_customers || []).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-brand-surface">
                  <span className="text-[13px] font-medium text-brand-primary">{c.name}{c.company ? ` — ${c.company}` : ''}</span>
                  <span className="text-[13px] font-mono font-semibold text-brand-secondary">{Number(c.total_invoiced || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} AED</span>
                </div>
              ))}
              {(!data?.top_customers || data.top_customers.length === 0) && (
                <p className="text-[12px] text-brand-subtle">No customer data yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
