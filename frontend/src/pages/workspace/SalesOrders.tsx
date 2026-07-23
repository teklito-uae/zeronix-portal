import { getBasePath } from '@/hooks/useBasePath';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import api from '@/lib/axios';
import type { SalesOrder, User } from '@/types';
import { ClipboardList, Building2, Calendar } from 'lucide-react';
import { ResourceListingPage } from '@/components/shared/ResourceListingPage';
import { ActionGroup } from '@/components/shared/ActionGroup';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { CurrencyAmount } from '@/components/shared/CurrencyAmount';

export const SalesOrders = () => {
  const currency = useCurrencyStore((s) => s.currency);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');

  const { data: usersList = [] } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () => (await api.get(`/admin/users?per_page=100`)).data.data as User[],
  });

  const orderTabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'draft', label: 'Draft' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'processing', label: 'Processing' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  const columns: ColumnDef<SalesOrder>[] = [
    {
      accessorKey: 'order_number',
      header: 'Order #',
      cell: ({ row }) => (
        <span className="font-mono text-[13px] font-semibold text-brand-primary bg-brand-surface px-2 py-0.5 rounded border border-brand-border/50">{row.original.order_number}</span>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <p className="text-[14px] font-semibold text-brand-primary truncate flex items-center gap-1.5">
            <Building2 size={12} className="opacity-50" /> {row.original.customer?.name || '—'}
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
        <p className="font-mono text-[14px] font-semibold text-brand-primary">
          <CurrencyAmount amount={row.original.total} currency={currency} />
        </p>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => (
        <p className="text-[12px] text-brand-subtle flex items-center gap-1.5 font-medium">
          <Calendar size={12} className="opacity-50" /> {row.original.date ? new Date(row.original.date).toLocaleDateString() : '—'}
        </p>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <ActionGroup onView={() => navigate(`${getBasePath()}/sales-orders/${row.original.id}`)} />
      ),
    },
  ];

  return (
    <ResourceListingPage<SalesOrder>
      resource="sales-orders"
      title="Sales Orders"
      icon={<ClipboardList size={20} />}
      columns={columns}
      onRowClick={(row) => navigate(`${getBasePath()}/sales-orders/${row.id}`)}
      createLabel="New Sales Order"
      createPath={`${getBasePath()}/sales-orders/create`}
      searchPlaceholder="Search by order # or customer..."
      tabs={orderTabs}
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
