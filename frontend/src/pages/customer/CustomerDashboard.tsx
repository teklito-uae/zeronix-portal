import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { StatCard } from '@/components/shared/StatCard';
import { MessageSquareText, FileText, Receipt, Package, Loader2, TrendingUp, Calendar, ArrowRight, Clock, User, CheckCircle2, AlertCircle } from 'lucide-react';
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

export const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { company } = useParams();
  
  const { data: dash, isLoading } = useQuery({
    queryKey: ['customer-dashboard'],
    queryFn: async () => (await api.get('/customer/dashboard')).data
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-zeronix-blue" />
          <div className="absolute inset-0 blur-xl bg-zeronix-blue/20 animate-pulse" />
        </div>
        <p className="text-admin-text-muted mt-4 font-medium uppercase tracking-widest text-[10px]">Syncing Portal...</p>
      </div>
    );
  }

  const stats = dash?.stats || { enquiries_count: 0, quotes_count: 0, invoices_count: 0, total_spent: 0 };
  const charts = dash?.charts || { enquiries: [], quotes: [] };
  
  // Robustly merge chart data
  const months = Array.from(new Set([
    ...charts.enquiries.map((d: any) => d.month),
    ...charts.quotes.map((d: any) => d.month)
  ]));

  const combinedData = months.map(m => ({
    month: m,
    enquiries: charts.enquiries.find((d: any) => d.month === m)?.count || 0,
    quotes: charts.quotes.find((d: any) => d.month === m)?.count || 0
  }));

  return (
    <div className="space-y-6 pb-10">
      <SEO title="Dashboard" description="Overview of your project activity." />
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-admin-surface border border-admin-border p-8 rounded-xl shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-admin-text-primary tracking-tight">Portal Overview</h1>
          <p className="text-admin-text-secondary mt-1 text-sm">
            Track your enterprise hardware procurement and billing in one place.
          </p>
        </div>
        <div className="flex gap-2 relative z-10">
          <Button onClick={() => navigate(`/portal/${company}/products`)} className="bg-zeronix-blue hover:bg-zeronix-blue-hover text-white h-10 px-6 font-bold shadow-sm">
            <Package size={16} className="mr-2" /> Browse Catalog
          </Button>
          <Button variant="outline" className="border-admin-border bg-admin-bg text-admin-text-primary hover:bg-admin-surface-hover h-10 px-6 font-medium">
             Enquiries List
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Enquiries"
          value={stats.enquiries_count}
          icon={<MessageSquareText className="text-zeronix-blue" size={20} />}
          className="bg-admin-surface border-admin-border"
        />
        <StatCard
          title="Active Quotes"
          value={stats.quotes_count}
          icon={<FileText className="text-emerald-500" size={20} />}
          className="bg-admin-surface border-admin-border"
        />
        <StatCard
          title="Total Invoices"
          value={stats.invoices_count}
          icon={<Receipt className="text-amber-500" size={20} />}
          className="bg-admin-surface border-admin-border"
        />
        <StatCard
          title="Total Paid"
          value={`AED ${Number(stats.total_spent).toLocaleString()}`}
          icon={<TrendingUp className="text-emerald-600" size={20} />}
          className="bg-admin-surface border-admin-border"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Analytics Chart */}
        <Card className="lg:col-span-8 bg-admin-surface border-admin-border shadow-sm overflow-hidden">
          <CardHeader className="border-b border-admin-border bg-admin-bg/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-admin-text-primary uppercase tracking-widest">Procurement Trends</CardTitle>
                <CardDescription className="text-xs text-admin-text-muted">6-month activity log</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-admin-text-muted">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-zeronix-blue" /> Enquiries</div>
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--admin-border)" opacity={0.5} />
                  <XAxis 
                    dataKey="month" 
                    stroke="var(--admin-text-muted)" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="var(--admin-text-muted)" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="enquiries" stroke="#0F52BA" strokeWidth={2} fillOpacity={1} fill="url(#colorEnq)" />
                  <Area type="monotone" dataKey="quotes" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorQuote)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card className="lg:col-span-4 bg-admin-surface border-admin-border shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="border-b border-admin-border bg-admin-bg/30">
            <CardTitle className="text-sm font-bold text-admin-text-primary uppercase tracking-widest flex items-center gap-2">
              <Clock size={14} className="text-zeronix-blue" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto max-h-[400px]">
             {dash?.recent_activity?.length > 0 ? (
               <div className="relative p-6 space-y-6">
                 <div className="absolute left-8 top-8 bottom-8 w-px bg-admin-border" />
                 {dash.recent_activity.map((act: any, i: number) => (
                   <div key={i} className="relative pl-10">
                      <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-admin-surface border-2 border-zeronix-blue z-10" />
                      <div className="flex flex-col gap-1">
                         <p className="text-xs font-bold text-admin-text-primary leading-tight">{act.description}</p>
                         <p className="text-[10px] text-admin-text-muted flex items-center gap-1 font-medium">
                           <Clock size={10} /> {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(act.created_at).toLocaleDateString()}
                         </p>
                      </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                 <AlertCircle size={32} className="text-admin-text-muted/20 mb-3" />
                 <p className="text-xs text-admin-text-muted italic">No activity recorded yet.</p>
               </div>
             )}
          </CardContent>
          <div className="p-4 border-t border-admin-border bg-admin-bg/10">
             <Button variant="ghost" className="w-full h-8 text-[11px] font-bold text-admin-text-muted uppercase tracking-widest hover:text-zeronix-blue">
               Download Logs
             </Button>
          </div>
        </Card>
      </div>

      {/* Grid for Bottom Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Enquiries */}
        <Card className="bg-admin-surface border-admin-border shadow-sm overflow-hidden">
          <CardHeader className="border-b border-admin-border bg-admin-bg/30 flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-bold text-admin-text-primary uppercase tracking-widest">Active Enquiries</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-widest text-zeronix-blue" onClick={() => navigate(`/portal/${company}/enquiries`)}>
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-0">
             <div className="divide-y divide-admin-border">
               {dash?.recent_enquiries?.length > 0 ? (
                 dash.recent_enquiries.map((enq: any) => (
                   <div key={enq.id} className="p-4 hover:bg-admin-bg/40 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-admin-bg border border-admin-border flex items-center justify-center">
                            <MessageSquareText size={14} className="text-admin-text-muted" />
                         </div>
                         <div>
                            <p className="text-xs font-bold text-admin-text-primary">ENQ-{String(enq.id).padStart(5, '0')}</p>
                            <p className="text-[10px] text-admin-text-muted font-medium uppercase tracking-tight">{new Date(enq.created_at).toLocaleDateString()}</p>
                         </div>
                      </div>
                      <StatusBadge status={enq.status} />
                   </div>
                 ))
               ) : (
                 <p className="p-8 text-center text-xs text-admin-text-muted italic">No active requests</p>
               )}
             </div>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="bg-admin-surface border-admin-border shadow-sm overflow-hidden">
          <CardHeader className="border-b border-admin-border bg-admin-bg/30 flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-bold text-admin-text-primary uppercase tracking-widest">Recent Invoices</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-widest text-zeronix-blue" onClick={() => navigate(`/portal/${company}/invoices`)}>
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-0">
             <div className="divide-y divide-admin-border">
               {dash?.recent_invoices?.length > 0 ? (
                 dash.recent_invoices.map((inv: any) => (
                   <div key={inv.id} className="p-4 hover:bg-admin-bg/40 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-admin-bg border border-admin-border flex items-center justify-center">
                            <Receipt size={14} className="text-emerald-500" />
                         </div>
                         <div>
                            <p className="text-xs font-bold text-admin-text-primary">{inv.invoice_number}</p>
                            <p className="text-[10px] text-admin-text-muted font-bold uppercase tracking-tighter">AED {Number(inv.total).toLocaleString()}</p>
                         </div>
                      </div>
                      <StatusBadge status={inv.status} />
                   </div>
                 ))
               ) : (
                 <p className="p-8 text-center text-xs text-admin-text-muted italic">No invoices found</p>
               )}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
