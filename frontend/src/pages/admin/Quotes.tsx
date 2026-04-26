import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Quote } from '@/types';
import { FileText, Building2, CheckCircle2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { ResourceListingPage } from '@/components/shared/ResourceListingPage';
import { ActionGroup } from '@/components/shared/ActionGroup';

/**
 * Quotations Module
 * Refactored to use the standardized State-Driven architecture.
 */
export const Quotes = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
          <span className="font-mono text-sm font-bold text-zeronix-blue">{row.original.quote_number}</span>
          {row.original.email_sent_at && (
            <p className="text-[10px] text-green-500 flex items-center gap-0.5 mt-0.5 font-medium uppercase tracking-tighter">
              <CheckCircle2 size={10} /> SENT
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
          <p className="text-sm font-bold text-admin-text-primary truncate">{row.original.customer?.name || '—'}</p>
          {row.original.customer?.company && (
            <p className="text-[11px] text-admin-text-muted flex items-center gap-1 truncate font-medium">
              <Building2 size={10} /> {row.original.customer.company}
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
          <p className="font-mono text-sm font-bold text-admin-text-primary">
            {Number(row.original.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] text-admin-text-muted">AED</span>
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Issue Date',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-admin-text-muted font-medium">
          <Calendar size={12} className="text-admin-text-muted" />
          {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString() : '—'}
        </div>
      ),
    },
    {
      accessorKey: 'valid_until',
      header: 'Expiry',
      cell: ({ row }) => (
        <div className="text-[11px] font-bold text-admin-text-secondary bg-admin-bg px-2 py-0.5 rounded-full inline-block">
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
          onView={() => navigate(`/admin/quotes/${row.original.id}`)}
          onEdit={() => navigate(`/admin/quotes/${row.original.id}`)}
        />
      ),
    },
  ];

  return (
    <ResourceListingPage<Quote>
      resource="quotes"
      title="Quotations"
      subtitle="Issue and track professional estimates for your clients."
      icon={<FileText size={20} />}
      columns={columns}
      onRowClick={(row) => navigate(`/admin/quotes/${row.id}`)}
      createLabel="New Quote"
      createPath="/admin/quotes/create"
      searchPlaceholder="Search by quote # or customer name..."
    />
  );
};
