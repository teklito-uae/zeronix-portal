import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { SEO } from '@/components/shared/SEO';
import { PageLoader } from '@/components/shared/PageLoader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Clock } from 'lucide-react';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { CurrencyAmount } from '@/components/shared/CurrencyAmount';
import type { CurrencyCode } from '@/lib/currency';
import type { Invoice } from '@/types';

type Tab = 'sales' | 'staff' | 'pnl' | 'aging' | 'crm';

// ── /admin/reports/* response shapes ────────────────────────────────────────
interface SalesReport {
  totals?: { total_invoiced?: number; total_paid?: number; count?: number };
  data?: Invoice[];
}

interface StaffSalesRow {
  user_id: number;
  user_name: string;
  invoice_count: number;
  total_sales: number;
}

interface ProfitLossReport {
  revenue?: number;
  cost_of_goods?: number;
  expenses?: number;
  gross_profit?: number;
  net_profit?: number;
}

interface ReceivablesAgingReport {
  current?: number;
  '1_30'?: number;
  '31_60'?: number;
  '61_90'?: number;
  '90_plus'?: number;
}

interface TopCustomerRow {
  id: number;
  name: string;
  company?: string | null;
  total_invoiced?: number;
}

interface CrmDashboardReport {
  total_leads?: number;
  converted_leads?: number;
  conversion_rate?: number;
  enquiries_by_status?: Record<string, number>;
  leads_by_status?: Record<string, number>;
  top_customers?: TopCustomerRow[];
}

interface EnquiriesBySourceRow {
  source?: string | null;
  count: number;
}

interface PipelineRow {
  status: string;
  count: number;
  total?: number;
}

interface PipelineSummaryReport {
  quotations?: PipelineRow[];
  sales_orders?: PipelineRow[];
  deliveries?: PipelineRow[];
  invoices?: PipelineRow[];
}

export const Reports = () => {
  const currency = useCurrencyStore((s) => s.currency);
  const admin = useAuthStore(s => s.admin);
  const isAdmin = admin?.role === 'admin' || admin?.role === 'super_admin';

  const [activeTab, setActiveTab] = useState<Tab>('sales');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const params = { date_from: dateFrom || undefined, date_to: dateTo || undefined };

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['reports', 'sales', params],
    queryFn: async () => (await api.get<SalesReport>('/admin/reports/sales', { params })).data,
    enabled: activeTab === 'sales',
  });

  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ['reports', 'sales-by-staff', params],
    queryFn: async () => (await api.get<StaffSalesRow[]>('/admin/reports/sales-by-staff', { params })).data,
    enabled: activeTab === 'staff',
  });

  const { data: pnlData, isLoading: pnlLoading } = useQuery({
    queryKey: ['reports', 'profit-loss', params],
    queryFn: async () => (await api.get<ProfitLossReport>('/admin/reports/profit-loss', { params })).data,
    enabled: activeTab === 'pnl' && isAdmin,
  });

  const { data: agingData, isLoading: agingLoading } = useQuery({
    queryKey: ['reports', 'receivables-aging'],
    queryFn: async () => (await api.get<ReceivablesAgingReport>('/admin/reports/receivables-aging')).data,
    enabled: activeTab === 'aging',
  });

  const { data: crmDashboardData, isLoading: crmDashboardLoading } = useQuery({
    queryKey: ['reports', 'crm-dashboard', params],
    queryFn: async () => (await api.get<CrmDashboardReport>('/admin/reports/crm-dashboard', { params })).data,
    enabled: activeTab === 'crm',
  });

  const { data: enquiriesBySourceData, isLoading: enquiriesBySourceLoading } = useQuery({
    queryKey: ['reports', 'enquiries-by-source'],
    queryFn: async () => (await api.get<EnquiriesBySourceRow[]>('/admin/reports/enquiries-by-source')).data,
    enabled: activeTab === 'crm',
  });

  const { data: pipelineSummaryData, isLoading: pipelineSummaryLoading } = useQuery({
    queryKey: ['reports', 'pipeline-summary'],
    queryFn: async () => (await api.get<PipelineSummaryReport>('/admin/reports/pipeline-summary')).data,
    enabled: activeTab === 'crm',
  });

  const crmLoading = crmDashboardLoading || enquiriesBySourceLoading || pipelineSummaryLoading;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'sales', label: 'Sales' },
    { id: 'staff', label: 'Sales by Staff' },
    ...(isAdmin ? [{ id: 'pnl' as Tab, label: 'Profit & Loss' }] : []),
    { id: 'aging', label: 'Receivables Aging' },
    { id: 'crm', label: 'CRM' },
  ];

  return (
    <div className="bg-brand-white md:border border-brand-border md:rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
      <SEO title="Reports" />

      <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border flex-shrink-0">
        <h1 className="text-[18px] font-bold text-brand-primary flex items-center gap-2">
          <BarChart3 size={18} className="text-brand-subtle" /> Reports
        </h1>
      </div>

      <div className="px-5 border-b border-brand-border flex items-center gap-6 flex-shrink-0 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "py-3.5 text-[13px] whitespace-nowrap transition-colors border-b-2",
              activeTab === tab.id
                ? "font-semibold text-brand-primary border-brand-accent"
                : "font-medium text-brand-subtle hover:text-brand-primary border-transparent"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab !== 'aging' && (
        <div className="px-5 py-3 flex items-center gap-3 border-b border-brand-border/50 flex-shrink-0">
          <div className="space-y-1">
            <Label className="text-[11px] text-brand-subtle">From</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-[32px] text-[12px] w-[160px]" />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-brand-subtle">To</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-[32px] text-[12px] w-[160px]" />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-5">
        {activeTab === 'sales' && (
          salesLoading ? <PageLoader label="Loading sales..." /> : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatTile icon={<DollarSign size={16} />} label="Total Invoiced" value={<CurrencyAmount amount={salesData?.totals?.total_invoiced} currency={currency} />} />
                <StatTile icon={<TrendingUp size={16} />} label="Total Paid" value={<CurrencyAmount amount={salesData?.totals?.total_paid} currency={currency} />} />
                <StatTile icon={<BarChart3 size={16} />} label="Invoice Count" value={String(salesData?.totals?.count || 0)} />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(salesData?.data || []).map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-[12px]">{inv.invoice_number}</TableCell>
                      <TableCell className="text-[13px]">{inv.customer?.name || '—'}</TableCell>
                      <TableCell className="text-[12px] uppercase">{inv.status}</TableCell>
                      <TableCell className="text-right font-mono text-[13px]"><CurrencyAmount amount={inv.total} currency={currency} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        )}

        {activeTab === 'staff' && (
          staffLoading ? <PageLoader label="Loading staff performance..." /> : (
            <div className="space-y-6">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={staffData || []}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="user_name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="total_sales" fill="var(--brand-accent, #0F52BA)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead className="text-center">Invoices</TableHead>
                    <TableHead className="text-right">Total Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(staffData || []).map((row) => (
                    <TableRow key={row.user_id}>
                      <TableCell className="text-[13px] font-medium">{row.user_name}</TableCell>
                      <TableCell className="text-center text-[13px]">{row.invoice_count}</TableCell>
                      <TableCell className="text-right font-mono text-[13px]"><CurrencyAmount amount={row.total_sales} currency={currency} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        )}

        {activeTab === 'pnl' && isAdmin && (
          pnlLoading ? <PageLoader label="Calculating profit & loss..." /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatTile icon={<DollarSign size={16} />} label="Revenue" value={<CurrencyAmount amount={pnlData?.revenue} currency={currency} />} />
              <StatTile icon={<TrendingDown size={16} />} label="Cost of Goods" value={<CurrencyAmount amount={pnlData?.cost_of_goods} currency={currency} />} />
              <StatTile icon={<Users size={16} />} label="Expenses" value={<CurrencyAmount amount={pnlData?.expenses} currency={currency} />} />
              <StatTile icon={<TrendingUp size={16} />} label="Gross Profit" value={<CurrencyAmount amount={pnlData?.gross_profit} currency={currency} />} highlight />
              <StatTile icon={<TrendingUp size={16} />} label="Net Profit" value={<CurrencyAmount amount={pnlData?.net_profit} currency={currency} />} highlight />
            </div>
          )
        )}

        {activeTab === 'aging' && (
          agingLoading ? <PageLoader label="Loading receivables..." /> : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <StatTile icon={<Clock size={16} />} label="Current" value={<CurrencyAmount amount={agingData?.current} currency={currency} />} />
              <StatTile icon={<Clock size={16} />} label="1-30 Days" value={<CurrencyAmount amount={agingData?.['1_30']} currency={currency} />} />
              <StatTile icon={<Clock size={16} />} label="31-60 Days" value={<CurrencyAmount amount={agingData?.['31_60']} currency={currency} />} />
              <StatTile icon={<Clock size={16} />} label="61-90 Days" value={<CurrencyAmount amount={agingData?.['61_90']} currency={currency} />} />
              <StatTile icon={<Clock size={16} />} label="90+ Days" value={<CurrencyAmount amount={agingData?.['90_plus']} currency={currency} />} highlight />
            </div>
          )
        )}

        {activeTab === 'crm' && (
          crmLoading ? <PageLoader label="Loading CRM analytics..." /> : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatTile icon={<Users size={16} />} label="Total Leads" value={String(crmDashboardData?.total_leads || 0)} />
                <StatTile icon={<TrendingUp size={16} />} label="Converted Leads" value={String(crmDashboardData?.converted_leads || 0)} />
                <StatTile icon={<BarChart3 size={16} />} label="Conversion Rate" value={`${crmDashboardData?.conversion_rate || 0}%`} highlight />
                <StatTile
                  icon={<Clock size={16} />}
                  label="Total Enquiries"
                  value={String(
                    Object.values(crmDashboardData?.enquiries_by_status || {}).reduce(
                      (sum: number, count: number) => sum + Number(count), 0
                    )
                  )}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-[13px] font-semibold text-brand-primary mb-2">Leads by Status</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(crmDashboardData?.leads_by_status || {}).map(([status, count]) => (
                        <TableRow key={status}>
                          <TableCell className="text-[13px] uppercase">{status}</TableCell>
                          <TableCell className="text-right text-[13px]">{String(count)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h3 className="text-[13px] font-semibold text-brand-primary mb-2">Enquiries by Source</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(enquiriesBySourceData || []).map((row, idx: number) => (
                        <TableRow key={row.source ?? idx}>
                          <TableCell className="text-[13px]">{row.source || 'Unknown'}</TableCell>
                          <TableCell className="text-right text-[13px]">{row.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div>
                <h3 className="text-[13px] font-semibold text-brand-primary mb-2">Top Customers</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead className="text-right">Total Invoiced</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(crmDashboardData?.top_customers || []).map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="text-[13px] font-medium">{c.name}</TableCell>
                        <TableCell className="text-[13px]">{c.company || '—'}</TableCell>
                        <TableCell className="text-right font-mono text-[13px]"><CurrencyAmount amount={c.total_invoiced} currency={currency} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PipelineTable title="Quotations" rows={pipelineSummaryData?.quotations} currency={currency} showTotal />
                <PipelineTable title="Sales Orders" rows={pipelineSummaryData?.sales_orders} currency={currency} showTotal />
                <PipelineTable title="Deliveries" rows={pipelineSummaryData?.deliveries} currency={currency} showTotal={false} />
                <PipelineTable title="Invoices" rows={pipelineSummaryData?.invoices} currency={currency} showTotal />
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

const StatTile = ({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: React.ReactNode; highlight?: boolean }) => (
  <div className={cn(
    "border rounded-lg p-4 space-y-1",
    highlight ? "border-brand-accent/30 bg-brand-accent/5" : "border-brand-border bg-brand-surface/50"
  )}>
    <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-brand-subtle">
      {icon} {label}
    </div>
    <p className="text-[18px] font-bold text-brand-primary font-mono">{value}</p>
  </div>
);

const PipelineTable = ({
  title,
  rows,
  currency,
  showTotal,
}: {
  title: string;
  rows: PipelineRow[] | undefined;
  currency: CurrencyCode;
  showTotal: boolean;
}) => (
  <div>
    <h3 className="text-[13px] font-semibold text-brand-primary mb-2">{title}</h3>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Status</TableHead>
          <TableHead className="text-center">Count</TableHead>
          {showTotal && <TableHead className="text-right">Total</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {(rows || []).map((row) => (
          <TableRow key={row.status}>
            <TableCell className="text-[13px] uppercase">{row.status}</TableCell>
            <TableCell className="text-center text-[13px]">{row.count}</TableCell>
            {showTotal && (
              <TableCell className="text-right font-mono text-[13px]">
                <CurrencyAmount amount={row.total} currency={currency} />
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
