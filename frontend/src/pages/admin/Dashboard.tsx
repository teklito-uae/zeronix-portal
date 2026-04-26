import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { SEO } from '@/components/shared/SEO';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useNavigate } from 'react-router-dom';
import {
  FileText, MessageSquare, TrendingUp, Building2, Banknote,
  Clock, Loader2, Package, Receipt, Users, Activity,
  CheckCircle2, AlertCircle, ArrowRight, User, CreditCard,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/utils';

// ── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string;
  href?: string;
}

const StatCard = ({ title, value, subtitle, icon, iconBg, href }: StatCardProps) => {
  const navigate = useNavigate();
  return (
    <div
      className={cn(
        "bg-admin-surface border border-admin-border rounded-md p-3.5 transition-all",
        href && "cursor-pointer hover:border-zeronix-blue/30 hover:shadow-sm"
      )}
      onClick={() => href && navigate(href)}
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-md shrink-0", iconBg)}>{icon}</div>
        <div className="min-w-0">
          <p className="text-[11px] text-admin-text-muted">{title}</p>
          <p className="text-sm font-semibold text-admin-text-primary mt-0.5 truncate">{value}</p>
          {subtitle && <p className="text-[11px] text-admin-text-muted">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

// ── Section Header ────────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) => (
  <div className="px-4 py-3 border-b border-admin-border flex items-center justify-between">
    <div className="flex items-center gap-2 text-sm font-medium text-admin-text-primary">
      {icon}{title}
    </div>
    {action}
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
export const Dashboard = () => {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await api.get('/admin/dashboard')).data,
    refetchInterval: 60_000,
  });

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

  const { stats, chart_data, recent_enquiries, recent_invoices, recent_activities, user_stats } = data;
  const fmt = (val: number) => val > 0 ? `${Number(val).toLocaleString(undefined, { minimumFractionDigits: 0 })} AED` : '0 AED';
  const pct = stats.total_invoiced > 0 ? Math.round((stats.total_paid / stats.total_invoiced) * 100) : 0;

  return (
    <div className="space-y-4">
      <SEO title="Dashboard" description="Zeronix Administration" />

      {/* Row 1 — Financial KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Bank Received" value={fmt(stats.total_bank_received)} icon={<Building2 size={15} className="text-indigo-500" />} iconBg="bg-indigo-500/10" href="/admin/payment-receipts" />
        <StatCard title="Cash Received" value={fmt(stats.total_cash_received)} icon={<Banknote size={15} className="text-emerald-500" />} iconBg="bg-emerald-500/10" href="/admin/payment-receipts" />
        <StatCard title="Total Invoiced" value={fmt(stats.total_invoiced)} subtitle={`${pct}% collected`} icon={<Receipt size={15} className="text-zeronix-blue" />} iconBg="bg-zeronix-blue/10" href="/admin/invoices" />
        <StatCard title="Pending Quotes" value={stats.pending_quotes} subtitle="Awaiting action" icon={<FileText size={15} className="text-amber-500" />} iconBg="bg-amber-500/10" href="/admin/quotes" />
      </div>

      {/* Row 2 — People & Ops KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Enquiries" value={stats.total_enquiries} icon={<MessageSquare size={15} className="text-purple-500" />} iconBg="bg-purple-500/10" href="/admin/enquiries" />
        <StatCard title="Customers" value={stats.active_customers} icon={<Users size={15} className="text-cyan-500" />} iconBg="bg-cyan-500/10" href="/admin/customers" />
        <StatCard title="Team Members" value={`${stats.active_users ?? 0} / ${stats.total_users ?? 0}`} subtitle="Active users" icon={<User size={15} className="text-rose-500" />} iconBg="bg-rose-500/10" href="/admin/users" />
        <StatCard title="Products" value={stats.total_products} icon={<Package size={15} className="text-orange-500" />} iconBg="bg-orange-500/10" href="/admin/products" />
      </div>

      {/* Row 3 — Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-admin-surface border border-admin-border rounded-md overflow-hidden">
          <SectionHeader
            icon={<TrendingUp size={13} className="text-zeronix-blue" />}
            title="Revenue (Last 6 Months)"
            action={<span className="text-[11px] text-admin-text-muted">AED</span>}
          />
          <div className="p-4">
            <div className="h-56 w-full [&_.recharts-wrapper]:outline-none [&_.recharts-surface]:outline-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart_data} style={{ outline: 'none' }}>
                  <defs>
                    <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} width={40} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--admin-surface, #fff)', borderColor: '#E2E8F0', borderRadius: '6px', fontSize: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                    cursor={{ stroke: '#10B981', strokeWidth: 1, strokeDasharray: '3 3' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#gradRev)" name="Revenue (AED)" dot={false} activeDot={{ r: 4, fill: '#10B981', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Activity volume bar chart */}
        <div className="bg-admin-surface border border-admin-border rounded-md overflow-hidden">
          <SectionHeader icon={<Activity size={13} className="text-purple-500" />} title="Activity Volume" />
          <div className="p-4">
            <div className="h-56 w-full [&_.recharts-wrapper]:outline-none [&_.recharts-surface]:outline-none">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart_data} style={{ outline: 'none' }} barSize={8} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} width={24} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--admin-surface, #fff)', borderColor: '#E2E8F0', borderRadius: '6px', fontSize: '11px' }}
                    cursor={{ fill: '#F4F6FA' }}
                  />
                  <Bar dataKey="enquiries" name="Enquiries" fill="#A78BFA" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="quotes" name="Quotes" fill="#FCD34D" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="invoices" name="Invoices" fill="#10B981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
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
              <button onClick={() => navigate('/admin/enquiries')} className="text-[11px] text-zeronix-blue hover:underline flex items-center gap-0.5">
                View all <ArrowRight size={10} />
              </button>
            }
          />
          <div className="divide-y divide-admin-border">
            {(recent_enquiries || []).slice(0, 6).map((enq: any) => (
              <div
                key={enq.id}
                onClick={() => navigate('/admin/enquiries')}
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
              <button onClick={() => navigate('/admin/invoices')} className="text-[11px] text-zeronix-blue hover:underline flex items-center gap-0.5">
                View all <ArrowRight size={10} />
              </button>
            }
          />
          <div className="divide-y divide-admin-border">
            {(recent_invoices || []).slice(0, 6).map((inv: any) => (
              <div
                key={inv.id}
                onClick={() => navigate(`/admin/invoices/${inv.id}`)}
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
              <button onClick={() => navigate('/admin/activities')} className="text-[11px] text-zeronix-blue hover:underline flex items-center gap-0.5">
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
