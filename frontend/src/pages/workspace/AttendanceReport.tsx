import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { User } from '@/types';
import { ResourceListingPage } from '@/components/shared/ResourceListingPage';
import { PhoneFlag } from '@/components/shared/PhoneFlag';
import { Clock, Calendar, Search, User as UserIcon, RefreshCw, Download, X, Activity } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Avatar from 'boring-avatars';
import { useThemeStore } from '@/store/useThemeStore';

function StatBox({ label, count, vsYesterday }: { label: string, count: number, vsYesterday: number }) {
  const isPositive = vsYesterday > 0;
  const isNegative = vsYesterday < 0;

  return (
    <div className="flex flex-col">
      <span className="text-[11px] font-medium text-admin-text-secondary whitespace-nowrap">{label}</span>
      <span className="text-[20px] font-bold text-admin-text-primary my-0.5 leading-tight">{count}</span>
      <div className="flex items-center gap-1 text-[10px] font-semibold">
        {isPositive && <span className="text-emerald-500">+{vsYesterday}</span>}
        {isNegative && <span className="text-amber-500">{vsYesterday}</span>}
        {vsYesterday === 0 && <span className="text-admin-text-muted">0</span>}
        <span className="text-admin-text-muted font-medium">vs yesterday</span>
      </div>
    </div>
  );
}

function AttendanceStats() {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['attendance', 'statistics'],
    queryFn: async () => {
      const response = await api.get('/admin/attendance/statistics');
      return response.data;
    }
  });

  if (isLoading) return <div className="h-24 bg-admin-surface rounded-xl border border-admin-border animate-pulse mb-4" />;
  if (isError || !data || !data.today) return <div className="h-24 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl border border-red-100 dark:border-red-900/50 flex items-center justify-center font-bold mb-4 text-sm">Failed to load statistics</div>;

  const today = data.today;
  const yest = data.yesterday;

  const getDiff = (key: string) => today[key] - yest[key];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      {/* Present Summary */}
      <div className="bg-admin-surface border border-admin-border rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-brand-primary" />
            <h3 className="text-[13px] font-bold text-admin-text-primary">Present Summary</h3>
          </div>
          <button onClick={() => refetch()} className="text-admin-text-muted hover:text-admin-text-primary transition-colors"><RefreshCw size={14} className={isRefetching ? "animate-spin text-brand-primary" : ""} /></button>
        </div>
        <div className="flex justify-between items-end divide-x divide-admin-border/50">
          <div className="pr-2 md:pr-4 flex-1"><StatBox label="On time" count={today.on_time} vsYesterday={getDiff('on_time')} /></div>
          <div className="px-2 md:px-4 flex-1"><StatBox label="Late clock-in" count={today.late} vsYesterday={getDiff('late')} /></div>
          <div className="pl-2 md:pl-4 flex-1"><StatBox label="Early clock-in" count={today.early} vsYesterday={getDiff('early')} /></div>
        </div>
      </div>

      {/* Not Present Summary */}
      <div className="bg-admin-surface border border-admin-border rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-brand-primary" />
            <h3 className="text-[13px] font-bold text-admin-text-primary">Not Present Summary</h3>
          </div>
          <button onClick={() => refetch()} className="text-admin-text-muted hover:text-admin-text-primary transition-colors"><RefreshCw size={14} className={isRefetching ? "animate-spin text-brand-primary" : ""} /></button>
        </div>
        <div className="flex justify-between items-end divide-x divide-admin-border/50">
          <div className="pr-2 flex-1"><StatBox label="Absent" count={today.absent} vsYesterday={getDiff('absent')} /></div>
          <div className="px-2 flex-1"><StatBox label="No clock-in" count={today.no_clock_in} vsYesterday={getDiff('no_clock_in')} /></div>
          <div className="px-2 flex-1"><StatBox label="No clock-out" count={today.no_clock_out} vsYesterday={getDiff('no_clock_out')} /></div>
          <div className="pl-2 flex-1"><StatBox label="Invalid" count={today.invalid} vsYesterday={getDiff('invalid')} /></div>
        </div>
      </div>

      {/* Away Summary */}
      <div className="bg-admin-surface border border-admin-border rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-brand-primary" />
            <h3 className="text-[13px] font-bold text-admin-text-primary">Away Summary</h3>
          </div>
          <button onClick={() => refetch()} className="text-admin-text-muted hover:text-admin-text-primary transition-colors"><RefreshCw size={14} className={isRefetching ? "animate-spin text-brand-primary" : ""} /></button>
        </div>
        <div className="flex justify-between items-end divide-x divide-admin-border/50">
          <div className="pr-2 md:pr-4 flex-1"><StatBox label="Day off" count={today.day_off} vsYesterday={getDiff('day_off')} /></div>
          <div className="pl-2 md:pl-4 flex-1"><StatBox label="Time off" count={today.time_off} vsYesterday={getDiff('time_off')} /></div>
        </div>
      </div>
    </div>
  );
}

interface AttendanceRecord {
  id: number;
  user_id: number;
  clock_in: string;
  clock_out: string | null;
  clock_out_reason: string | null;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
  user?: User;
}

export const AttendanceReport = () => {
  const { theme } = useThemeStore();
  const avatarColors = theme === 'dark' 
    ? ['#ff4d6d', '#ff758f', '#ffbe0b', '#fdfcdc', '#48cae4']
    : ['#1d3557', '#457b9d', '#a8dadc', '#f1faee', '#e63946'];

  // Filter States
  const [userIdFilter, setUserIdFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Fetch Team Members for Filter
  const { data: teamData } = useQuery({
    queryKey: ['users', 'all-filters'],
    queryFn: async () => (await api.get('/admin/users?per_page=100')).data.data as User[]
  });

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDurationStr = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const handleExportCSV = async (ids: number[], clearSelection: () => void) => {
    try {
      const response = await api.get('/admin/attendance/export', {
        params: {
          user_ids: ids,
          start_date: startDate || undefined,
          end_date: endDate || undefined
        },
        responseType: 'blob' // Important for downloading files
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      clearSelection();
    } catch (e) {
      console.error("Export failed", e);
      alert("Failed to export CSV. Please try again.");
    }
  };

  const columns: ColumnDef<AttendanceRecord>[] = [
    {
      accessorKey: 'user.name',
      header: 'Team Member',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar
            size={36}
            name={row.original.user?.name || 'Unknown'}
            variant="beam"
            colors={avatarColors}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-admin-text-primary">
              {row.original.user?.name}
            </p>
            <p className="text-xs text-admin-text-secondary">
              {row.original.user?.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'user.shift',
      header: 'Shift Hours',
      cell: ({ row }) => {
        const u = row.original.user;
        if (!u) return '—';
        return (
          <span className="text-xs font-medium text-admin-text-secondary">
            {u.shift_start ? u.shift_start.slice(0, 5) : '09:00'} - {u.shift_end ? u.shift_end.slice(0, 5) : '18:00'}
          </span>
        );
      },
    },
    {
      accessorKey: 'clock_in',
      header: 'Clock In',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-admin-text-secondary">
          <Calendar size={12} className="text-admin-text-muted" />
          {formatDateTime(row.original.clock_in)}
        </div>
      ),
    },
    {
      accessorKey: 'clock_out',
      header: 'Clock Out',
      cell: ({ row }) => {
        const active = !row.original.clock_out;
        return active ? (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10">
            ● ON DUTY
          </span>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-admin-text-secondary">
            <Calendar size={12} className="text-admin-text-muted" />
            {formatDateTime(row.original.clock_out)}
          </div>
        );
      },
    },
    {
      accessorKey: 'duration_minutes',
      header: 'Duration',
      cell: ({ row }) => {
        const active = !row.original.clock_out;

        // Calculate live duration if active
        let dur = row.original.duration_minutes || 0;
        if (active && row.original.clock_in) {
          const clockInTime = new Date(row.original.clock_in.replace(' ', 'T')).getTime();
          dur = Math.max(0, Math.floor((new Date().getTime() - clockInTime) / 60000));
        }

        // Calculate expected duration based on shift
        const shiftStart = row.original.user?.shift_start || '09:00:00';
        const shiftEnd = row.original.user?.shift_end || '18:00:00';

        const startH = parseInt(shiftStart.split(':')[0]);
        const startM = parseInt(shiftStart.split(':')[1]);
        const endH = parseInt(shiftEnd.split(':')[0]);
        const endM = parseInt(shiftEnd.split(':')[1]);

        const expectedMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        const validExpected = expectedMinutes > 0 ? expectedMinutes : 9 * 60; // fallback to 9 hours

        const progress = Math.min(100, Math.max(0, (dur / validExpected) * 100));

        return (
          <div className="flex flex-col gap-1.5 w-32">
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold ${active ? 'text-emerald-600 dark:text-emerald-400 animate-pulse' : 'text-admin-text-primary'
                }`}>
                {formatDurationStr(dur)}
              </span>
              <span className="text-[9px] font-bold text-admin-text-muted">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-admin-bg rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${active ? 'bg-emerald-500' :
                    progress >= 100 ? 'bg-brand-primary' : 'bg-brand-accent'
                  }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'clock_out_reason',
      header: 'Checkout Reason',
      cell: ({ row }) => {
        const reason = row.original.clock_out_reason;
        if (!row.original.clock_out) return <span className="text-xs text-admin-text-muted italic">Session active</span>;
        if (!reason) return <span className="text-xs text-admin-text-muted">Standard</span>;

        // Highlight custom reasons
        const isSpecial = !['Shift ended', 'Standard'].includes(reason);
        return (
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${isSpecial ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' : 'text-admin-text-secondary'
            }`}>
            {reason}
          </span>
        );
      },
    },
  ];

  // We feed custom query parameters to ResourceListingPage
  const extraParams = {
    user_id: userIdFilter,
    status: statusFilter,
    start_date: startDate,
    end_date: endDate
  };

  return (
    <ResourceListingPage<AttendanceRecord>
      topContent={<AttendanceStats />}
      resource="attendance/report"
      title="Attendance Ledger"
      icon={<Clock size={20} />}
      columns={columns}
      createLabel="" // No create action for attendance logs
      createPath=""
      searchPlaceholder="Search attendance logs by staff name..."
      baseFilters={extraParams}
      enableRowSelection={true}
      selectedIds={selectedIds}
      setSelectedIds={setSelectedIds}
      floatingBulkActions={(ids, clear) => (
        <div className="bg-brand-primary text-brand-white px-4 py-2 rounded-full shadow-lg flex items-center gap-4">
          <span className="text-[13px] font-medium">{ids.length} selected</span>
          <div className="w-px h-4 bg-brand-white/20"></div>
          <Button 
            onClick={() => handleExportCSV(ids, clear)}
            size="sm" 
            variant="ghost" 
            className="text-brand-white hover:text-brand-primary hover:bg-brand-white h-7 px-3 text-xs rounded-full transition-colors"
          >
            <Download size={14} className="mr-1.5" /> Export CSV
          </Button>
          <button onClick={clear} className="text-brand-white/70 hover:text-brand-white">
            <X size={16} />
          </button>
        </div>
      )}
      leftActions={
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* User Filter */}
          <Select value={userIdFilter} onValueChange={setUserIdFilter}>
            <SelectTrigger className="flex-shrink-0 h-[34px] md:h-[32px] w-[40px] md:w-48 bg-brand-white border border-brand-border text-brand-primary rounded-lg text-xs font-bold shadow-sm justify-center md:justify-between px-0 md:px-3">
              <span className="hidden md:block truncate text-left"><SelectValue placeholder="All Members" /></span>
              <span className="md:hidden flex items-center justify-center"><UserIcon size={16} className="text-brand-subtle" /></span>
            </SelectTrigger>
            <SelectContent className="bg-brand-white border-brand-border rounded-xl">
              <SelectItem value="all" className="font-bold">All Members</SelectItem>
              {teamData?.map(u => (
                <SelectItem key={u.id} value={String(u.id)} className="font-bold">
                  {u.name} ({u.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="flex-shrink-0 h-[34px] md:h-[32px] w-[40px] md:w-40 bg-brand-white border border-brand-border text-brand-primary rounded-lg text-xs font-bold shadow-sm justify-center md:justify-between px-0 md:px-3">
              <span className="hidden md:block truncate text-left"><SelectValue placeholder="All Status" /></span>
              <span className="md:hidden flex items-center justify-center"><Activity size={16} className="text-brand-subtle" /></span>
            </SelectTrigger>
            <SelectContent className="bg-brand-white border-brand-border rounded-xl">
              <SelectItem value="all" className="font-bold">All Status</SelectItem>
              <SelectItem value="active" className="font-bold">On Duty</SelectItem>
              <SelectItem value="completed" className="font-bold">Completed</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Filters (Compact) */}
          <div className="flex items-center gap-1.5 flex-1 md:flex-none bg-brand-surface border border-brand-border rounded-lg px-2 h-[34px] md:h-[32px] shadow-sm overflow-hidden">
            <Calendar size={14} className="text-brand-subtle flex-shrink-0 hidden sm:block" />
            <Input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="border-0 bg-transparent h-full text-[11px] sm:text-xs px-0 w-full focus-visible:ring-0 min-w-0"
            />
            <span className="text-brand-subtle font-bold text-[10px]">—</span>
            <Input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="border-0 bg-transparent h-full text-[11px] sm:text-xs px-0 w-full focus-visible:ring-0 min-w-0"
            />
          </div>
        </div>
      }
    />
  );
};
