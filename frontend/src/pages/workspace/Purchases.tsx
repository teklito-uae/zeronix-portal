import { getBasePath } from '@/hooks/useBasePath';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SupplierPaymentModal } from '@/components/shared/SupplierPaymentModal';
import type { PurchaseBill } from '@/types';
import { ShoppingCart, Truck, Calendar } from 'lucide-react';
import { ResourceListingPage } from '@/components/shared/ResourceListingPage';
import { ActionGroup } from '@/components/shared/ActionGroup';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { CurrencyAmount } from '@/components/shared/CurrencyAmount';

export const Purchases = () => {
  const currency = useCurrencyStore((s) => s.currency);
  const navigate = useNavigate();

  const [selectedBill, setSelectedBill] = useState<PurchaseBill | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const billTabs = [
    { id: 'all', label: 'All Bills' },
    { id: 'unpaid', label: 'Unpaid' },
    { id: 'partial', label: 'Partial' },
    { id: 'paid', label: 'Paid' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  const columns: ColumnDef<PurchaseBill>[] = [
    {
      accessorKey: 'bill_number',
      header: 'Bill #',
      cell: ({ row }) => (
        <span className="font-mono text-[13px] font-semibold text-brand-primary bg-brand-surface px-2 py-0.5 rounded border border-brand-border/50">{row.original.bill_number}</span>
      ),
    },
    {
      accessorKey: 'supplier',
      header: 'Supplier',
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <p className="text-[14px] font-semibold text-brand-primary truncate flex items-center gap-1.5">
            <Truck size={12} className="opacity-50" /> {row.original.supplier?.name || '—'}
          </p>
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
          <p className="font-mono text-[14px] font-semibold text-brand-primary">
            <CurrencyAmount amount={row.original.total} currency={currency} />
          </p>
          {row.original.amount_paid > 0 && (
            <p className="text-[11px] font-medium text-brand-success bg-brand-success-bg px-1.5 py-0.5 rounded inline-block mt-1">
              PAID: {row.original.amount_paid.toLocaleString()}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'due_date',
      header: 'Due Date',
      cell: ({ row }) => (
        <p className="text-[12px] text-brand-subtle flex items-center gap-1.5 font-medium">
          <Calendar size={12} className="opacity-50" /> {row.original.due_date ? new Date(row.original.due_date).toLocaleDateString() : '—'}
        </p>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <ActionGroup
          onPay={row.original.status !== 'paid' ? () => { setSelectedBill(row.original); setIsPaymentModalOpen(true); } : undefined}
          onView={() => navigate(`${getBasePath()}/purchases/${row.original.id}`)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <ResourceListingPage<PurchaseBill>
        resource="purchase-bills"
        title="Purchases"
        icon={<ShoppingCart size={20} />}
        columns={columns}
        onRowClick={(row) => navigate(`${getBasePath()}/purchases/${row.id}`)}
        createLabel="Record Bill"
        createPath={`${getBasePath()}/purchases/create`}
        searchPlaceholder="Search by bill # or supplier..."
        tabs={billTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        baseFilters={{ status: activeTab !== 'all' ? activeTab : undefined }}
      />

      <SupplierPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => { setIsPaymentModalOpen(false); setSelectedBill(null); }}
        purchaseBill={selectedBill}
      />
    </div>
  );
};
