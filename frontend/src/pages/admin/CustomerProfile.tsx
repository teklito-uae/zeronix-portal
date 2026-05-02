import { getBasePath } from '@/hooks/useBasePath';
import { useParams, useNavigate } from 'react-router-dom';
import { useBreadcrumb } from '@/hooks/useBreadcrumb';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/shared/StatCard';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { timeAgo } from '@/lib/utils';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useResourceMutation } from '@/hooks/useApi';

import type { ColumnDef } from '@tanstack/react-table';
import type { Enquiry, Quote, Invoice } from '@/types';
import { Mail, Phone, Building2, Calendar, FileText, MessageSquare, Receipt, Loader2, MapPin, ShieldCheck, User as UserIcon, Wallet, ArrowUpRight, Edit } from 'lucide-react';


export const CustomerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();


  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ 
    name: '', company: '', email: '', phone: '', address: '', trn: '', is_portal_active: true 
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => (await api.get(`${getBasePath()}/customers/${id}`)).data,
    enabled: !!id,
  });

  useEffect(() => {
    if (data?.customer) {
      const c = data.customer;
      setForm({
        name: c.name,
        company: c.company || '',
        email: c.email,
        phone: c.phone || '',
        address: c.address || '',
        trn: c.trn || '',
        is_portal_active: c.is_portal_active ?? true
      });
    }
  }, [data]);

  useBreadcrumb([
    { label: 'Client Registry', href: `${getBasePath()}/customers` },
    { label: data?.customer?.name || 'Identity Profile' },
  ]);

  const { update } = useResourceMutation('customers');

  const handleUpdate = async () => {
    await update.mutateAsync({ id: Number(id), data: form });
    queryClient.invalidateQueries({ queryKey: ['customer', id] });
    setEditOpen(false);
    toast.success('Profile updated successfully');
  };

  const registerPortalMutation = useMutation({
    mutationFn: async () => api.post(`${getBasePath()}/customers/${id}/register-portal`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      toast.success('Client registered for portal access.');
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

  if (error || !data) return null;

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
                    {customer.is_portal_active && (
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-1.5">
                     <span className="text-[10px] font-bold text-admin-text-muted uppercase tracking-wider bg-admin-bg px-2 py-0.5 rounded border border-admin-border">
                        CODE: {customer.customer_code || 'GENERIC-IDENTITY'}
                     </span>
                     <div className="flex items-center gap-1.5 text-xs font-bold text-admin-text-secondary">
                        <Building2 size={14} className="text-zeronix-blue" /> {customer.company || 'Private Entity'}
                     </div>
                  </div>
               </div>
            </div>
            <div className="flex gap-2">
               <Button 
                 variant="outline" 
                 onClick={() => setEditOpen(true)}
                 className="h-10 rounded-xl border-admin-border text-xs font-bold gap-2 shadow-sm px-5"
               >
                 <Edit size={16} /> Edit Profile
               </Button>
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
                   <ArrowUpRight size={16} /> Resend Access
                 </Button>
               )}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         <StatCard title="Enquiry Stream" value={customer.enquiries_count || 0} icon={<MessageSquare size={16} className="text-purple-500" />} iconBg="bg-purple-500/10" />
         <StatCard title="Issued Quotes" value={customer.quotes_count || 0} icon={<FileText size={16} className="text-amber-500" />} iconBg="bg-amber-500/10" />
         <StatCard title="Financial Ledger" value={customer.invoices_count || 0} icon={<Receipt size={16} className="text-zeronix-blue" />} iconBg="bg-zeronix-blue/10" />
         <StatCard title="Total Volume" value={`${(customer.total_volume || 0).toLocaleString()} AED`} icon={<Wallet size={16} className="text-emerald-500" />} iconBg="bg-emerald-500/10" />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-admin-surface border border-admin-border rounded-lg p-1 h-10 w-full max-w-lg shadow-sm">
          <TabsTrigger value="overview" className="flex-1 rounded-md text-[11px] font-semibold uppercase tracking-wider data-[state=active]:bg-zeronix-blue data-[state=active]:text-white">Profile</TabsTrigger>
          <TabsTrigger value="enquiries" className="flex-1 rounded-md text-[11px] font-semibold uppercase tracking-wider data-[state=active]:bg-zeronix-blue data-[state=active]:text-white">Enquiries</TabsTrigger>
          <TabsTrigger value="quotes" className="flex-1 rounded-md text-[11px] font-semibold uppercase tracking-wider data-[state=active]:bg-zeronix-blue data-[state=active]:text-white">Ledger</TabsTrigger>
          <TabsTrigger value="chat" className="flex-1 rounded-md text-[11px] font-semibold uppercase tracking-wider data-[state=active]:bg-zeronix-blue data-[state=active]:text-white">Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-admin-surface border border-admin-border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold text-admin-text-primary uppercase tracking-wider border-b border-admin-border pb-4">
                 <UserIcon size={16} className="text-zeronix-blue" /> Identity Specifications
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-admin-bg border border-admin-border">
                   <div className="h-10 w-10 rounded-lg bg-zeronix-blue/10 flex items-center justify-center text-zeronix-blue">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-admin-text-muted uppercase tracking-wider">Digital Mail</p>
                    <p className="text-sm font-bold text-admin-text-primary">{customer.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-admin-bg border border-admin-border">
                   <div className="h-10 w-10 rounded-lg bg-zeronix-blue/10 flex items-center justify-center text-zeronix-blue">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-admin-text-muted uppercase tracking-wider">Voice Link</p>
                    <p className="text-sm font-bold text-admin-text-primary">{customer.phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-admin-bg border border-admin-border">
                   <div className="h-10 w-10 rounded-lg bg-zeronix-blue/10 flex items-center justify-center text-zeronix-blue">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-admin-text-muted uppercase tracking-wider">Tax Registry (TRN)</p>
                    <p className="text-sm font-bold text-admin-text-primary font-mono">{customer.trn || 'NOT REGISTERED'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-admin-bg border border-admin-border">
                   <div className="h-10 w-10 rounded-lg bg-zeronix-blue/10 flex items-center justify-center text-zeronix-blue">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-admin-text-muted uppercase tracking-wider">Onboarding Date</p>
                    <p className="text-sm font-bold text-admin-text-primary">
                      {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '—'}
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
                    {customer.address || "No logistics records found."}
                 </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="enquiries">
          <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shadow-sm">
            <DataTable columns={enquiryColumns} data={enquiries || []} onRowClick={() => navigate(`${getBasePath()}/enquiries`)} />
          </div>
        </TabsContent>

        <TabsContent value="quotes">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-admin-border bg-admin-bg/10 flex items-center gap-2 text-xs font-bold text-admin-text-primary uppercase tracking-wider">
                 <FileText size={16} className="text-amber-500" /> Quotation History
              </div>
              <DataTable columns={quoteColumns} data={quotes || []} onRowClick={(row) => navigate(`${getBasePath()}/quotes/${row.id}`)} />
            </div>
            <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-admin-border bg-admin-bg/10 flex items-center gap-2 text-xs font-bold text-admin-text-primary uppercase tracking-wider">
                 <Receipt size={16} className="text-zeronix-blue" /> Commercial Invoices
              </div>
              <DataTable columns={invoiceColumns} data={invoices || []} onRowClick={(row) => navigate(`${getBasePath()}/invoices/${row.id}`)} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="chat">
          <div className="bg-admin-surface border border-admin-border rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
            <MessageSquare size={48} className="text-admin-text-muted/20 mb-4" />
            <h3 className="text-sm font-bold text-admin-text-primary uppercase tracking-wider">COMMUNICATIONS HUB</h3>
            <p className="text-xs text-admin-text-muted max-w-xs mt-2">Messaging is currently in development.</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-admin-surface border-admin-border sm:max-w-xl rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-admin-text-primary uppercase">Refine Client Identity</DialogTitle>
            <DialogDescription className="text-xs font-bold text-admin-text-muted uppercase tracking-widest mt-1">Update primary contact and logistical data.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-admin-text-muted ml-1">Full Name</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-11 bg-admin-bg border-admin-border rounded-xl font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-admin-text-muted ml-1">Company</Label>
              <Input value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="h-11 bg-admin-bg border-admin-border rounded-xl font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-admin-text-muted ml-1">Email</Label>
              <Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="h-11 bg-admin-bg border-admin-border rounded-xl font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-admin-text-muted ml-1">Phone</Label>
              <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="h-11 bg-admin-bg border-admin-border rounded-xl font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-admin-text-muted ml-1">TRN</Label>
              <Input value={form.trn} onChange={e => setForm({...form, trn: e.target.value})} className="h-11 bg-admin-bg border-admin-border rounded-xl font-bold font-mono" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-admin-text-muted ml-1">Portal Access</Label>
              <div className="flex items-center gap-3 h-11 px-3 bg-admin-bg border border-admin-border rounded-xl">
                <Switch checked={form.is_portal_active} onCheckedChange={v => setForm({...form, is_portal_active: v})} />
                <span className="text-[10px] font-black text-admin-text-primary uppercase tracking-widest">{form.is_portal_active ? 'ENABLED' : 'DISABLED'}</span>
              </div>
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-admin-text-muted ml-1">Dispatch Address</Label>
              <Textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="bg-admin-bg border-admin-border rounded-xl min-h-[100px] font-bold" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)} className="font-bold">CANCEL</Button>
            <Button onClick={handleUpdate} disabled={update.isPending} className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover rounded-xl font-black px-8">
              {update.isPending ? <Loader2 className="animate-spin" /> : 'SYNC CHANGES'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
