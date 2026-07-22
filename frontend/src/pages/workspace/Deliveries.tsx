import { getBasePath } from '@/hooks/useBasePath';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { Delivery } from '@/types';
import { PackageCheck, Building2, Calendar } from 'lucide-react';
import { ResourceListingPage } from '@/components/shared/ResourceListingPage';
import { ActionGroup } from '@/components/shared/ActionGroup';

export const Deliveries = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');

  const deliveryTabs = [
    { id: 'all', label: 'All Deliveries' },
    { id: 'pending', label: 'Pending' },
    { id: 'processing', label: 'Processing' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  const columns: ColumnDef<Delivery>[] = [
    {
      accessorKey: 'delivery_number',
      header: 'Delivery #',
      cell: ({ row }) => (
        <span className="font-mono text-[13px] font-semibold text-brand-primary bg-brand-surface px-2 py-0.5 rounded border border-brand-border/50">{row.original.delivery_number}</span>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => (
        <p className="text-[14px] font-semibold text-brand-primary truncate flex items-center gap-1.5">
          <Building2 size={12} className="opacity-50" /> {row.original.customer?.name || '—'}
        </p>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'items_count',
      header: 'Items',
      cell: ({ row }) => <span className="text-[13px] font-medium text-brand-secondary">{row.original.items_count ?? row.original.items?.length ?? 0}</span>,
    },
    {
      accessorKey: 'delivery_date',
      header: 'Date',
      cell: ({ row }) => (
        <p className="text-[12px] text-brand-subtle flex items-center gap-1.5 font-medium">
          <Calendar size={12} className="opacity-50" /> {row.original.delivery_date ? new Date(row.original.delivery_date).toLocaleDateString() : '—'}
        </p>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <ActionGroup onView={() => navigate(`${getBasePath()}/deliveries/${row.original.id}`)} />
      ),
    },
  ];

  return (
    <ResourceListingPage<Delivery>
      resource="deliveries"
      title="Deliveries"
      icon={<PackageCheck size={20} />}
      columns={columns}
      onRowClick={(row) => navigate(`${getBasePath()}/deliveries/${row.id}`)}
      createLabel="New Delivery"
      createPath={`${getBasePath()}/deliveries/create`}
      searchPlaceholder="Search by delivery # or customer..."
      tabs={deliveryTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      baseFilters={{ status: activeTab !== 'all' ? activeTab : undefined }}
      filters={[
        {
          name: 'customer_confirmation',
          label: 'Customer Confirmation',
          placeholder: 'Filter by confirmation',
          options: [
            { label: 'Accepted', value: 'accepted' },
            { label: 'Rejected', value: 'rejected' },
          ],
        },
      ]}
    />
  );
};
