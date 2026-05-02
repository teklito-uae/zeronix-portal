import { useQuery } from '@tanstack/react-query';
import { Clock, Info, User as UserIcon, Activity as ActivityIcon } from 'lucide-react';
import api from '@/lib/axios';
import type { ColumnDef } from '@tanstack/react-table';
import { ResourceListingPage } from '@/components/shared/ResourceListingPage';

// Native date formatter helper
const formatActivityDate = (dateStr: string, includeTime: boolean = false) => {
  const date = new Date(dateStr);
  if (includeTime) {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  }).format(date);
};

interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  description: string;
  properties: any;
  created_at: string;
  user?: {
    name: string;
    role: string;
  };
}

/**
 * Activity Logs Module
 * Refactored to use the standardized State-Driven architecture.
 */
export const Activities = () => {
  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => (await api.get('/admin/users', { params: { per_page: 100 } })).data,
  });

  const columns: ColumnDef<ActivityLog>[] = [
    {
      accessorKey: 'created_at',
      header: 'Timestamp',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-admin-text-primary uppercase tracking-tighter">
            {formatActivityDate(row.original.created_at)}
          </span>
          <span className="text-[10px] text-admin-text-muted flex items-center gap-1 font-bold">
            <Clock size={10} className="opacity-50" />
            {formatActivityDate(row.original.created_at, true)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'user.name',
      header: 'Actor',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-admin-bg border border-admin-border flex items-center justify-center text-admin-text-secondary">
            <UserIcon size={14} />
          </div>
          <div>
            <p className="text-sm font-bold text-admin-text-primary">{row.original.user?.name || 'SYSTEM'}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-admin-text-muted">{row.original.user?.role || 'CORE'}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Action Detail',
      cell: ({ row }) => (
        <div className="flex items-start gap-2.5 max-w-lg">
          <div className="mt-0.5 text-zeronix-blue opacity-40">
            <Info size={14} />
          </div>
          <p className="text-sm font-medium text-admin-text-secondary leading-relaxed">
            {row.original.description}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Event Type',
      cell: ({ row }) => {
        const action = row.original.action;
        let colorClass = "bg-admin-bg text-admin-text-muted border-admin-border";
        
        if (action.includes('created')) colorClass = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
        if (action.includes('updated')) colorClass = "bg-blue-500/10 text-blue-600 border-blue-500/20";
        if (action.includes('deleted')) colorClass = "bg-red-500/10 text-red-600 border-red-500/20";
        if (action.includes('email') || action.includes('sent')) colorClass = "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";

        return (
          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${colorClass}`}>
            {action.replace(/_/g, ' ')}
          </span>
        );
      },
    },
  ];

  return (
    <ResourceListingPage<ActivityLog>
      resource="activities"
      title="Audit Logs"
      icon={<ActivityIcon size={20} />}
      columns={columns}
      searchPlaceholder="Search logs by description or user..."
      filters={[
        {
          name: 'user_id',
          label: 'User',
          placeholder: 'All Users',
          options: usersData?.data?.map((u: any) => ({ label: u.name, value: String(u.id) })) || []
        },
        {
          name: 'action',
          label: 'Action Type',
          placeholder: 'All Actions',
          options: [
            { label: 'Created Enquiry', value: 'created_enquiry' },
            { label: 'Updated Enquiry', value: 'updated_enquiry' },
            { label: 'Created Quote', value: 'created_quote' },
            { label: 'Created Invoice', value: 'created_invoice' },
            { label: 'Created Customer', value: 'created_customer' },
          ]
        }
      ]}
    />
  );
};
