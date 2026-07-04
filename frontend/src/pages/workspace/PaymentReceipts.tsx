import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import api from '@/lib/axios';
import type { PaymentReceipt } from '@/types';
import { Receipt, Calendar, Building2, Banknote, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ResourceListingPage } from '@/components/shared/ResourceListingPage';
import { ActionGroup } from '@/components/shared/ActionGroup';

/**
 * Payment Receipts Module
 * Refactored to use the standardized State-Driven architecture.
 */
export const PaymentReceipts = () => {
  const queryClient = useQueryClient();
  const [sendingId, setSendingId] = useState<number | null>(null);

  // Custom mutation for sending receipt email
  const sendMutation = useMutation({
    mutationFn: async (id: number) => {
      setSendingId(id);
      return api.post(`/admin/payment-receipts/${id}/send-email`);
    },
    onSuccess: () => {
      toast.success('Receipt email dispatched successfully');
      queryClient.invalidateQueries({ queryKey: ['payment-receipts'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to dispatch email');
    },
    onSettled: () => setSendingId(null)
  });

  const columns: ColumnDef<PaymentReceipt>[] = [
    {
      accessorKey: 'receipt_number',
      header: 'Receipt ID',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span className="font-mono text-xs font-black text-zeronix-blue bg-zeronix-blue/5 px-2 py-0.5 rounded border border-zeronix-blue/10">
            {row.original.receipt_number}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Payee',
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <p className="text-sm font-bold text-admin-text-primary truncate">{row.original.customer?.name}</p>
          <p className="text-[10px] font-bold text-admin-text-muted uppercase tracking-widest truncate">
            {row.original.customer?.company || 'PRIVATE ACCOUNT'}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'invoice',
      header: 'Related Ref.',
      cell: ({ row }) => (
        row.original.invoice
          ? <span className="text-[10px] font-black text-admin-text-secondary bg-admin-bg px-2 py-0.5 rounded-full border border-admin-border">
              {row.original.invoice.invoice_number}
            </span>
          : <span className="text-admin-text-muted text-[10px] font-bold opacity-30">—</span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Settlement Amount',
      cell: ({ row }) => (
        <div className="text-right pr-4">
          <p className="font-mono text-sm font-black text-admin-text-primary">
            {Number(row.original.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] text-admin-text-muted">AED</span>
          </p>
          <p className={cn("text-[9px] font-black uppercase tracking-widest flex items-center justify-end gap-1 mt-0.5", row.original.payment_method === 'cash' ? "text-emerald-500" : "text-indigo-500")}>
            {row.original.payment_method === 'cash' ? <Banknote size={10} /> : <Building2 size={10} />}
            {row.original.payment_method}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'payment_date',
      header: 'Settlement Date',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs font-bold text-admin-text-muted uppercase tracking-tighter">
          <Calendar size={12} className="opacity-50" />
          {new Date(row.original.payment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <ActionGroup
          onView={() => window.open(`${api.defaults.baseURL}/admin/receipts/${row.original.id}/view`, '_blank')}
          onDownload={() => window.open(`${api.defaults.baseURL}/admin/receipts/${row.original.id}/download`, '_blank')}
          onMail={() => sendMutation.mutate(row.original.id)}
          isMailPending={sendingId === row.original.id}
        />
      ),
    },
  ];

  return (
    <ResourceListingPage<PaymentReceipt>
      resource="payment-receipts"
      title="Payment Settlements"
      icon={<Receipt size={20} />}
      columns={columns}
      searchPlaceholder="Search by receipt ID, customer or invoice ref..."
    />
  );
};
