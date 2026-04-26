import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Search, Loader2, User, Clock, Info } from 'lucide-react';
import api from '@/lib/axios';
import { type ColumnDef } from '@tanstack/react-table';

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

export const Activities = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const { data: activitiesData, isLoading } = useQuery({
    queryKey: ['activities', page, search, userFilter, actionFilter],
    queryFn: async () => {
      const res = await api.get('/admin/activities', {
        params: {
          page,
          search,
          user_id: userFilter,
          action: actionFilter,
          per_page: 20
        }
      });
      return res.data;
    }
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await api.get('/admin/users', { params: { per_page: 100 } });
      return res.data;
    }
  });

  const columns: ColumnDef<ActivityLog>[] = [
    {
      accessorKey: 'created_at',
      header: 'Time',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-admin-text-primary">
            {formatActivityDate(row.original.created_at)}
          </span>
          <span className="text-xs text-admin-text-muted flex items-center gap-1">
            <Clock size={10} />
            {formatActivityDate(row.original.created_at, true)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'user.name',
      header: 'User',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-zeronix-blue/10 flex items-center justify-center text-zeronix-blue">
            <User size={14} />
          </div>
          <div>
            <p className="text-sm font-medium text-admin-text-primary">{row.original.user?.name || 'System'}</p>
            <p className="text-[10px] uppercase tracking-wider text-admin-text-muted">{row.original.user?.role || 'System'}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Activity',
      cell: ({ row }) => (
        <div className="flex items-start gap-2 max-w-md">
          <div className="mt-0.5 text-zeronix-blue">
            <Info size={14} />
          </div>
          <p className="text-sm text-admin-text-primary">{row.original.description}</p>
        </div>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const action = row.original.action;
        let variant = "bg-gray-100 text-gray-700";
        if (action.startsWith('created')) variant = "bg-green-100 text-green-700";
        if (action.startsWith('updated')) variant = "bg-blue-100 text-blue-700";
        if (action.startsWith('deleted')) variant = "bg-red-100 text-red-700";

        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${variant}`}>
            {action.replace('_', ' ')}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Search & Filters Bar - Matching Products style */}
      <div className="bg-admin-surface border border-admin-border rounded-xl p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" size={16} />
            <Input
              placeholder="Search descriptions..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 h-9 bg-admin-bg border-admin-border text-admin-text-primary text-sm"
            />
          </div>
        </div>

        <Select value={userFilter} onValueChange={(v) => { setUserFilter(v); setPage(1); }}>
          <SelectTrigger className="h-9 w-44 bg-admin-bg border-admin-border text-admin-text-primary text-sm">
            <SelectValue placeholder="All Users" />
          </SelectTrigger>
          <SelectContent className="bg-admin-surface border-admin-border">
            <SelectItem value="all">All Users</SelectItem>
            {usersData?.data?.map((user: any) => (
              <SelectItem key={user.id} value={user.id.toString()}>{user.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
          <SelectTrigger className="h-9 w-44 bg-admin-bg border-admin-border text-admin-text-primary text-sm">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent className="bg-admin-surface border-admin-border">
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="created_enquiry">Created Enquiry</SelectItem>
            <SelectItem value="updated_enquiry">Updated Enquiry</SelectItem>
            <SelectItem value="created_quote">Created Quote</SelectItem>
            <SelectItem value="created_invoice">Created Invoice</SelectItem>
            <SelectItem value="created_customer">Created Customer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-zeronix-blue" size={32} />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={activitiesData?.data || []}
            hidePagination={true}
          />
          {activitiesData && activitiesData.total > 0 && (
            <div className="flex items-center justify-between py-2 mt-2">
              <p className="text-sm text-admin-text-muted">{activitiesData.total} activities found</p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1}
                  className="bg-admin-surface border-admin-border text-admin-text-secondary"
                >
                  Previous
                </Button>
                <span className="text-sm text-admin-text-muted px-2">Page {page} of {activitiesData.last_page}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => p + 1)} 
                  disabled={page >= activitiesData.last_page}
                  className="bg-admin-surface border-admin-border text-admin-text-secondary"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
