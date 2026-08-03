import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useState, useEffect } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import Avatar from 'boring-avatars';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Spinner } from '@/components/shared/Spinner';
import { toTitleCase } from '@/lib/utils';

// Staff-only clock in/out widget, extracted from the former standalone
// StaffDashboard so it can be embedded inside the merged Dashboard instead
// of replacing it entirely.
export const ClockInHeader = () => {
  const queryClient = useQueryClient();
  const admin = useAuthStore(state => state.admin);

  const [now, setNow] = useState(new Date());
  const [isClockOutOpen, setIsClockOutOpen] = useState(false);
  const [clockOutReason, setClockOutReason] = useState('Shift ended');
  const [customReason, setCustomReason] = useState('');

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data: attendanceStatus, refetch: refetchAttendance } = useQuery({
    queryKey: ['attendance-status'],
    queryFn: async () => (await api.get(`/admin/attendance/status`)).data,
    refetchInterval: 30_000,
  });

  const clockInMutation = useMutation({
    mutationFn: async () => (await api.post(`/admin/attendance/clock-in`)).data,
    onSuccess: () => { toast.success('Clocked in successfully.'); refetchAttendance(); queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] }); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to clock in.'),
  });

  const clockOutMutation = useMutation({
    mutationFn: async (reason: string) => (await api.post(`/admin/attendance/clock-out`, { reason })).data,
    onSuccess: () => { toast.success('Clocked out successfully.'); refetchAttendance(); setIsClockOutOpen(false); setClockOutReason('Shift ended'); setCustomReason(''); queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] }); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to clock out.'),
  });

  const handleClockOutSubmit = () => {
    const finalReason = clockOutReason === 'Other' ? (customReason.trim() || 'Other') : clockOutReason;
    clockOutMutation.mutate(finalReason);
  };

  const formatTimer = (clockInTimeStr?: string) => {
    if (!clockInTimeStr) return '00:00:00';
    const diff = Math.max(0, now.getTime() - new Date(clockInTimeStr).getTime());
    const secs = Math.floor(diff / 1000) % 60;
    const mins = Math.floor(diff / 60000) % 60;
    const hours = Math.floor(diff / 3600000);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isClockedIn = !!attendanceStatus?.active_attendance;
  const clockInTime = attendanceStatus?.active_attendance?.clock_in;

  return (
    <>
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-brand-border bg-brand-white px-4 sm:px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar size={44} name={admin?.name || 'User'} variant="beam" colors={['#fdfcdc', '#fed9b7', '#f07167', '#00afb9', '#0081a7']} />
          <div className="min-w-0">
            <h1 className="text-[16px] font-bold text-brand-primary leading-tight truncate">
              Welcome back, {admin?.name || 'there'}
            </h1>
            <p className="text-[12px] text-brand-subtle mt-0.5 truncate">
              {admin?.designation ? `${toTitleCase(admin.designation)} · ` : ''}
              {now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-brand-subtle font-semibold">
              {isClockedIn ? 'Session Active' : 'Not Clocked In'}
            </p>
            <p className="text-[20px] font-bold leading-none text-brand-primary font-mono mt-0.5">
              {isClockedIn
                ? formatTimer(clockInTime)
                : now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </p>
          </div>

          {isClockedIn ? (
            <button
              onClick={() => setIsClockOutOpen(true)}
              disabled={clockOutMutation.isPending}
              className="shrink-0 group flex items-center gap-2 bg-brand-danger hover:bg-red-600 text-white font-semibold text-[13px] px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              <LogOut size={15} className="group-hover:translate-x-0.5 transition-transform" />
              Clock Out
            </button>
          ) : (
            <button
              onClick={() => clockInMutation.mutate()}
              disabled={clockInMutation.isPending}
              className="shrink-0 group flex items-center gap-2 bg-brand-success hover:opacity-90 text-white font-semibold text-[13px] px-4 py-2 rounded-lg transition-opacity disabled:opacity-60"
            >
              {clockInMutation.isPending
                ? <Spinner size={15} />
                : <LogIn size={15} className="group-hover:-translate-x-0.5 transition-transform" />}
              Clock In
            </button>
          )}
        </div>
      </div>

      <Dialog open={isClockOutOpen} onOpenChange={setIsClockOutOpen}>
        <DialogContent className="bg-brand-white border-brand-border rounded-2xl p-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold text-brand-primary flex items-center gap-2">
              <LogOut size={18} className="text-brand-danger" /> Clock Out & Shift Report
            </DialogTitle>
            <DialogDescription className="text-xs text-brand-muted mt-1">
              Please specify the reason for ending your shift.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-brand-secondary">Clock-out Reason *</Label>
              <Select value={clockOutReason} onValueChange={setClockOutReason}>
                <SelectTrigger className="h-9 bg-brand-bg border-brand-border text-brand-primary rounded-lg text-[13px]">
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent className="bg-brand-white border-brand-border rounded-xl text-[13px]">
                  <SelectItem value="Shift ended">Shift Ended</SelectItem>
                  <SelectItem value="Out for site visit">Out for Site Visit</SelectItem>
                  <SelectItem value="Customer meeting">Customer Meeting</SelectItem>
                  <SelectItem value="Out for short break">Short Break</SelectItem>
                  <SelectItem value="Personal errand">Personal Errand</SelectItem>
                  <SelectItem value="Other">Other / Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {clockOutReason === 'Other' && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <Label className="text-[12px] font-medium text-brand-secondary">Comments *</Label>
                <Textarea
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  className="bg-brand-bg border-brand-border rounded-lg text-[13px] min-h-[80px]"
                  placeholder="Enter details..."
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsClockOutOpen(false)} className="rounded-lg text-[13px] font-medium">Cancel</Button>
            <Button
              onClick={handleClockOutSubmit}
              disabled={clockOutMutation.isPending || (clockOutReason === 'Other' && !customReason.trim())}
              className="flex-1 bg-brand-danger hover:bg-red-600 text-white h-9 rounded-lg text-[13px] font-medium"
            >
              {clockOutMutation.isPending ? <Spinner size={14} /> : 'Confirm Checkout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
