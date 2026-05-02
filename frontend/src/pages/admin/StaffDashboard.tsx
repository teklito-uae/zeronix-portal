import { getBasePath } from '@/hooks/useBasePath';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import {
  Users, FileText, Receipt, TrendingUp, Activity,
  ArrowRight, Loader2, AlertCircle, MessageSquare, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { timeAgo } from '@/lib/utils';

export const StaffDashboard = () => {
  const navigate = useNavigate();
  const admin = useAuthStore(state => state.admin);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard'], // Shares cache but backend scopes by role
    queryFn: async () => (await api.get(`${getBasePath()}/dashboard`)).data,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-zeronix-blue" size={32} />
        <p className="text-sm font-medium text-admin-text-muted animate-pulse">Synchronizing pipeline data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <AlertCircle className="text-red-500" size={40} />
        <p className="text-sm font-bold text-admin-text-primary">Failed to load dashboard.</p>
        <button
          onClick={() => window.location.reload()}
          className="text-xs text-zeronix-blue hover:underline font-bold uppercase tracking-widest"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { stats, chart_data = [], recent_enquiries = [], recent_invoices = [] } = data;

  const fmt = (val: number) => val > 0 ? `${Number(val).toLocaleString(undefined, { minimumFractionDigits: 0 })} AED` : '0 AED';

  return (
    <div className="space-y-6 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-admin-text-primary">
            Pipeline Overview
          </h1>
          <p className="text-admin-text-muted mt-1 font-medium">
            Welcome back, <span className="text-zeronix-blue font-bold">{admin?.name}</span>. Here's your sales performance today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-admin-surface border border-admin-border px-4 py-2 rounded-2xl flex items-center gap-3 shadow-sm">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-admin-text-primary uppercase tracking-wider">Live System Status</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="My Customers"
          value={stats.active_customers}
          icon={<Users size={16} className="text-indigo-500" />}
          iconBg="bg-indigo-500/10"
          href={`${getBasePath()}/customers`}
        />
        <StatCard
          title="Active Leads"
          value={stats.total_enquiries}
          icon={<MessageSquare size={16} className="text-purple-500" />}
          iconBg="bg-purple-500/10"
          href={`${getBasePath()}/enquiries`}
        />
        <StatCard
          title="Quotes Sent"
          value={stats.total_quotes}
          icon={<FileText size={16} className="text-amber-500" />}
          iconBg="bg-amber-500/10"
          href={`${getBasePath()}/quotes`}
        />
        <StatCard
          title="Total Revenue"
          value={fmt(stats.total_paid)}
          icon={<TrendingUp size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-500/10"
          href={`${getBasePath()}/invoices`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Performance Chart */}
        <Card className="lg:col-span-2 bg-admin-surface border-admin-border rounded-3xl overflow-hidden shadow-xl shadow-black/5">
          <CardHeader className="border-b border-admin-border bg-admin-bg/20 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black text-admin-text-primary flex items-center gap-2">
                  <Activity size={18} className="text-zeronix-blue" />
                  Activity Timeline
                </CardTitle>
                <CardDescription className="text-xs font-bold text-admin-text-muted uppercase tracking-widest mt-1">
                  Enquiries vs Quotes vs Invoices (6 Months)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEnq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorQt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FCD34D" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FCD34D" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="enquiries" stroke="#A78BFA" strokeWidth={3} fillOpacity={1} fill="url(#colorEnq)" />
                  <Area type="monotone" dataKey="quotes" stroke="#FCD34D" strokeWidth={3} fillOpacity={1} fill="url(#colorQt)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Stats */}
        <Card className="bg-admin-surface border-admin-border rounded-3xl overflow-hidden shadow-xl shadow-black/5 flex flex-col">
          <CardHeader className="border-b border-admin-border bg-admin-bg/20 px-6 py-5">
            <CardTitle className="text-lg font-black text-admin-text-primary flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" />
              Efficiency
            </CardTitle>
            <CardDescription className="text-xs font-bold text-admin-text-muted uppercase tracking-widest mt-1">
              Collection Efficiency
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-center items-center text-center">
            <div className="relative h-40 w-40 flex items-center justify-center mb-6">
              <svg className="h-full w-full -rotate-90">
                <circle
                  cx="80" cy="80" r="70"
                  fill="none" stroke="currentColor" strokeWidth="12"
                  className="text-admin-bg"
                />
                <circle
                  cx="80" cy="80" r="70"
                  fill="none" stroke="currentColor" strokeWidth="12"
                  strokeDasharray={440}
                  strokeDashoffset={440 - (440 * (stats.paid_invoices_count / (stats.total_invoices || 1)))}
                  strokeLinecap="round"
                  className="text-zeronix-blue transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-admin-text-primary">
                  {Math.round((stats.paid_invoices_count / (stats.total_invoices || 1)) * 100)}%
                </span>
                <span className="text-[10px] font-bold text-admin-text-muted uppercase tracking-widest">Collection</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="p-3 rounded-2xl bg-admin-bg border border-admin-border">
                <p className="text-xs font-bold text-admin-text-muted uppercase tracking-tighter">Invoiced</p>
                <p className="text-sm font-black text-admin-text-primary">{stats.total_invoices}</p>
              </div>
              <div className="p-3 rounded-2xl bg-admin-bg border border-admin-border">
                <p className="text-xs font-bold text-admin-text-muted uppercase tracking-tighter">Paid</p>
                <p className="text-sm font-black text-emerald-500">{stats.paid_invoices_count || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card className="bg-admin-surface border-admin-border rounded-3xl overflow-hidden shadow-xl shadow-black/5">
          <CardHeader className="border-b border-admin-border bg-admin-bg/20 px-6 py-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-black text-admin-text-primary flex items-center gap-2">
                <Clock size={16} className="text-purple-500" />
                Latest Leads
              </CardTitle>
            </div>
            <button
              onClick={() => navigate(`${getBasePath()}/enquiries`)}
              className="text-[10px] font-black text-zeronix-blue uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              View Hub <ArrowRight size={12} />
            </button>
          </CardHeader>
          <div className="divide-y divide-admin-border">
            {recent_enquiries.length > 0 ? recent_enquiries.map((enq: any) => (
              <div
                key={enq.id}
                onClick={() => navigate(`${getBasePath()}/enquiries`)}
                className="flex items-center justify-between px-6 py-4 hover:bg-admin-surface-hover cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                    {enq.customer?.name?.[0] || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-admin-text-primary">{enq.customer?.name || 'Manual Lead'}</p>
                    <p className="text-[10px] text-admin-text-muted font-medium flex items-center gap-1 mt-0.5">
                      <Clock size={10} /> {timeAgo(enq.created_at)}
                    </p>
                  </div>
                </div>
                <StatusBadge status={enq.status} />
              </div>
            )) : (
              <div className="p-10 text-center text-admin-text-muted text-xs font-bold italic">No recent leads found.</div>
            )}
          </div>
        </Card>

        {/* Recent Financials */}
        <Card className="bg-admin-surface border-admin-border rounded-3xl overflow-hidden shadow-xl shadow-black/5">
          <CardHeader className="border-b border-admin-border bg-admin-bg/20 px-6 py-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-black text-admin-text-primary flex items-center gap-2">
                <Receipt size={16} className="text-zeronix-blue" />
                Recent Invoices
              </CardTitle>
            </div>
            <button
              onClick={() => navigate(`${getBasePath()}/invoices`)}
              className="text-[10px] font-black text-zeronix-blue uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              All Invoices <ArrowRight size={12} />
            </button>
          </CardHeader>
          <div className="divide-y divide-admin-border">
            {recent_invoices.length > 0 ? recent_invoices.map((inv: any) => (
              <div
                key={inv.id}
                onClick={() => navigate(`${getBasePath()}/invoices/${inv.id}`)}
                className="flex items-center justify-between px-6 py-4 hover:bg-admin-surface-hover cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-zeronix-blue/10 text-zeronix-blue flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-admin-text-primary font-mono">{inv.invoice_number}</p>
                    <p className="text-[10px] text-admin-text-muted font-medium">{inv.customer?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-admin-text-primary">{fmt(Number(inv.total))}</p>
                  <StatusBadge status={inv.status} />
                </div>
              </div>
            )) : (
              <div className="p-10 text-center text-admin-text-muted text-xs font-bold italic">No recent invoices found.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
