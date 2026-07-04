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
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useResourceMutation } from '@/hooks/useApi';
import Avatar from 'boring-avatars';
import { useThemeStore } from '@/store/useThemeStore';

import type { ColumnDef } from '@tanstack/react-table';
import type { Enquiry, Quote, Invoice } from '@/types';
import { Mail, Phone, Building2, Calendar, FileText, MessageSquare, Receipt, Loader2, MapPin, ShieldCheck, Wallet, ArrowUpRight, Edit, User as UserIcon } from 'lucide-react';


export const CustomerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme } = useThemeStore();
  const avatarColors = theme === 'dark' 
    ? ['#ff4d6d', '#ff758f', '#ffbe0b', '#fdfcdc', '#48cae4']
    : ['#cc063e', '#e83535', '#fd9407', '#e2d9c2', '#10898b'];


  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ 
    name: '', company: '', email: '', phone: '', address: '', trn: '', is_portal_active: true 
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => (await api.get(`/admin/customers/${id}`)).data,
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
    mutationFn: async () => api.post(`/admin/customers/${id}/register-portal`),
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
    <div className="bg-brand-white border border-brand-border/50 rounded-xl shadow-sm flex flex-col min-h-[calc(100vh-140px)] m-5 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Premium Identity Header */}
      <div className="bg-brand-white border-b border-brand-border/50 p-6 sm:p-8 relative">
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
               <Avatar
                 size={64}
                 name={customer.name || 'User'}
                 variant="marble"
                 colors={avatarColors}
               />
               <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl font-bold text-brand-primary tracking-tight uppercase">{customer.name}</h1>
                    {customer.is_portal_active && (
                      <span className="h-2 w-2 rounded-full bg-brand-success shadow-[0_0_8px_var(--color-brand-success)] animate-pulse" />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                     <span className="text-[10px] font-bold text-brand-subtle uppercase tracking-wider bg-brand-surface px-2 py-0.5 rounded border border-brand-border/50">
                        CODE: {customer.customer_code || 'GENERIC-IDENTITY'}
                     </span>
                     <div className="flex items-center gap-1.5 text-[12px] font-semibold text-brand-secondary">
                        <Building2 size={14} className="text-brand-accent" /> {customer.company || 'Private Entity'}
                     </div>
                  </div>
               </div>
            </div>
            <div className="flex gap-3">
               <Button 
                 variant="outline" 
                 onClick={() => setEditOpen(true)}
                 className="h-[36px] rounded-lg border-brand-border text-[12px] font-medium gap-2 shadow-sm px-4 text-brand-secondary hover:text-brand-primary"
               >
                 <Edit size={14} /> Edit Profile
               </Button>
               {!customer.is_portal_active ? (
                 <Button 
                   onClick={() => registerPortalMutation.mutate()} 
                   disabled={registerPortalMutation.isPending}
                   className="h-[36px] rounded-lg bg-brand-success hover:bg-brand-success/90 text-white px-5 font-medium text-[12px] shadow-sm gap-2"
                 >
                   {registerPortalMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                   Initialize Access
                 </Button>
               ) : (
                 <Button 
                   variant="outline" 
                   onClick={() => registerPortalMutation.mutate()} 
                   disabled={registerPortalMutation.isPending}
                   className="h-[36px] rounded-lg border-brand-border text-[12px] font-medium gap-2 shadow-sm text-brand-secondary hover:text-brand-primary"
                 >
                   <ArrowUpRight size={14} /> Resend Access
                 </Button>
               )}
            </div>
         </div>
      </div>

      <div className="px-6 py-6 border-b border-brand-border/50">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
           <StatCard title="Enquiry Stream" value={customer.enquiries_count || 0} icon={<MessageSquare size={16} className="text-brand-info" />} iconBg="bg-brand-info-bg" />
           <StatCard title="Issued Quotes" value={customer.quotes_count || 0} icon={<FileText size={16} className="text-brand-warning" />} iconBg="bg-brand-warning-bg" />
           <StatCard title="Financial Ledger" value={customer.invoices_count || 0} icon={<Receipt size={16} className="text-brand-accent" />} iconBg="bg-brand-accent-light dark:bg-brand-accent/20" />
           <StatCard title="Total Volume" value={`${(customer.total_volume || 0).toLocaleString()} AED`} icon={<Wallet size={16} className="text-brand-success" />} iconBg="bg-brand-success-bg" />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <TabsList className="w-full justify-start bg-brand-white border-b border-brand-border/50 rounded-none px-6 h-12 flex gap-8 overflow-x-auto no-scrollbar flex-shrink-0">
            <TabsTrigger value="overview" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-brand-accent data-[state=active]:bg-transparent data-[state=active]:text-brand-primary data-[state=active]:shadow-none text-brand-subtle hover:text-brand-primary px-1 font-semibold text-[13px] flex items-center gap-2 transition-colors">
              <UserIcon size={16} className="text-brand-info" /> Profile Overview
            </TabsTrigger>
            <TabsTrigger value="enquiries" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-brand-accent data-[state=active]:bg-transparent data-[state=active]:text-brand-primary data-[state=active]:shadow-none text-brand-subtle hover:text-brand-primary px-1 font-semibold text-[13px] flex items-center gap-2 transition-colors">
              <MessageSquare size={16} className="text-brand-accent" /> Enquiries
            </TabsTrigger>
            <TabsTrigger value="quotes" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-brand-accent data-[state=active]:bg-transparent data-[state=active]:text-brand-primary data-[state=active]:shadow-none text-brand-subtle hover:text-brand-primary px-1 font-semibold text-[13px] flex items-center gap-2 transition-colors">
              <Receipt size={16} className="text-brand-success" /> Financial Ledger
            </TabsTrigger>
            <TabsTrigger value="chat" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-brand-accent data-[state=active]:bg-transparent data-[state=active]:text-brand-primary data-[state=active]:shadow-none text-brand-subtle hover:text-brand-primary px-1 font-semibold text-[13px] flex items-center gap-2 transition-colors">
              <MessageSquare size={16} className="text-brand-warning" /> Client Chat
            </TabsTrigger>
          </TabsList>

        <TabsContent value="overview" className="p-6 m-0 border-none outline-none flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-brand-white border border-brand-border/50 rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-2 text-[14px] font-semibold text-brand-primary border-b border-brand-border/50 pb-4">
                 <UserIcon size={16} className="text-brand-info" /> Identity Specifications
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-brand-surface border border-brand-border/50">
                   <div className="h-10 w-10 rounded-lg bg-brand-info-bg flex items-center justify-center text-brand-info">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-brand-subtle uppercase tracking-wider">Digital Mail</p>
                    <p className="text-[13px] font-semibold text-brand-primary">{customer.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-brand-surface border border-brand-border/50">
                   <div className="h-10 w-10 rounded-lg bg-brand-accent-light dark:bg-brand-accent/20 flex items-center justify-center text-brand-accent">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-brand-subtle uppercase tracking-wider">Voice Link</p>
                    <p className="text-[13px] font-semibold text-brand-primary">{customer.phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-brand-surface border border-brand-border/50">
                   <div className="h-10 w-10 rounded-lg bg-brand-warning-bg flex items-center justify-center text-brand-warning">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-brand-subtle uppercase tracking-wider">Tax Registry (TRN)</p>
                    <p className="text-[13px] font-semibold text-brand-primary font-mono">{customer.trn || 'NOT REGISTERED'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-brand-surface border border-brand-border/50">
                   <div className="h-10 w-10 rounded-lg bg-brand-success-bg flex items-center justify-center text-brand-success">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-brand-subtle uppercase tracking-wider">Onboarding Date</p>
                    <p className="text-[13px] font-semibold text-brand-primary">
                      {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-brand-white border border-brand-border/50 rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-2 text-[14px] font-semibold text-brand-primary border-b border-brand-border/50 pb-4">
                 <MapPin size={16} className="text-brand-info" /> Dispatch Logistics
              </div>
              <div className="p-4 rounded-xl bg-brand-surface border border-brand-border/50 min-h-[140px]">
                 <p className="text-[11px] font-medium text-brand-subtle uppercase tracking-wider mb-1.5">Registered Address</p>
                 <p className="text-[13px] font-medium text-brand-secondary leading-relaxed">
                    {customer.address || "No logistics records found."}
                 </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="enquiries" className="p-6 m-0 border-none outline-none flex-1 overflow-auto">
          <div className="bg-brand-white border border-brand-border/50 rounded-xl overflow-hidden shadow-sm">
            <DataTable columns={enquiryColumns} data={enquiries || []} onRowClick={() => navigate(`${getBasePath()}/enquiries`)} />
          </div>
        </TabsContent>

        <TabsContent value="quotes" className="p-6 m-0 border-none outline-none flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-brand-white border border-brand-border/50 rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-brand-border/50 bg-brand-surface flex items-center gap-2 text-[13px] font-semibold text-brand-primary">
                 <FileText size={16} className="text-brand-warning" /> Quotation History
              </div>
              <DataTable columns={quoteColumns} data={quotes || []} onRowClick={(row) => navigate(`${getBasePath()}/quotes/${row.id}`)} />
            </div>
            <div className="bg-brand-white border border-brand-border/50 rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-brand-border/50 bg-brand-surface flex items-center gap-2 text-[13px] font-semibold text-brand-primary">
                 <Receipt size={16} className="text-brand-success" /> Commercial Invoices
              </div>
              <DataTable columns={invoiceColumns} data={invoices || []} onRowClick={(row) => navigate(`${getBasePath()}/invoices/${row.id}`)} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="chat" className="p-6 m-0 border-none outline-none flex-1 overflow-auto">
          <div className="bg-brand-white border border-brand-border/50 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
            <MessageSquare size={48} className="text-brand-border mb-4" />
            <h3 className="text-[14px] font-semibold text-brand-primary">Communications Hub</h3>
            <p className="text-[13px] text-brand-subtle max-w-xs mt-1">Messaging is currently in development.</p>
          </div>
        </TabsContent>
      </Tabs>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-brand-white border-brand-border/50 sm:max-w-xl rounded-xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold text-brand-primary">Refine Client Identity</DialogTitle>
            <DialogDescription className="text-[13px] text-brand-subtle mt-1">Update primary contact and logistical data.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Full Name</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-[36px] bg-brand-surface border-brand-border/50 rounded-lg text-[13px]" />
            </div>
            <div className="space-y-2">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Company</Label>
              <Input value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="h-[36px] bg-brand-surface border-brand-border/50 rounded-lg text-[13px]" />
            </div>
            <div className="space-y-2">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Email</Label>
              <Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="h-[36px] bg-brand-surface border-brand-border/50 rounded-lg text-[13px]" />
            </div>
            <div className="space-y-2">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Phone</Label>
              <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="h-[36px] bg-brand-surface border-brand-border/50 rounded-lg text-[13px]" />
            </div>
            <div className="space-y-2">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">TRN</Label>
              <Input value={form.trn} onChange={e => setForm({...form, trn: e.target.value})} className="h-[36px] bg-brand-surface border-brand-border/50 rounded-lg text-[13px] font-mono" />
            </div>
            <div className="space-y-2">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Portal Access</Label>
              <div className="flex items-center gap-3 h-[36px] px-3 bg-brand-surface border border-brand-border/50 rounded-lg">
                <Switch checked={form.is_portal_active} onCheckedChange={v => setForm({...form, is_portal_active: v})} />
                <span className="text-[12px] font-medium text-brand-primary">{form.is_portal_active ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Dispatch Address</Label>
              <Textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="bg-brand-surface border-brand-border/50 rounded-lg min-h-[100px] text-[13px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)} className="text-[13px] font-medium">Cancel</Button>
            <Button onClick={handleUpdate} disabled={update.isPending} className="bg-brand-primary text-brand-white hover:opacity-90 rounded-lg text-[13px] font-medium px-6">
              {update.isPending ? <Loader2 className="animate-spin mr-2" size={14} /> : null} Sync Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
