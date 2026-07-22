import { getBasePath } from '@/hooks/useBasePath';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Quote, User } from '@/types';
import { FileText, Building2, CheckCircle2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { ResourceListingPage } from '@/components/shared/ResourceListingPage';
import { ActionGroup } from '@/components/shared/ActionGroup';

/**
 * Quotations Module
 * Refactored to use the standardized State-Driven architecture.
 */
export const Quotes = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');

  const { data: usersList = [] } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () => (await api.get(`/admin/users?per_page=100`)).data.data as User[],
  });

  const quoteTabs = [
    { id: 'all', label: 'All Quotes' },
    { id: 'draft', label: 'Drafts' },
    { id: 'sent', label: 'Sent' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'declined', label: 'Declined' },
  ];

  // Custom mutation for email sending (specific to quotes)
  const sendEmailMutation = useMutation({
    mutationFn: async (id: number) => (await api.post(`/admin/quotes/${id}/send-email`)).data,
    onSuccess: () => { 
      toast.success('Quote email sent'); 
      queryClient.invalidateQueries({ queryKey: ['quotes'] }); 
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to send email'),
  });

  const columns: ColumnDef<Quote>[] = [
    {
      accessorKey: 'quote_number',
      header: 'Quote #',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-[13px] font-semibold text-brand-accent">{row.original.quote_number}</span>
          {row.original.email_sent_at && (
            <p className="text-[11px] text-brand-success flex items-center gap-1 mt-0.5 font-medium uppercase tracking-wider">
              <CheckCircle2 size={12} /> Sent
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <p className="text-[13px] font-semibold text-brand-primary truncate">{row.original.customer?.name || '—'}</p>
          {row.original.customer?.company && (
            <p className="text-[12px] text-brand-subtle flex items-center gap-1.5 truncate mt-0.5">
              <Building2 size={12} /> {row.original.customer.company}
            </p>
          )}
        </div>
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
        <div className="text-right">
          <p className="font-mono text-[13px] font-semibold text-brand-primary">
            {Number(row.original.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[11px] text-brand-muted">AED</span>
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Issue Date',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-[12px] text-brand-secondary">
          <Calendar size={14} className="text-brand-subtle" />
          {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString() : '—'}
        </div>
      ),
    },
    {
      accessorKey: 'valid_until',
      header: 'Expiry',
      cell: ({ row }) => (
        <div className="text-[12px] font-medium text-brand-secondary bg-brand-surface px-2.5 py-0.5 rounded-md inline-block">
          {row.original.valid_until ? new Date(row.original.valid_until).toLocaleDateString() : '—'}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <ActionGroup
          onMail={() => sendEmailMutation.mutate(row.original.id)}
          isMailPending={sendEmailMutation.isPending && sendEmailMutation.variables === row.original.id}
          isMailSent={!!row.original.email_sent_at}
          onDownload={() => window.open(`${api.defaults.baseURL}/admin/quotes/${row.original.id}/download`, '_blank')}
          onView={() => navigate(`${getBasePath()}/quotes/${row.original.id}`)}
          onEdit={() => navigate(`${getBasePath()}/quotes/${row.original.id}`)}
        />
      ),
    },
  ];

  return (
    <ResourceListingPage<Quote>
      resource="quotes"
      title="Quotations"
      icon={<FileText size={20} />}
      columns={columns}
      onRowClick={(row) => navigate(`${getBasePath()}/quotes/${row.id}`)}
      createLabel="New Quote"
      createPath={`${getBasePath()}/quotes/create`}
      searchPlaceholder="Search by quote # or customer name..."
      tabs={quoteTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      baseFilters={{ status: activeTab !== 'all' ? activeTab : undefined }}
      filters={[
        {
          name: 'user_id',
          label: 'Sales Rep',
          placeholder: 'Filter by sales rep',
          options: usersList.map((u) => ({ label: u.name, value: String(u.id) })),
        },
      ]}
    />
  );
};
