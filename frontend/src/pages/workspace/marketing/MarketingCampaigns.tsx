import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { useQueryClient } from '@tanstack/react-query';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { ResourceListingPage } from '@/components/shared/ResourceListingPage';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ActionGroup } from '@/components/shared/ActionGroup';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import type { MarketingCampaign } from '@/types';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'sending', label: 'Sending' },
  { id: 'paused', label: 'Paused' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export const MarketingCampaigns = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');

  const duplicate = async (id: number) => {
    try {
      const res = await api.post(`/admin/marketing/campaigns/${id}/duplicate`);
      queryClient.invalidateQueries({ queryKey: ['marketing/campaigns'] });
      toast.success('Campaign duplicated');
      navigate(`/workspace/marketing/campaigns/${res.data.id}/edit`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to duplicate campaign');
    }
  };

  const remove = async (id: number) => {
    try {
      await api.delete(`/admin/marketing/campaigns/${id}`);
      queryClient.invalidateQueries({ queryKey: ['marketing/campaigns'] });
      toast.success('Campaign deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete campaign');
    }
  };

  const columns: ColumnDef<MarketingCampaign>[] = [
    {
      accessorKey: 'name',
      header: 'Campaign',
      cell: ({ row }) => (
        <div>
          <p className="text-[13px] font-medium text-brand-primary">{row.original.name}</p>
          <p className="text-[11px] text-brand-subtle">{row.original.template?.name || 'Custom content'}</p>
        </div>
      ),
    },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: 'total_recipients', header: 'Recipients', cell: ({ row }) => <span className="text-[12px]">{row.original.total_recipients}</span> },
    { accessorKey: 'sent_count', header: 'Sent', cell: ({ row }) => <span className="text-[12px]">{row.original.sent_count}</span> },
    {
      id: 'open_rate',
      header: 'Open Rate',
      cell: ({ row }) => {
        const c = row.original;
        const rate = c.sent_count > 0 ? Math.round((c.opened_count / c.sent_count) * 100) : 0;
        return <span className="text-[12px]">{rate}%</span>;
      },
    },
    {
      id: 'click_rate',
      header: 'Click Rate',
      cell: ({ row }) => {
        const c = row.original;
        const rate = c.sent_count > 0 ? Math.round((c.clicked_count / c.sent_count) * 100) : 0;
        return <span className="text-[12px]">{rate}%</span>;
      },
    },
    {
      id: 'scheduled_at',
      header: 'Scheduled',
      cell: ({ row }) => (
        <span className="text-[12px] text-brand-subtle">
          {row.original.scheduled_at ? new Date(row.original.scheduled_at).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <ActionGroup
          onView={() => navigate(`/workspace/marketing/campaigns/${row.original.id}`)}
          onEdit={['draft', 'scheduled'].includes(row.original.status) ? () => navigate(`/workspace/marketing/campaigns/${row.original.id}/edit`) : undefined}
          onDelete={row.original.status !== 'sending' ? () => remove(row.original.id) : undefined}
        />
      ),
    },
  ];

  return (
    <MarketingLayout title="Campaigns">
      <ResourceListingPage<MarketingCampaign>
        resource="marketing/campaigns"
        title="Campaigns"
        icon={<Send />}
        columns={columns}
        searchPlaceholder="Search campaigns..."
        createPath="/workspace/marketing/campaigns/new"
        createLabel="New Campaign"
        onRowClick={(row) => navigate(`/workspace/marketing/campaigns/${row.id}`)}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        baseFilters={activeTab === 'all' ? {} : { status: activeTab }}
      />
    </MarketingLayout>
  );
};
