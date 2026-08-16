import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { StatCard } from '@/components/shared/StatCard';
import { MessageSquareText, FileText, Receipt, Package, Loader2, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/shared/SEO';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { CurrencyAmount } from '@/components/shared/CurrencyAmount';
import type { Deal, Invoice, ActivityLogEntry } from '@/types';

interface MonthCount {
  month: string;
  count: number;
}

interface CustomerDashboardResponse {
  stats: {
    enquiries_count: number;
    quotes_count: number;
    invoices_count: number;
    total_spent: number;
  };
  charts: {
    enquiries: MonthCount[];
    quotes: MonthCount[];
  };
  // Deal's `status` column is legacy/unused by the current stage-based
  // lifecycle but still physically present on the `enquiries` table, so it
  // can come back on the raw serialized model here.
  recent_enquiries: (Deal & { status?: string })[];
  recent_invoices: Invoice[];
  recent_activity: ActivityLogEntry[];
}

export const CustomerDashboard = () => {
  const currency = useCurrencyStore((s) => s.currency);
  const navigate = useNavigate();
  const { company } = useParams();
  
  const { data: dash, isLoading } = useQuery({
    queryKey: ['customer-dashboard'],
    queryFn: async (): Promise<CustomerDashboardResponse> => (await api.get('/customer/dashboard')).data
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-brand-accent" />
          <div className="absolute inset-0 blur-xl bg-brand-accent/20 animate-pulse" />
        </div>
        <p className="text-brand-subtle mt-4 font-medium uppercase tracking-widest text-[10px]">Syncing Portal...</p>
      </div>
    );
  }

  const stats = dash?.stats || { enquiries_count: 0, quotes_count: 0, invoices_count: 0, total_spent: 0 };
  const charts = dash?.charts || { enquiries: [], quotes: [] };
  
  // Robustly merge chart data
  const months = Array.from(new Set([
    ...charts.enquiries.map((d) => d.month),
    ...charts.quotes.map((d) => d.month)
  ]));

  const combinedData = months.map(m => ({
    month: m,
    enquiries: charts.enquiries.find((d) => d.month === m)?.count || 0,
    quotes: charts.quotes.find((d) => d.month === m)?.count || 0
  }));

  return (
    <div className="space-y-6 pb-10">
      <SEO title="Dashboard" description="Overview of your project activity." />
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-brand-white border border-brand-border p-8 rounded-xl shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-brand-primary tracking-tight">Portal Overview</h1>
          <p className="text-brand-secondary mt-1 text-sm">
            Track your enterprise hardware procurement and billing in one place.
          </p>
        </div>
        <div className="flex gap-2 relative z-10">
          <Button onClick={() => navigate(`/portal/${company}/products`)} className="bg-brand-accent hover:bg-brand-accent-hover text-white h-10 px-6 font-bold shadow-sm">
            <Package size={16} className="mr-2" /> Browse Catalog
          </Button>
          <Button variant="outline" className="border-brand-border bg-brand-bg text-brand-primary hover:bg-brand-bg h-10 px-6 font-medium">
             Enquiries List
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Enquiries"
          value={stats.enquiries_count}
          icon={<MessageSquareText className="text-brand-accent" size={20} />}
          className="bg-brand-white border-brand-border"
        />
        <StatCard
          title="Active Quotes"
          value={stats.quotes_count}
          icon={<FileText className="text-emerald-500" size={20} />}
          className="bg-brand-white border-brand-border"
        />
        <StatCard
          title="Total Invoices"
          value={stats.invoices_count}
          icon={<Receipt className="text-amber-500" size={20} />}
          className="bg-brand-white border-brand-border"
        />
        <StatCard
          title="Total Paid"
          value={<CurrencyAmount amount={stats.total_spent} currency={currency} size={18} />}
          icon={<TrendingUp className="text-emerald-600" size={20} />}
          className="bg-brand-white border-brand-border"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Analytics Chart */}
        <Card className="lg:col-span-8 bg-brand-white border-brand-border shadow-sm overflow-hidden">
          <CardHeader className="border-b border-brand-border bg-brand-bg/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-brand-primary uppercase tracking-widest">Procurement Trends</CardTitle>
                <CardDescription className="text-xs text-brand-subtle">6-month activity log</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-brand-subtle">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-brand-accent" /> Enquiries</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Quotes</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={combinedData}>
                  <defs>
                    <linearGradient id="colorEnq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F52BA" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#0F52BA" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorQuote" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--brand-border)" opacity={0.5} />
                  <XAxis 
                    dataKey="month" 
                    stroke="var(--brand-subtle)" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="var(--brand-subtle)" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--brand-white)', border: '1px solid var(--brand-border)', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="enquiries" stroke="#0F52BA" strokeWidth={2} fillOpacity={1} fill="url(#colorEnq)" />
                  <Area type="monotone" dataKey="quotes" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorQuote)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card className="lg:col-span-4 bg-brand-white border-brand-border shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="border-b border-brand-border bg-brand-bg/30">
            <CardTitle className="text-sm font-bold text-brand-primary uppercase tracking-widest flex items-center gap-2">
              <Clock size={14} className="text-brand-accent" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto max-h-[400px]">
             {dash?.recent_activity && dash.recent_activity.length > 0 ? (
               <div className="relative p-6 space-y-6">
                 <div className="absolute left-8 top-8 bottom-8 w-px bg-brand-border" />
                 {dash.recent_activity.map((act, i: number) => (
                   <div key={i} className="relative pl-10">
                      <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-brand-white border-2 border-brand-accent z-10" />
                      <div className="flex flex-col gap-1">
                         <p className="text-xs font-bold text-brand-primary leading-tight">{act.description}</p>
                         <p className="text-[10px] text-brand-subtle flex items-center gap-1 font-medium">
                           <Clock size={10} /> {act.created_at ? new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'} • {act.created_at ? new Date(act.created_at).toLocaleDateString() : '—'}
                         </p>
                      </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                 <AlertCircle size={32} className="text-brand-subtle/20 mb-3" />
                 <p className="text-xs text-brand-subtle italic">No activity recorded yet.</p>
               </div>
             )}
          </CardContent>
          <div className="p-4 border-t border-brand-border bg-brand-bg/10">
             <Button variant="ghost" className="w-full h-8 text-[11px] font-bold text-brand-subtle uppercase tracking-widest hover:text-brand-accent">
               Download Logs
             </Button>
          </div>
        </Card>
      </div>

      {/* Grid for Bottom Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Enquiries */}
        <Card className="bg-brand-white border-brand-border shadow-sm overflow-hidden">
          <CardHeader className="border-b border-brand-border bg-brand-bg/30 flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-bold text-brand-primary uppercase tracking-widest">Active Enquiries</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-widest text-brand-accent" onClick={() => navigate(`/portal/${company}/enquiries`)}>
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-0">
             <div className="divide-y divide-brand-border">
               {dash?.recent_enquiries && dash.recent_enquiries.length > 0 ? (
                 dash.recent_enquiries.map((enq) => (
                   <div key={enq.id} className="p-4 hover:bg-brand-bg/40 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-brand-bg border border-brand-border flex items-center justify-center">
                            <MessageSquareText size={14} className="text-brand-subtle" />
                         </div>
                         <div>
                            <p className="text-xs font-bold text-brand-primary">ENQ-{String(enq.id).padStart(5, '0')}</p>
                            <p className="text-[10px] text-brand-subtle font-medium uppercase tracking-tight">{enq.created_at ? new Date(enq.created_at).toLocaleDateString() : '—'}</p>
                         </div>
                      </div>
                      <StatusBadge status={enq.status ?? ''} />
                   </div>
                 ))
               ) : (
                 <p className="p-8 text-center text-xs text-brand-subtle italic">No active requests</p>
               )}
             </div>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="bg-brand-white border-brand-border shadow-sm overflow-hidden">
          <CardHeader className="border-b border-brand-border bg-brand-bg/30 flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-bold text-brand-primary uppercase tracking-widest">Recent Invoices</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-widest text-brand-accent" onClick={() => navigate(`/portal/${company}/invoices`)}>
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-0">
             <div className="divide-y divide-brand-border">
               {dash?.recent_invoices && dash.recent_invoices.length > 0 ? (
                 dash.recent_invoices.map((inv) => (
                   <div key={inv.id} className="p-4 hover:bg-brand-bg/40 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-brand-bg border border-brand-border flex items-center justify-center">
                            <Receipt size={14} className="text-emerald-500" />
                         </div>
                         <div>
                            <p className="text-xs font-bold text-brand-primary">{inv.invoice_number}</p>
                            <p className="text-[10px] text-brand-subtle font-bold uppercase tracking-tighter"><CurrencyAmount amount={inv.total} currency={currency} /></p>
                         </div>
                      </div>
                      <StatusBadge status={inv.status} />
                   </div>
                 ))
               ) : (
                 <p className="p-8 text-center text-xs text-brand-subtle italic">No invoices found</p>
               )}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
