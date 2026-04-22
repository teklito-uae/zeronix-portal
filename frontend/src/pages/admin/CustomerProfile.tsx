import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/shared/StatCard';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { mockCustomers, mockEnquiries } from '@/lib/mockData';
import type { ColumnDef } from '@tanstack/react-table';
import type { Enquiry } from '@/types';
import { ArrowLeft, Mail, Phone, Building2, Calendar, FileText, MessageSquare, Receipt } from 'lucide-react';

export const CustomerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const customer = mockCustomers.find((c) => c.id === Number(id));

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-admin-text-muted">Customer not found.</p>
      </div>
    );
  }

  const customerEnquiries = mockEnquiries.filter((e) => e.customer_id === customer.id);

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
      cell: ({ row }) => <span className="text-admin-text-secondary">{row.original.items_count}</span>,
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-admin-text-muted text-xs">
          {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <h1 className="text-2xl font-bold text-admin-text-primary">{customer.name}</h1>
          {customer.company && (
            <p className="text-sm text-admin-text-secondary flex items-center gap-1 mt-0.5">
              <Building2 size={14} /> {customer.company}
            </p>
          )}
        </div>
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
          <div className="bg-admin-surface border border-admin-border rounded-xl p-6 space-y-4">
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
        </TabsContent>

        <TabsContent value="enquiries">
          <DataTable columns={enquiryColumns} data={customerEnquiries} searchColumn="status" searchPlaceholder="Search enquiries..." />
        </TabsContent>

        <TabsContent value="quotes">
          <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-admin-border rounded-xl bg-admin-surface">
            <FileText size={40} className="text-admin-text-muted mb-3" />
            <h3 className="text-lg font-semibold text-admin-text-primary mb-1">No Quotes Yet</h3>
            <p className="text-admin-text-secondary">Quotes and invoices will appear here once created.</p>
          </div>
        </TabsContent>

        <TabsContent value="chat">
          <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-admin-border rounded-xl bg-admin-surface">
            <MessageSquare size={40} className="text-admin-text-muted mb-3" />
            <h3 className="text-lg font-semibold text-admin-text-primary mb-1">Chat Coming Soon</h3>
            <p className="text-admin-text-secondary">Chat history will be available in Phase 5.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
