import { getBasePath } from '@/hooks/useBasePath';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PaymentReceiptModal } from '@/components/shared/PaymentReceiptModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Invoice } from '@/types';
import { Receipt, Building2, CheckCircle2, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { ResourceListingPage } from '@/components/shared/ResourceListingPage';
import { ActionGroup } from '@/components/shared/ActionGroup';

/**
 * Invoices Module
 * Refactored to use the standardized State-Driven architecture.
 */
export const Invoices = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const admin = useAuthStore(s => s.admin);

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Custom mutation for email sending (specific to invoices)
  const sendEmailMutation = useMutation({
    mutationFn: async (id: number) => (await api.post(`/admin/invoices/${id}/send-email`)).data,
    onSuccess: () => { 
      toast.success('Invoice email sent'); 
      queryClient.invalidateQueries({ queryKey: ['invoices'] }); 
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to send email'),
  });

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'invoice_number',
      header: 'Invoice #',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-sm font-bold text-zeronix-blue">{row.original.invoice_number}</span>
          {row.original.email_sent_at && (
            <p className="text-[10px] text-green-500 flex items-center gap-0.5 mt-0.5 font-medium">
              <CheckCircle2 size={10} /> SENT VIA EMAIL
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
          <p className="text-sm font-semibold text-admin-text-primary truncate">{row.original.customer?.name || '—'}</p>
          {row.original.customer?.company && (
            <p className="text-[11px] text-admin-text-muted flex items-center gap-1 truncate">
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
      header: 'Amount',
      cell: ({ row }) => (
        <div className="text-right">
          <p className="font-mono text-sm font-bold text-admin-text-primary">
            {Number(row.original.total).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] text-admin-text-muted">AED</span>
          </p>
          {row.original.amount_paid > 0 && (
            <p className="text-[10px] font-bold text-green-600 bg-green-50 px-1 rounded inline-block mt-1">
              PAID: {row.original.amount_paid.toLocaleString()}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'due_info',
      header: 'Due Date',
      cell: ({ row }) => {
        const days = row.original.days_due;
        if (row.original.status === 'paid') return <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">SETTLED</span>;
        return (
          <div className="space-y-1">
            <p className="text-[11px] text-admin-text-muted flex items-center gap-1 font-medium">
              <Calendar size={10} /> {row.original.due_date ? new Date(row.original.due_date).toLocaleDateString() : '—'}
            </p>
            <span className={cn(
              "text-[10px] font-bold uppercase flex items-center gap-0.5 px-1.5 py-0.5 rounded",
              days < 0 ? "text-red-600 bg-red-50" : "text-blue-600 bg-blue-50"
            )}>
              <Clock size={10} />
              {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
            </span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <ActionGroup
          onPay={row.original.status !== 'paid' ? () => { setSelectedInvoice(row.original); setIsReceiptModalOpen(true); } : undefined}
          onMail={() => sendEmailMutation.mutate(row.original.id)}
          isMailPending={sendEmailMutation.isPending && sendEmailMutation.variables === row.original.id}
          isMailSent={!!row.original.email_sent_at}
          onDownload={() => window.open(`${api.defaults.baseURL}/admin/invoices/${row.original.id}/download`, '_blank')}
          onView={() => navigate(`${getBasePath()}/invoices/${row.original.id}`)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <ResourceListingPage<Invoice>
        resource="invoices"
        title="Invoices"
        icon={<Receipt size={20} />}
        columns={columns}
        onRowClick={(row) => {
          if (row.delivery_status === 'delivered' && admin?.role !== 'admin') {
            toast.error('Invoice cannot be edited after delivery confirmation.');
            return;
          }
          navigate(`${getBasePath()}/invoices/${row.id}`);
        }}
        searchPlaceholder="Search by invoice # or customer..."
      />

      <PaymentReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => { setIsReceiptModalOpen(false); setSelectedInvoice(null); }}
        invoice={selectedInvoice}
      />
    </div>
  );
};
