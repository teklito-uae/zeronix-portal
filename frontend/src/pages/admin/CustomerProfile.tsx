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
import { ArrowLeft, Mail, Phone, Building2, Calendar, FileText, MessageSquare, Receipt, Loader2, MapPin, ShieldCheck } from 'lucide-react';

export const CustomerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const res = await api.get(`/admin/customers/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  useBreadcrumb([
    { label: 'Customers', href: '/admin/customers' },
    { label: data?.customer?.name || 'Profile' },
  ]);

  const registerPortalMutation = useMutation({
    mutationFn: async () => api.post(`/admin/customers/${id}/register-portal`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      toast.success('Customer registered and welcome email sent');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error registering customer'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-zeronix-blue" size={40} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-admin-text-muted">Customer not found.</p>
      </div>
    );
  }

  const { customer, enquiries, quotes, invoices } = data;

  const enquiryColumns: ColumnDef<Enquiry>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-zeronix-blue">ENQ-{String(row.original.id).padStart(3, '0')}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => <StatusBadge status={row.original.priority} />,
    },
    {
      accessorKey: 'items_count',
      header: 'Items',
      cell: ({ row }) => <span className="text-admin-text-secondary">{row.original.items?.length || 0}</span>,
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-admin-text-muted text-xs">
          {row.original.created_at ? timeAgo(row.original.created_at) : '—'}
        </span>
      ),
    },
  ];

  const quoteColumns: ColumnDef<Quote>[] = [
    {
      accessorKey: 'quote_number',
      header: 'Quote #',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-zeronix-blue font-medium">{row.original.quote_number || `QT-${String(row.original.id).padStart(4, '0')}`}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'total',
      header: 'Total Amount',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium text-admin-text-primary">
          {(row.original.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} AED
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-admin-text-muted text-xs">
          {row.original.created_at ? timeAgo(row.original.created_at) : '—'}
        </span>
      ),
    },
  ];

  const invoiceColumns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'invoice_number',
      header: 'Invoice #',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-zeronix-blue font-medium">{row.original.invoice_number || `INV-${String(row.original.id).padStart(4, '0')}`}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'total',
      header: 'Total Amount',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium text-admin-text-primary">
          {(row.original.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} AED
        </span>
      ),
    },
    {
      accessorKey: 'due_date',
      header: 'Due Date',
      cell: ({ row }) => (
        <span className={`text-xs ${row.original.status === 'overdue' ? 'text-danger font-medium' : 'text-admin-text-muted'}`}>
          {row.original.due_date ? new Date(row.original.due_date).toLocaleDateString() : '—'}
        </span>
      ),
    },
  ];


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/customers')}
            className="text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-surface-hover"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-admin-text-primary flex items-center gap-3">
              {customer.name}
              {customer.customer_code && (
                <span className="text-xs font-mono font-medium px-2 py-1 bg-zeronix-blue/10 text-zeronix-blue rounded">
                  {customer.customer_code}
                </span>
              )}
              {customer.is_portal_active ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-wider">
                  Portal Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-500 border border-slate-500/20 uppercase tracking-wider">
                  Portal Disabled
                </span>
              )}
            </h1>
            {customer.company && (
              <p className="text-sm text-admin-text-secondary flex items-center gap-1 mt-0.5">
                <Building2 size={14} /> {customer.company}
              </p>
            )}
          </div>
        </div>
        
        {!customer.is_portal_active && (
          <Button 
            onClick={() => registerPortalMutation.mutate()} 
            disabled={registerPortalMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            {registerPortalMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            Register Portal Access
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard title="Total Enquiries" value={customer.enquiries_count || 0} icon={<MessageSquare size={20} />} />
        <StatCard title="Total Quotes" value={customer.quotes_count || 0} icon={<FileText size={20} />} />
        <StatCard title="Total Invoiced" value={customer.invoices_count || 0} icon={<Receipt size={20} />} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-admin-surface border border-admin-border">
          <TabsTrigger value="overview" className="data-[state=active]:bg-zeronix-blue data-[state=active]:text-white text-admin-text-secondary">
            Overview
          </TabsTrigger>
          <TabsTrigger value="enquiries" className="data-[state=active]:bg-zeronix-blue data-[state=active]:text-white text-admin-text-secondary">
            Enquiries
          </TabsTrigger>
          <TabsTrigger value="quotes" className="data-[state=active]:bg-zeronix-blue data-[state=active]:text-white text-admin-text-secondary">
            Quotes & Invoices
          </TabsTrigger>
          <TabsTrigger value="chat" className="data-[state=active]:bg-zeronix-blue data-[state=active]:text-white text-admin-text-secondary">
            Chat History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-admin-surface border border-admin-border rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-admin-text-primary">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-admin-bg">
                  <div className="p-2 rounded-lg bg-zeronix-blue/10">
                    <Mail size={18} className="text-zeronix-blue" />
                  </div>
                  <div>
                    <p className="text-xs text-admin-text-muted uppercase font-medium">Email</p>
                    <p className="text-sm text-admin-text-primary">{customer.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-admin-bg">
                  <div className="p-2 rounded-lg bg-zeronix-blue/10">
                    <Phone size={18} className="text-zeronix-blue" />
                  </div>
                  <div>
                    <p className="text-xs text-admin-text-muted uppercase font-medium">Phone</p>
                    <p className="text-sm text-admin-text-primary">{customer.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-admin-bg">
                  <div className="p-2 rounded-lg bg-zeronix-blue/10">
                    <Building2 size={18} className="text-zeronix-blue" />
                  </div>
                  <div>
                    <p className="text-xs text-admin-text-muted uppercase font-medium">Company</p>
                    <p className="text-sm text-admin-text-primary">{customer.company || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-admin-bg">
                  <div className="p-2 rounded-lg bg-zeronix-blue/10">
                    <MapPin size={18} className="text-zeronix-blue" />
                  </div>
                  <div>
                    <p className="text-xs text-admin-text-muted uppercase font-medium">Address</p>
                    <p className="text-sm text-admin-text-primary truncate" title={customer.address}>{customer.address || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-admin-bg">
                  <div className="p-2 rounded-lg bg-zeronix-blue/10">
                    <FileText size={18} className="text-zeronix-blue" />
                  </div>
                  <div>
                    <p className="text-xs text-admin-text-muted uppercase font-medium">TRN / VAT</p>
                    <p className="text-sm text-admin-text-primary font-mono">{customer.trn || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-admin-bg">
                  <div className="p-2 rounded-lg bg-zeronix-blue/10">
                    <Calendar size={18} className="text-zeronix-blue" />
                  </div>
                  <div>
                    <p className="text-xs text-admin-text-muted uppercase font-medium">Member Since</p>
                    <p className="text-sm text-admin-text-primary">
                      {customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-admin-surface border border-admin-border rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-admin-text-primary flex items-center gap-2">
                <ShieldCheck size={20} className="text-zeronix-blue" />
                Portal Status
              </h3>
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${customer.is_portal_active ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-500/5 border-slate-500/20'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-admin-text-muted">Access Status</span>
                    {customer.is_portal_active ? (
                      <span className="text-[10px] font-bold text-emerald-500 px-2 py-0.5 bg-emerald-500/10 rounded">ENABLED</span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 px-2 py-0.5 bg-slate-500/10 rounded">DISABLED</span>
                    )}
                  </div>
                  <p className="text-sm text-admin-text-secondary leading-tight">
                    {customer.is_portal_active 
                      ? "This customer has active access to the Zeronix Portal. They can view their documents and browse products." 
                      : "Portal access is currently disabled for this customer. They cannot login to view documents."}
                  </p>
                </div>

                {!customer.is_portal_active ? (
                  <div className="space-y-3">
                    <p className="text-xs text-admin-text-muted italic">
                      Generate credentials and send a welcome email to enable portal access for this customer.
                    </p>
                    <Button 
                      className="w-full bg-zeronix-blue hover:bg-zeronix-blue-hover text-white"
                      onClick={() => registerPortalMutation.mutate()}
                      disabled={registerPortalMutation.isPending}
                    >
                      {registerPortalMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : "Register & Send Welcome Email"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full border-admin-border text-admin-text-secondary hover:bg-admin-surface-hover"
                      onClick={() => registerPortalMutation.mutate()}
                      disabled={registerPortalMutation.isPending}
                    >
                      {registerPortalMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : "Resend Welcome Email"}
                    </Button>
                    <p className="text-[10px] text-admin-text-muted text-center">
                      This will reset their password and send a new email.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="enquiries">
          {enquiries?.length > 0 ? (
            <DataTable columns={enquiryColumns} data={enquiries} searchColumn="status" searchPlaceholder="Search enquiries..." onRowClick={() => navigate(`/admin/enquiries`)} />
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-admin-border rounded-xl bg-admin-surface">
              <MessageSquare size={40} className="text-admin-text-muted mb-3" />
              <h3 className="text-lg font-semibold text-admin-text-primary mb-1">No Enquiries Yet</h3>
              <p className="text-admin-text-secondary">This customer hasn't submitted any enquiries.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="quotes">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-admin-text-primary">Recent Quotes</h3>
              {quotes?.length > 0 ? (
                <DataTable columns={quoteColumns} data={quotes} onRowClick={(row) => navigate(`/admin/quotes/${row.id}`)} />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-admin-border rounded-xl bg-admin-surface">
                  <FileText size={32} className="text-admin-text-muted mb-2" />
                  <p className="text-sm text-admin-text-secondary">No quotes found for this customer.</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-admin-text-primary">Recent Invoices</h3>
              {invoices?.length > 0 ? (
                <DataTable columns={invoiceColumns} data={invoices} onRowClick={(row) => navigate(`/admin/invoices/${row.id}`)} />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-admin-border rounded-xl bg-admin-surface">
                  <Receipt size={32} className="text-admin-text-muted mb-2" />
                  <p className="text-sm text-admin-text-secondary">No invoices found for this customer.</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="chat">
          <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-admin-border rounded-xl bg-admin-surface">
            <MessageSquare size={40} className="text-admin-text-muted mb-3" />
            <h3 className="text-lg font-semibold text-admin-text-primary mb-1">Chat Coming Soon</h3>
            <p className="text-admin-text-secondary">Chat history will be available in the future.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
