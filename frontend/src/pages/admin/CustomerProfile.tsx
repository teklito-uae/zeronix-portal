import { useParams, useNavigate } from 'react-router-dom';
import { useBreadcrumb } from '@/hooks/useBreadcrumb';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/shared/StatCard';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { timeAgo } from '@/lib/utils';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import type { Enquiry, Quote, Invoice } from '@/types';
import { Mail, Phone, Building2, Calendar, FileText, MessageSquare, Receipt, Loader2, MapPin, ShieldCheck, User as UserIcon, Wallet, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Customer Relationship Management View
 * High-fidelity profile dashboard for administrative oversight.
 */
export const CustomerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => (await api.get(`/admin/customers/${id}`)).data,
    enabled: !!id,
  });

  useBreadcrumb([
    { label: 'Client Registry', href: '/admin/customers' },
    { label: data?.customer?.name || 'Identity Profile' },
  ]);

  const registerPortalMutation = useMutation({
    mutationFn: async () => api.post(`/admin/customers/${id}/register-portal`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      toast.success('Client registered for portal access. Welcome protocol initiated.');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Access registration failure.'),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="animate-spin text-zeronix-blue" size={32} />
        <p className="text-[10px] font-bold uppercase tracking-wider text-admin-text-muted">Analyzing Relationship Data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-admin-surface border border-dashed border-admin-border rounded-2xl">
        <p className="text-sm font-bold text-admin-text-muted uppercase tracking-wider">Client Identity Not Found</p>
      </div>
    );
  }

  const { customer, enquiries, quotes, invoices } = data;

  const enquiryColumns: ColumnDef<Enquiry>[] = [
    {
      accessorKey: 'id',
      header: 'Reference',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-zeronix-blue font-bold bg-zeronix-blue/5 px-2 py-0.5 rounded border border-zeronix-blue/10">
          ENQ-{String(row.original.id).padStart(3, '0')}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Pipeline',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'priority',
      header: 'Criticality',
      cell: ({ row }) => <StatusBadge status={row.original.priority} />,
    },
    {
      accessorKey: 'items_count',
      header: 'Volume',
      cell: ({ row }) => <span className="text-xs font-bold text-admin-text-primary uppercase tracking-wider">{row.original.items?.length || 0} ITEMS</span>,
    },
    {
      accessorKey: 'created_at',
      header: 'Chronology',
      cell: ({ row }) => (
        <span className="text-admin-text-muted text-[10px] font-bold uppercase tracking-wider">
          {row.original.created_at ? timeAgo(row.original.created_at) : '—'}
        </span>
      ),
    },
  ];

  const quoteColumns: ColumnDef<Quote>[] = [
    {
      accessorKey: 'quote_number',
      header: 'Instrument #',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-zeronix-blue font-bold uppercase">
          {row.original.quote_number || `QT-${String(row.original.id).padStart(4, '0')}`}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Execution',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'total',
      header: 'Valuation',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-bold text-admin-text-primary">
          {(row.original.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] opacity-40 uppercase">AED</span>
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Issued',
      cell: ({ row }) => (
        <span className="text-admin-text-muted text-[10px] font-bold uppercase tracking-wider">
          {row.original.created_at ? timeAgo(row.original.created_at) : '—'}
        </span>
      ),
    },
  ];

  const invoiceColumns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'invoice_number',
      header: 'Ledger #',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-zeronix-blue font-bold uppercase">
          {row.original.invoice_number || `INV-${String(row.original.id).padStart(4, '0')}`}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Settlement',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'total',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-bold text-admin-text-primary">
          {(row.original.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] opacity-40 uppercase">AED</span>
        </span>
      ),
    },
    {
      accessorKey: 'due_date',
      header: 'Deadline',
      cell: ({ row }) => (
        <span className={cn(
          "text-[10px] font-bold uppercase tracking-wider",
          row.original.status === 'overdue' ? 'text-red-600 bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10' : 'text-admin-text-muted'
        )}>
          {row.original.due_date ? new Date(row.original.due_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Premium Identity Header */}
      <div className="bg-admin-surface border border-admin-border rounded-2xl p-6 shadow-sm overflow-hidden relative">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-zeronix-blue via-indigo-500 to-purple-500" />
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
               <div className="h-16 w-16 rounded-2xl bg-admin-bg border border-admin-border flex items-center justify-center text-zeronix-blue shadow-inner group">
                  <UserIcon size={32} className="group-hover:scale-110 transition-transform duration-500" />
               </div>
               <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl font-bold text-admin-text-primary tracking-tight uppercase">{customer.name}</h1>
                    {customer.is_portal_active ? (
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-slate-400 opacity-40" />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-1.5">
                     <span className="text-[10px] font-bold text-admin-text-muted uppercase tracking-wider bg-admin-bg px-2 py-0.5 rounded border border-admin-border">
                        CODE: {customer.customer_code || 'GENERIC-IDENTITY'}
                     </span>
                     <div className="flex items-center gap-1.5 text-xs font-bold text-admin-text-secondary">
                        <Building2 size={14} className="text-zeronix-blue" /> {customer.company || 'Private Entity'}
                     </div>
                     {customer.is_portal_active ? (
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                           <ShieldCheck size={12} /> Portal Access Active
                        </div>
                     ) : (
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider bg-slate-500/5 px-2 py-0.5 rounded border border-slate-500/10">
                           Portal Inactive
                        </div>
                     )}
                  </div>
               </div>
            </div>
            <div className="flex gap-2">
               {!customer.is_portal_active ? (
                 <Button 
                   onClick={() => registerPortalMutation.mutate()} 
                   disabled={registerPortalMutation.isPending}
                   className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 font-bold text-[11px] uppercase tracking-wider shadow-lg shadow-emerald-600/10 gap-2"
                 >
                   {registerPortalMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                   Initialize Access
                 </Button>
               ) : (
                 <Button 
                   variant="outline" 
                   onClick={() => registerPortalMutation.mutate()} 
                   disabled={registerPortalMutation.isPending}
                   className="h-10 rounded-xl border-admin-border text-xs font-bold gap-2 shadow-sm"
                 >
                   <ArrowUpRight size={16} /> Resend Protocol
                 </Button>
               )}
            </div>
         </div>
      </div>

      {/* KPI Intelligence Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         <StatCard title="Enquiry Stream" value={customer.enquiries_count || 0} icon={<MessageSquare size={16} className="text-purple-500" />} iconBg="bg-purple-500/10" />
         <StatCard title="Issued Quotes" value={customer.quotes_count || 0} icon={<FileText size={16} className="text-amber-500" />} iconBg="bg-amber-500/10" />
         <StatCard title="Financial Ledger" value={customer.invoices_count || 0} icon={<Receipt size={16} className="text-zeronix-blue" />} iconBg="bg-zeronix-blue/10" />
         <StatCard title="Total Volume" value="1.2M AED" icon={<Wallet size={16} className="text-emerald-500" />} iconBg="bg-emerald-500/10" />
      </div>

      {/* Ecosystem Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-admin-surface border border-admin-border rounded-lg p-1 h-10 w-full max-w-lg shadow-sm">
          <TabsTrigger value="overview" className="flex-1 rounded-md text-[11px] font-semibold uppercase tracking-wider data-[state=active]:bg-zeronix-blue data-[state=active]:text-white">Profile</TabsTrigger>
          <TabsTrigger value="enquiries" className="flex-1 rounded-md text-[11px] font-semibold uppercase tracking-wider data-[state=active]:bg-zeronix-blue data-[state=active]:text-white">Enquiries</TabsTrigger>
          <TabsTrigger value="quotes" className="flex-1 rounded-md text-[11px] font-semibold uppercase tracking-wider data-[state=active]:bg-zeronix-blue data-[state=active]:text-white">Ledger</TabsTrigger>
          <TabsTrigger value="chat" className="flex-1 rounded-md text-[11px] font-semibold uppercase tracking-wider data-[state=active]:bg-zeronix-blue data-[state=active]:text-white">Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-admin-surface border border-admin-border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold text-admin-text-primary uppercase tracking-wider border-b border-admin-border pb-4">
                 <UserIcon size={16} className="text-zeronix-blue" /> Identity Specifications
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-admin-bg border border-admin-border group">
                   <div className="h-10 w-10 rounded-lg bg-zeronix-blue/10 flex items-center justify-center text-zeronix-blue group-hover:bg-zeronix-blue group-hover:text-white transition-all">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-admin-text-muted uppercase tracking-wider">Digital Mail</p>
                    <p className="text-sm font-bold text-admin-text-primary">{customer.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-admin-bg border border-admin-border group">
                   <div className="h-10 w-10 rounded-lg bg-zeronix-blue/10 flex items-center justify-center text-zeronix-blue group-hover:bg-zeronix-blue group-hover:text-white transition-all">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-admin-text-muted uppercase tracking-wider">Voice Link</p>
                    <p className="text-sm font-bold text-admin-text-primary">{customer.phone || 'NO SECURE LINE'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-admin-bg border border-admin-border group">
                   <div className="h-10 w-10 rounded-lg bg-zeronix-blue/10 flex items-center justify-center text-zeronix-blue group-hover:bg-zeronix-blue group-hover:text-white transition-all">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-admin-text-muted uppercase tracking-wider">Tax Registry (TRN)</p>
                    <p className="text-sm font-bold text-admin-text-primary font-mono">{customer.trn || 'NOT REGISTERED'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-admin-bg border border-admin-border group">
                   <div className="h-10 w-10 rounded-lg bg-zeronix-blue/10 flex items-center justify-center text-zeronix-blue group-hover:bg-zeronix-blue group-hover:text-white transition-all">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-admin-text-muted uppercase tracking-wider">Onboarding Date</p>
                    <p className="text-sm font-bold text-admin-text-primary">
                      {customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-admin-surface border border-admin-border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold text-admin-text-primary uppercase tracking-wider border-b border-admin-border pb-4">
                 <MapPin size={16} className="text-zeronix-blue" /> Dispatch Logistics
              </div>
              <div className="p-4 rounded-xl bg-admin-bg border border-admin-border min-h-[140px]">
                 <p className="text-[9px] font-bold text-admin-text-muted uppercase tracking-wider mb-1.5">Registered Address</p>
                 <p className="text-sm font-bold text-admin-text-primary leading-relaxed opacity-80">
                    {customer.address || "No logistics records found for this identity."}
                 </p>
              </div>
              <p className="text-[10px] text-admin-text-muted font-bold italic text-center opacity-40">
                 System Identity ID: {id}
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="enquiries" className="animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shadow-sm">
            {enquiries?.length > 0 ? (
              <DataTable columns={enquiryColumns} data={enquiries} searchColumn="status" searchPlaceholder="Search enquiry records..." onRowClick={() => navigate(`/admin/enquiries`)} />
            ) : (
              <div className="flex flex-col items-center justify-center p-20 text-center">
                <MessageSquare size={48} className="text-admin-text-muted/20 mb-4" />
                <h3 className="text-sm font-bold text-admin-text-primary uppercase tracking-wider">QUIET STREAM</h3>
                <p className="text-xs text-admin-text-muted mt-1">No enquiries have been initiated by this client.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="quotes" className="animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-admin-border bg-admin-bg/10 flex items-center gap-2 text-xs font-bold text-admin-text-primary uppercase tracking-wider">
                 <FileText size={16} className="text-amber-500" /> Quotation History
              </div>
              {quotes?.length > 0 ? (
                <DataTable columns={quoteColumns} data={quotes} onRowClick={(row) => navigate(`/admin/quotes/${row.id}`)} />
              ) : (
                <div className="p-12 text-center text-admin-text-muted opacity-40 italic text-xs font-bold">No quotation records detected.</div>
              )}
            </div>

            <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-admin-border bg-admin-bg/10 flex items-center gap-2 text-xs font-bold text-admin-text-primary uppercase tracking-wider">
                 <Receipt size={16} className="text-zeronix-blue" /> Commercial Invoices
              </div>
              {invoices?.length > 0 ? (
                <DataTable columns={invoiceColumns} data={invoices} onRowClick={(row) => navigate(`/admin/invoices/${row.id}`)} />
              ) : (
                <div className="p-12 text-center text-admin-text-muted opacity-40 italic text-xs font-bold">No invoice records detected.</div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="chat" className="animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-admin-surface border border-admin-border rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="h-16 w-16 bg-admin-bg rounded-full flex items-center justify-center mb-4 border border-admin-border">
               <MessageSquare size={32} className="text-admin-text-muted/20" />
            </div>
            <h3 className="text-sm font-bold text-admin-text-primary uppercase tracking-wider">COMMUNICATIONS HUB</h3>
            <p className="text-xs text-admin-text-muted max-w-xs mt-2 leading-relaxed">
               Direct encrypted messaging for this client profile is currently in development phase.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
