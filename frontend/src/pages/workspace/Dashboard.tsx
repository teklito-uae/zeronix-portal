import { getBasePath } from '@/hooks/useBasePath';
import React, { useMemo, useState } from 'react';
import Avatar from 'boring-avatars';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { SEO } from '@/components/shared/SEO';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageLoader } from '@/components/shared/PageLoader';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { ClockInHeader } from '@/components/dashboard/ClockInHeader';
import { PipelinePanel } from '@/components/dashboard/PipelinePanel';
import { ProductivitySuite } from '@/components/dashboard/ProductivitySuite';
import {
  FileText, MessageSquare, TrendingUp, Building2, Banknote,
  Package, Receipt, Users, Activity,
  AlertCircle, ArrowRight, User, CreditCard,
  Wallet, UserPlus, UserCheck, Trophy, Medal,
} from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import { useTopbarActions } from '@/hooks/useTopbarActions';
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
import { cn, timeAgo, toTitleCase } from '@/lib/utils';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { CurrencyAmount } from '@/components/shared/CurrencyAmount';

import { StatCard } from '@/components/shared/StatCard';

const SectionHeader = ({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) => (
  <div className="px-4 py-4 border-b border-brand-border flex items-center justify-between">
    <div className="flex items-center gap-2 text-[14px] font-semibold text-brand-primary">
      {React.cloneElement(icon as any, { className: "text-brand-subtle" })}
      {title}
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
  points: { label: "Points", color: "#F59E0B" },
} satisfies ChartConfig;

// ── Main ──────────────────────────────────────────────────────────────────────
export const Dashboard = () => {
  return <AdminDashboard />;
};

const AdminDashboard = () => {
  const currency = useCurrencyStore((s) => s.currency);
  const navigate = useNavigate();
  const admin = useAuthStore(state => state.admin);
  const isStaff = admin?.role !== 'admin';
  const [view, setView] = useState<'overview' | 'pipeline'>('overview');
  const [activeChart, setActiveChart] = useState<"bank" | "cash">("bank");
  const [activityTab, setActivityTab] = useState<'chart'|'log'>('chart');
  const { theme } = useThemeStore();

  const avatarColors = theme === 'dark'
    ? ['#ff4d6d', '#ff758f', '#ffbe0b', '#fdfcdc', '#48cae4']
    : ['#1d3557', '#457b9d', '#a8dadc', '#f1faee', '#e63946'];

  useTopbarActions(
    <div className="flex bg-brand-surface rounded-md p-1 border border-brand-border">
      <button
        onClick={() => setView('overview')}
        className={`px-3 py-1 text-[12px] font-semibold rounded transition-colors ${view === 'overview' ? 'bg-brand-white shadow-sm text-brand-primary border border-brand-border/50' : 'text-brand-subtle hover:text-brand-primary'}`}
      >
        Overview
      </button>
      <button
        onClick={() => setView('pipeline')}
        className={`px-3 py-1 text-[12px] font-semibold rounded transition-colors ${view === 'pipeline' ? 'bg-brand-white shadow-sm text-brand-primary border border-brand-border/50' : 'text-brand-subtle hover:text-brand-primary'}`}
      >
        Pipeline
      </button>
    </div>
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await api.get(`/admin/dashboard`)).data,
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
    return <PageLoader label="Loading dashboard…" iconSize={22} className="min-h-[300px] gap-2" />;
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <AlertCircle className="text-brand-subtle" size={28} />
        <p className="text-sm text-brand-subtle">Failed to load dashboard data.</p>
      </div>
    );
  }

  const { stats, daily_activity = [], recent_enquiries, recent_invoices, recent_activities, user_stats, sales_stats, leaderboard } = data;

  const pct = stats.total_invoiced > 0 ? Math.round((stats.total_paid / stats.total_invoiced) * 100) : 0;

  // Non-admin/manager roles only ever see figures scoped to their own
  // records (enforced server-side too) — label them "My ..." so it's clear
  // these aren't company-wide numbers.
  const isTeamScope = admin?.role === 'admin' || admin?.role === 'manager';
  const scopedLabel = (label: string) => isTeamScope ? label : `My ${label}`;

  return (
    <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-200">
      <SEO title="Dashboard" description="Zeronix Administration" />

      <div className="flex-1 overflow-auto p-5 flex flex-col gap-4">
        {view === 'pipeline' ? (
          <PipelinePanel />
        ) : (
        <>
      {isStaff && <ClockInHeader />}

      {isTeamScope ? (
        /* Row 1 — company-wide financial KPIs (admin/manager only; these are
           the business owner's own money, not something a rep should see). */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard title="Bank Received" value={<CurrencyAmount amount={stats.total_bank_received} currency={currency} />} icon={<Building2 size={16} />} href={`${getBasePath()}/payment-receipts`} />
          <StatCard title="Cash Received" value={<CurrencyAmount amount={stats.total_cash_received} currency={currency} />} icon={<Banknote size={16} />} href={`${getBasePath()}/payment-receipts`} />
          <StatCard title="Total Invoiced" value={<CurrencyAmount amount={stats.total_invoiced} currency={currency} />} subtitle={`${pct}% collected`} icon={<Receipt size={16} />} href={`${getBasePath()}/invoices`} />
          <StatCard title="Pending Quotes" value={stats.pending_quotes} subtitle="Awaiting action" icon={<FileText size={16} />} href={`${getBasePath()}/quotes`} />
        </div>
      ) : (
        /* Row 1 — a team member's own daily/monthly activity: what they
           closed today and how their pipeline is moving this month. No
           company-wide revenue figures here, just their own numbers. */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard title="Invoices Today" value={sales_stats?.invoices_today ?? 0} icon={<Receipt size={16} />} href={`${getBasePath()}/invoices`} />
          <StatCard title="Invoice Value Today" value={<CurrencyAmount amount={sales_stats?.invoice_value_today ?? 0} currency={currency} />} icon={<Wallet size={16} />} href={`${getBasePath()}/invoices`} />
          <StatCard title="Quotes This Month" value={sales_stats?.quotes_this_month ?? 0} icon={<FileText size={16} />} href={`${getBasePath()}/quotes`} />
          <StatCard title="New Leads Today" value={sales_stats?.new_leads_today ?? 0} icon={<UserPlus size={16} />} href={`${getBasePath()}/leads`} />
          <StatCard title="Leads Converted" value={sales_stats?.leads_converted_this_month ?? 0} subtitle="This month" icon={<UserCheck size={16} />} href={`${getBasePath()}/leads`} />
          <StatCard title="Pending Quotes" value={stats.pending_quotes} subtitle="Awaiting action" icon={<FileText size={16} />} href={`${getBasePath()}/quotes`} />
        </div>
      )}

      {/* Leaderboard — team members only, ranks the tenant's reps by invoice
          value this month so everyone can see where they stand and stay
          motivated relative to their peers. */}
      {!isTeamScope && leaderboard && leaderboard.length > 0 && (
        <div className="bg-brand-white border border-brand-border rounded-xl shadow-sm overflow-hidden">
          <SectionHeader icon={<Trophy size={16} />} title="Team Leaderboard — This Month" />
          <div className="divide-y divide-brand-border/50">
            {leaderboard.map((row: any) => (
              <div
                key={row.user_id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  row.is_current_user && "bg-brand-accent-light/40"
                )}
              >
                <div className="w-6 shrink-0 flex items-center justify-center">
                  {row.rank <= 3 ? (
                    <Medal size={16} className={row.rank === 1 ? "text-amber-500" : row.rank === 2 ? "text-slate-400" : "text-amber-700"} />
                  ) : (
                    <span className="text-[12px] font-semibold text-brand-subtle">{row.rank}</span>
                  )}
                </div>
                <Avatar size={28} name={row.name} variant="beam" colors={avatarColors} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-brand-primary truncate">
                    {row.name}{row.is_current_user && <span className="text-brand-subtle font-normal"> (You)</span>}
                  </p>
                  <p className="text-[11px] text-brand-subtle">{row.invoice_count} invoice{row.invoice_count === 1 ? '' : 's'}</p>
                </div>
                <span className="text-[13px] font-mono font-semibold text-brand-primary">
                  <CurrencyAmount amount={row.total_value} currency={currency} />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Row 2 — People & Ops KPIs. Admin/manager only: enquiry/company
          counts and team-wide/catalog figures aren't actionable for a
          salesman/staff member working their own pipeline (they already
          have Enquiries/Companies context via Row 1 and the Pipeline tab). */}
      {isTeamScope && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard title="Enquiries" value={stats.total_enquiries} icon={<MessageSquare size={16} />} href={`${getBasePath()}/enquiries`} />
          <StatCard title="Companies" value={stats.active_customers} icon={<Users size={16} />} href={`${getBasePath()}/companies`} />
          {stats.total_users != null && (
            <StatCard title="Team Members" value={`${stats.active_users ?? 0} / ${stats.total_users ?? 0}`} subtitle="Active users" icon={<User size={16} />} href={`${getBasePath()}/users`} />
          )}
          <StatCard title="Products" value={stats.total_products} icon={<Package size={16} />} href={`${getBasePath()}/products`} />
        </div>
      )}

      {/* Row 3 — Financial Analytics. The bank-vs-cash split is already
          broken out in the Collection Summary below, so the pie chart here
          is only kept for admin/manager where it's the sole place to see it
          at a glance company-wide. */}
      <div className={cn("grid grid-cols-1 gap-3", isTeamScope ? "lg:grid-cols-3" : "lg:grid-cols-2")}>
        {/* Revenue Analytics */}
        <Card className="lg:col-span-1 bg-brand-white border border-brand-border rounded-xl overflow-hidden shadow-sm flex flex-col">
          <CardHeader className="flex flex-col items-stretch p-0">
            <div className="flex flex-col justify-center gap-0.5 px-4 py-4">
              <CardTitle className="text-[14px] font-semibold text-brand-primary flex items-center gap-2">
                <TrendingUp size={16} className="text-brand-subtle" />
                {scopedLabel('Revenue')}
              </CardTitle>
              <CardDescription className="text-[12px] text-brand-subtle">
                Daily collection (30d)
              </CardDescription>
            </div>
            <div className="flex border-t border-b border-brand-border/50">
              {["bank", "cash"].map((key) => {
                const chart = key as keyof typeof chartConfig;
                const isActive = activeChart === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveChart(key as "bank" | "cash")}
                    className={cn(
                      "flex flex-1 flex-col justify-center gap-0.5 px-4 py-2.5 text-left transition-all border-l first:border-l-0 border-brand-border/50",
                      isActive ? "bg-brand-bg border-b-2 border-b-brand-accent" : "hover:bg-brand-surface"
                    )}
                  >
                    <span className="text-[11px] font-medium text-brand-subtle">
                      {chartConfig[chart].label}
                    </span>
                    <span className="text-[14px] font-bold text-brand-primary">
                      <CurrencyAmount amount={totals[key as keyof typeof totals]} currency={currency} />
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

        {/* Payment Distribution Pie — admin/manager only, see comment above */}
        {isTeamScope && (
          <Card className="lg:col-span-1 bg-brand-white border border-brand-border rounded-xl overflow-hidden shadow-sm flex flex-col">
            <CardHeader className="px-4 py-4">
              <CardTitle className="text-[14px] font-semibold text-brand-primary flex items-center gap-2">
                <CreditCard size={16} className="text-brand-subtle" />
                Distribution
              </CardTitle>
              <CardDescription className="text-[12px] text-brand-subtle mt-0.5">
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
        )}

        {/* Activity Volume */}
        <Card className="lg:col-span-1 bg-brand-white border border-brand-border rounded-xl overflow-hidden shadow-sm flex flex-col">
          <CardHeader className="px-4 py-3 flex flex-row items-center justify-between border-b border-brand-border/50">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-brand-subtle" />
              <CardTitle className="text-[14px] font-semibold text-brand-primary">
                Activity
              </CardTitle>
            </div>
            
            {/* Tabs */}
            <div className="flex bg-brand-surface rounded-md p-1 border border-brand-border shadow-sm">
              <button 
                onClick={() => setActivityTab('chart')} 
                className={`px-3 py-1 text-[11px] font-bold rounded transition-colors ${activityTab === 'chart' ? 'bg-brand-white shadow-sm text-brand-primary border border-brand-border/50' : 'text-brand-subtle hover:text-brand-primary'}`}
              >
                Chart
              </button>
              <button 
                onClick={() => setActivityTab('log')} 
                className={`px-3 py-1 text-[11px] font-bold rounded transition-colors ${activityTab === 'log' ? 'bg-brand-white shadow-sm text-brand-primary border border-brand-border/50' : 'text-brand-subtle hover:text-brand-primary'}`}
              >
                Details
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {activityTab === 'chart' ? (
              <div className="p-4 h-[250px] flex flex-col justify-center">
                <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
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
                    <Bar dataKey="enquiries" stackId="activity" fill="var(--color-enquiries)" radius={[0, 0, 1, 1]} />
                    <Bar dataKey="quotes" stackId="activity" fill="var(--color-quotes)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="invoices" stackId="activity" fill="var(--color-invoices)" radius={[1, 1, 0, 0]} />
                    <ChartTooltip content={<ChartTooltipContent indicator="line" />} cursor={false} />
                    <ChartLegend content={<ChartLegendContent />} className="mt-4" />
                  </BarChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="h-[250px] overflow-y-auto divide-y divide-brand-border/50 custom-scrollbar">
                {recent_activities?.length > 0 ? recent_activities.map((act: any) => (
                  <div key={act.id} className="flex items-center gap-3 px-4 py-3 hover:bg-brand-surface transition-colors">
                    <Avatar
                      size={28}
                      name={act.user_name || 'Unknown'}
                      variant="beam"
                      colors={avatarColors}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-brand-secondary truncate leading-tight">
                        <span className="font-bold text-brand-primary">{act.user_name}</span>{' '}
                        {act.description}
                      </p>
                    </div>
                    <span className="text-[10px] font-medium text-brand-subtle shrink-0 tabular-nums">
                      {act.created_at ? timeAgo(act.created_at) : '—'}
                    </span>
                  </div>
                )) : (
                  <div className="flex h-full items-center justify-center text-[12px] text-brand-subtle">
                    No recent activity
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 4 — Collection summary + Recent enquiries + Recent invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Collection progress */}
        <div className="bg-brand-white border border-brand-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <SectionHeader icon={<CreditCard size={16} />} title="Collection Summary" />
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-[12px] text-brand-subtle">Collection Rate</span>
                <span className="text-[14px] font-semibold text-brand-primary">{pct}%</span>
              </div>
              <div className="w-full bg-brand-white rounded-full h-1.5 overflow-hidden">
                <div className="bg-zeronix-blue h-1.5 rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <div className="flex justify-between text-[11px] text-brand-subtle">
                <span>Paid: <CurrencyAmount amount={stats.total_paid} currency={currency} /></span>
                <span>Total: <CurrencyAmount amount={stats.total_invoiced} currency={currency} /></span>
              </div>
            </div>

            {/* Bank/Cash split — only shown for admin/manager; team members
                already see these as their own "My Bank/Cash Received" cards
                in Row 1, so repeating them here would be redundant. */}
            {isTeamScope && (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-brand-border">
                <div className="bg-brand-bg rounded-lg p-3 text-center border border-brand-border/50">
                  <p className="text-[14px] font-semibold text-brand-primary"><CurrencyAmount amount={stats.total_bank_received} currency={currency} /></p>
                  <p className="text-[11px] text-brand-subtle mt-0.5 ">Bank</p>
                </div>
                <div className="bg-brand-bg rounded-lg p-3 text-center border border-brand-border/50">
                  <p className="text-[14px] font-semibold text-brand-primary"><CurrencyAmount amount={stats.total_cash_received} currency={currency} /></p>
                  <p className="text-[11px] text-brand-subtle mt-0.5 ">Cash</p>
                </div>
              </div>
            )}

            {/* User performance */}
            {user_stats && user_stats.length > 0 && (
              <div className="pt-3 border-t border-brand-border space-y-2">
                <p className="text-[11px] text-brand-subtle uppercase tracking-wide flex items-center gap-1 font-medium">
                  <Users size={12} /> Team Performance
                </p>
                {user_stats.slice(0, 4).map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-brand-surface border border-brand-border text-brand-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-[12px] font-medium text-brand-primary truncate max-w-[80px]">{toTitleCase(u.name)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-brand-subtle font-medium">
                      <span className="bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border/50">{u.enquiries_count} enq</span>
                      <span className="bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border/50">{u.quotes_count} qt</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Enquiries */}
        <div className="bg-brand-white border border-brand-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <SectionHeader
            icon={<MessageSquare size={16} />}
            title="Recent Enquiries"
            action={
              <button onClick={() => navigate(`${getBasePath()}/enquiries`)} className="text-[12px] text-brand-subtle hover:text-brand-primary flex items-center gap-1 font-medium transition-colors">
                View all <ArrowRight size={12} />
              </button>
            }
          />
          <div className="divide-y divide-brand-border/50">
            {(recent_enquiries || []).slice(0, 6).map((enq: any) => (
              <div
                key={enq.id}
                onClick={() => navigate(`${getBasePath()}/enquiries`)}
                className="flex items-center justify-between px-4 py-3 hover:bg-brand-surface cursor-pointer transition-colors"
              >
                <div>
                  <p className="text-[13px] font-medium text-brand-primary">{enq.customer?.name || 'Unknown'}</p>
                  <p className="text-[11px] text-brand-subtle mt-0.5">{enq.created_at ? timeAgo(enq.created_at) : '—'}</p>
                </div>
                <StatusBadge status={enq.status} />
              </div>
            ))}
            {(!recent_enquiries || recent_enquiries.length === 0) && (
              <p className="px-4 py-6 text-[12px] text-brand-subtle text-center">No recent enquiries</p>
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-brand-white border border-brand-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <SectionHeader
            icon={<Receipt size={16} />}
            title="Recent Invoices"
            action={
              <button onClick={() => navigate(`${getBasePath()}/invoices`)} className="text-[12px] text-brand-subtle hover:text-brand-primary flex items-center gap-1 font-medium transition-colors">
                View all <ArrowRight size={12} />
              </button>
            }
          />
          <div className="divide-y divide-brand-border/50">
            {(recent_invoices || []).slice(0, 6).map((inv: any) => (
              <div
                key={inv.id}
                onClick={() => navigate(`${getBasePath()}/invoices/${inv.id}`)}
                className="flex items-center justify-between px-4 py-3 hover:bg-brand-surface cursor-pointer transition-colors"
              >
                <div>
                  <p className="text-[13px] font-mono font-medium text-brand-primary">{inv.invoice_number}</p>
                  <p className="text-[11px] text-brand-subtle mt-0.5">{inv.customer?.name || '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-semibold text-brand-primary"><CurrencyAmount amount={Number(inv.total)} currency={currency} /></p>
                  <div className="mt-1 flex justify-end">
                    <StatusBadge status={inv.status} />
                  </div>
                </div>
              </div>
            ))}
            {(!recent_invoices || recent_invoices.length === 0) && (
              <p className="px-4 py-6 text-[12px] text-brand-subtle text-center">No recent invoices</p>
            )}
          </div>
        </div>
      </div>

      {isStaff && <ProductivitySuite activities={recent_activities} />}
      </>
        )}
      </div>
    </div>
  );
};