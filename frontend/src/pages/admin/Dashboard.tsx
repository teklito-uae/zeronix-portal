import { getBasePath } from '@/hooks/useBasePath';
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { SEO } from '@/components/shared/SEO';
import { useAuthStore } from '@/store/useAuthStore';
import { StaffDashboard } from './StaffDashboard';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { timeAgo } from '@/lib/utils';
import {
  MessageSquare, TrendingUp, Building2, Banknote,
  Receipt, Users, Activity,
  AlertCircle, CreditCard, Loader2, Package, ArrowRight
} from 'lucide-react';
import {
  XAxis, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from '@/lib/utils';

import { StatCard } from '@/components/shared/StatCard';

// ── Section Header ────────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) => (
  <div className="px-4 py-3 border-b border-admin-border flex items-center justify-between">
    <div className="flex items-center gap-2 text-sm font-medium text-admin-text-primary">
      {icon}{title}
    </div>
    {action}
  </div>
);

const chartConfig = {
  enquiries: { label: "Enquiries", color: "#A78BFA" },
  quotes: { label: "Quotes", color: "#FCD34D" },
  invoices: { label: "Invoices", color: "#10B981" },
  revenue: { label: "Revenue" },
  bank: { label: "Bank Transfer", color: "#6366F1" },
  cash: { label: "Cash Payment", color: "#10B981" },
  distribution: { label: "Payment Distribution" },
} satisfies ChartConfig;

// ── Main ──────────────────────────────────────────────────────────────────────
export const Dashboard = () => {
  const navigate = useNavigate();
  const admin = useAuthStore(state => state.admin);
  const [activeChart, setActiveChart] = useState<"bank" | "cash">("bank");

  if (admin?.role === 'salesman') {
    return <StaffDashboard />;
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await api.get(`${getBasePath()}/dashboard`)).data,
    refetchInterval: 60_000,
  });

  const daily_revenue = data?.daily_revenue || [];

  const totals = useMemo(() => ({
    bank: daily_revenue.reduce((acc: number, curr: any) => acc + curr.bank, 0),
    cash: daily_revenue.reduce((acc: number, curr: any) => acc + curr.cash, 0),
  }), [daily_revenue]);

  const pieData = useMemo(() => [
    { name: "bank", value: totals.bank, fill: chartConfig.bank.color },
    { name: "cash", value: totals.cash, fill: chartConfig.cash.color },
  ], [totals]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <Loader2 className="animate-spin text-zeronix-blue" size={22} />
        <p className="text-sm text-admin-text-muted">Loading dashboard…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <AlertCircle className="text-admin-text-muted" size={28} />
        <p className="text-sm text-admin-text-muted">Failed to load dashboard data.</p>
      </div>
    );
  }

  const { stats, daily_activity = [], recent_enquiries, recent_invoices, recent_activities, user_stats } = data;

  const fmt = (val: number) => val > 0 ? `${Number(val).toLocaleString(undefined, { minimumFractionDigits: 0 })} AED` : '0 AED';
  const pct = stats.total_invoiced > 0 ? Math.round((stats.total_paid / stats.total_invoiced) * 100) : 0;

  return (
    <div className="space-y-4">
      <SEO title="Dashboard" description="Zeronix Administration" />

      {/* Row 1 — Financial KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Bank Received" value={fmt(stats.total_bank_received)} icon={<Building2 size={15} className="text-indigo-500" />} iconBg="bg-indigo-500/10" href={`${getBasePath()}/payment-receipts`} />
        <StatCard title="Cash Received" value={fmt(stats.total_cash_received)} icon={<Banknote size={15} className="text-emerald-500" />} iconBg="bg-emerald-500/10" href={`${getBasePath()}/payment-receipts`} />
        <StatCard title="Total Invoiced" value={fmt(stats.total_invoiced)} subtitle={`${pct}% collected`} icon={<Receipt size={15} className="text-zeronix-blue" />} iconBg="bg-zeronix-blue/10" href={`${getBasePath()}/invoices`} />
      </div>

      {/* Row 2 — People & Ops KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Enquiries" value={stats.total_enquiries} icon={<MessageSquare size={15} className="text-purple-500" />} iconBg="bg-purple-500/10" href={`${getBasePath()}/enquiries`} />
        <StatCard title="Customers" value={stats.active_customers} icon={<Users size={15} className="text-cyan-500" />} iconBg="bg-cyan-500/10" href={`${getBasePath()}/customers`} />
        <StatCard title="Products" value={stats.total_products} icon={<Package size={15} className="text-orange-500" />} iconBg="bg-orange-500/10" href={`${getBasePath()}/products`} />
      </div>

      {/* Row 3 — Financial Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Analytics */}
        <Card className="lg:col-span-1 bg-admin-surface border border-admin-border rounded-xl overflow-hidden shadow-sm flex flex-col">
          <CardHeader className="flex flex-col items-stretch border-b border-admin-border p-0 bg-admin-bg/10">
            <div className="flex flex-col justify-center gap-0.5 px-5 py-3">
              <CardTitle className="text-base font-bold text-admin-text-primary flex items-center gap-2">
                <TrendingUp size={16} className="text-zeronix-blue" />
                Revenue
              </CardTitle>
              <CardDescription className="text-[10px] text-admin-text-muted uppercase tracking-tight">
                Daily collection (30d)
              </CardDescription>
            </div>
            <div className="flex border-t border-admin-border">
              {["bank", "cash"].map((key) => {
                const chart = key as keyof typeof chartConfig;
                const isActive = activeChart === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveChart(key as "bank" | "cash")}
                    className={cn(
                      "flex flex-1 flex-col justify-center gap-0.5 px-4 py-2 text-left transition-all border-l first:border-l-0 border-admin-border",
                      isActive ? "bg-zeronix-blue/5 border-b-2 border-b-zeronix-blue" : "hover:bg-admin-bg/50"
                    )}
                  >
                    <span className="text-[9px] font-medium uppercase text-admin-text-muted">
                      {chartConfig[chart].label}
                    </span>
                    <span className="text-sm font-bold text-admin-text-primary">
                      {totals[key as keyof typeof totals].toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-1">
            <ChartContainer config={chartConfig} className="aspect-auto h-[200px] w-full">
              <BarChart accessibilityLayer data={daily_revenue} margin={{ top: 10 }}>
                <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tick={{ fill: '#94A3B8', fontSize: 10 }}
                  tickFormatter={(v) => new Date(v).getDate().toString()}
                />
                <ChartTooltip content={<ChartTooltipContent className="w-[120px]" nameKey="revenue" />} />
                <Bar dataKey={activeChart} fill={chartConfig[activeChart].color} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Payment Distribution Pie */}
        <Card className="lg:col-span-1 bg-admin-surface border border-admin-border rounded-xl overflow-hidden shadow-sm flex flex-col">
          <CardHeader className="border-b border-admin-border bg-admin-bg/10 px-5 py-4">
            <CardTitle className="text-base font-bold text-admin-text-primary flex items-center gap-2">
              <CreditCard size={16} className="text-emerald-500" />
              Distribution
            </CardTitle>
            <CardDescription className="text-[10px] text-admin-text-muted uppercase tracking-tight">
              Bank vs Cash Ratio
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col items-center justify-center">
            <ChartContainer config={chartConfig} className="aspect-square h-[200px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={80}
                  strokeWidth={5}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent />} className="mt-2" />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Activity Volume */}
        <Card className="lg:col-span-1 bg-admin-surface border border-admin-border rounded-xl overflow-hidden shadow-sm flex flex-col">
          <CardHeader className="border-b border-admin-border bg-admin-bg/10 px-5 py-4">
            <CardTitle className="text-base font-bold text-admin-text-primary flex items-center gap-2">
              <Activity size={16} className="text-purple-500" />
              Activity
            </CardTitle>
            <CardDescription className="text-[10px] text-admin-text-muted uppercase tracking-tight">
              {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col justify-center">
            <ChartContainer config={chartConfig} className="aspect-auto h-[200px] w-full">
              <BarChart accessibilityLayer data={daily_activity} barSize={4} barCategoryGap="5%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  minTickGap={20}
                  tick={{ fill: '#94A3B8', fontSize: 9 }}
                  tickFormatter={(value) => value.split(' ')[0]}
                />
                <Bar
                  dataKey="enquiries"
                  stackId="activity"
                  fill="var(--color-enquiries)"
                  radius={[0, 0, 1, 1]}
                />
                <Bar
                  dataKey="quotes"
                  stackId="activity"
                  fill="var(--color-quotes)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="invoices"
                  stackId="activity"
                  fill="var(--color-invoices)"
                  radius={[1, 1, 0, 0]}
                />
                <ChartTooltip
                  content={<ChartTooltipContent indicator="line" />}
                  cursor={false}
                />
                <ChartLegend content={<ChartLegendContent />} className="mt-4" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 4 — Collection summary + Recent enquiries + Recent invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Collection progress */}
        <div className="bg-admin-surface border border-admin-border rounded-md overflow-hidden">
          <SectionHeader icon={<CreditCard size={13} className="text-emerald-500" />} title="Collection Summary" />
          <div className="p-4 space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-admin-text-muted">Collection Rate</span>
                <span className="text-sm font-semibold text-admin-text-primary">{pct}%</span>
              </div>
              <div className="w-full bg-admin-bg rounded-full h-1.5 overflow-hidden">
                <div className="bg-zeronix-blue h-1.5 rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <div className="flex justify-between text-[11px] text-admin-text-muted">
                <span>Paid: {fmt(stats.total_paid)}</span>
                <span>Total: {fmt(stats.total_invoiced)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-admin-border">
              <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-md p-2.5 text-center">
                <p className="text-sm font-semibold text-indigo-600">{fmt(stats.total_bank_received)}</p>
                <p className="text-[11px] text-admin-text-muted mt-0.5">Bank</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-md p-2.5 text-center">
                <p className="text-sm font-semibold text-emerald-600">{fmt(stats.total_cash_received)}</p>
                <p className="text-[11px] text-admin-text-muted mt-0.5">Cash</p>
              </div>
            </div>

            {/* User performance */}
            {user_stats && user_stats.length > 0 && (
              <div className="pt-2 border-t border-admin-border space-y-1.5">
                <p className="text-[11px] text-admin-text-muted uppercase tracking-wide flex items-center gap-1">
                  <Users size={10} /> Team Performance
                </p>
                {user_stats.slice(0, 4).map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-1.5">
                      <div className="h-5 w-5 rounded-full bg-zeronix-blue/15 text-zeronix-blue text-[9px] font-semibold flex items-center justify-center shrink-0">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-xs text-admin-text-primary truncate max-w-[80px]">{u.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-admin-text-muted">
                      <span className="bg-admin-bg px-1.5 py-0.5 rounded">{u.enquiries_count} enq</span>
                      <span className="bg-admin-bg px-1.5 py-0.5 rounded">{u.quotes_count} qt</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Enquiries */}
        <div className="bg-admin-surface border border-admin-border rounded-md overflow-hidden">
          <SectionHeader
            icon={<MessageSquare size={13} className="text-purple-500" />}
            title="Recent Enquiries"
            action={
              <button onClick={() => navigate(`${getBasePath()}/enquiries`)} className="text-[11px] text-zeronix-blue hover:underline flex items-center gap-0.5">
                View all <ArrowRight size={10} />
              </button>
            }
          />
          <div className="divide-y divide-admin-border">
            {(recent_enquiries || []).slice(0, 6).map((enq: any) => (
              <div
                key={enq.id}
                onClick={() => navigate(`${getBasePath()}/enquiries`)}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-admin-surface-hover cursor-pointer transition-colors"
              >
                <div>
                  <p className="text-sm text-admin-text-primary">{enq.customer?.name || 'Unknown'}</p>
                  <p className="text-[11px] text-admin-text-muted">{enq.created_at ? timeAgo(enq.created_at) : '—'}</p>
                </div>
                <StatusBadge status={enq.status} />
              </div>
            ))}
            {(!recent_enquiries || recent_enquiries.length === 0) && (
              <p className="px-4 py-6 text-xs text-admin-text-muted text-center">No recent enquiries</p>
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-admin-surface border border-admin-border rounded-md overflow-hidden">
          <SectionHeader
            icon={<Receipt size={13} className="text-zeronix-blue" />}
            title="Recent Invoices"
            action={
              <button onClick={() => navigate(`${getBasePath()}/invoices`)} className="text-[11px] text-zeronix-blue hover:underline flex items-center gap-0.5">
                View all <ArrowRight size={10} />
              </button>
            }
          />
          <div className="divide-y divide-admin-border">
            {(recent_invoices || []).slice(0, 6).map((inv: any) => (
              <div
                key={inv.id}
                onClick={() => navigate(`${getBasePath()}/invoices/${inv.id}`)}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-admin-surface-hover cursor-pointer transition-colors"
              >
                <div>
                  <p className="text-sm font-mono text-zeronix-blue">{inv.invoice_number}</p>
                  <p className="text-[11px] text-admin-text-muted">{inv.customer?.name || '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-admin-text-primary">{Number(inv.total).toLocaleString(undefined, { minimumFractionDigits: 0 })} AED</p>
                  <StatusBadge status={inv.status} />
                </div>
              </div>
            ))}
            {(!recent_invoices || recent_invoices.length === 0) && (
              <p className="px-4 py-6 text-xs text-admin-text-muted text-center">No recent invoices</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 5 — Activity Log */}
      {recent_activities && recent_activities.length > 0 && (
        <div className="bg-admin-surface border border-admin-border rounded-md overflow-hidden">
          <SectionHeader
            icon={<Activity size={13} className="text-amber-500" />}
            title="Recent Activity"
            action={
              <button onClick={() => navigate(`${getBasePath()}/activities`)} className="text-[11px] text-zeronix-blue hover:underline flex items-center gap-0.5">
                Full log <ArrowRight size={10} />
              </button>
            }
          />
          <div className="divide-y divide-admin-border">
            {recent_activities.map((act: any) => (
              <div key={act.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="h-6 w-6 rounded-full bg-amber-500/10 text-amber-500 text-[9px] font-semibold flex items-center justify-center shrink-0">
                  {act.user_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-admin-text-primary truncate">
                    <span className="font-medium">{act.user_name}</span>{' '}
                    <span className="text-admin-text-muted">{act.description}</span>
                  </p>
                </div>
                <span className="text-[11px] text-admin-text-muted shrink-0">{act.created_at ? timeAgo(act.created_at) : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
