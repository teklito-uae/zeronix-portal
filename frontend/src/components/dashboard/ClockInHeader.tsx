import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useState, useEffect, useMemo } from 'react';
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

const PRODUCTIVITY_QUOTES = [
  "Success is not final; failure is not fatal. It is the courage to continue that counts.",
  "Your most unhappy customers are your greatest source of learning.",
  "Don't watch the clock; do what it does. Keep going.",
  "Quality means doing it right when no one is looking.",
  "Opportunities don't happen. You create them.",
  "The secret of getting ahead is getting started.",
  "Well done is better than well said.",
];

// Staff-only clock in/out widget, extracted from the former standalone
// StaffDashboard so it can be embedded inside the merged Dashboard instead
// of replacing it entirely.
export const ClockInHeader = () => {
  const queryClient = useQueryClient();
  const admin = useAuthStore(state => state.admin);

  const randomQuote = useMemo(() => PRODUCTIVITY_QUOTES[Math.floor(Math.random() * PRODUCTIVITY_QUOTES.length)], []);

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
      <div
        className="w-full relative rounded-xl border border-brand-border overflow-hidden px-4 md:px-8 pt-8 md:pt-10 pb-8 md:pb-10 shadow-sm"
        style={{
          background: 'linear-gradient(to bottom, #059669 0%, #10B981 30%, rgba(16,185,129,0.12) 80%, transparent 100%)',
        }}
      >
        <div
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 90% at 15% 10%, rgba(255,255,255,0.15) 0%, transparent 65%)' }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-80"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1.5' fill='%23ffffff' fill-opacity='0.25'/%3E%3C/svg%3E")`,
            maskImage: 'linear-gradient(to bottom, black 10%, transparent 70%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 10%, transparent 70%)'
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6 md:gap-8">
          <div className="flex items-center gap-4 md:gap-5">
            <div className="shrink-0 scale-90 md:scale-100 origin-left">
              <Avatar size={64} name={admin?.name || 'User'} variant="beam" colors={['#fdfcdc', '#fed9b7', '#f07167', '#00afb9', '#0081a7']} />
            </div>
            <div>
              <p className="text-emerald-100/70 text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.12em] mb-1">Welcome back</p>
              <h1 className="text-[22px] md:text-[26px] font-bold text-white leading-tight tracking-tight drop-shadow-sm">
                {admin?.name}
              </h1>
              <p className="text-white/65 text-[11px] md:text-[12px] mt-1 md:mt-2 max-w-[360px] italic leading-relaxed">
                &ldquo;{randomQuote}&rdquo;
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-3 md:gap-4 w-full md:w-auto bg-black/10 md:bg-transparent rounded-2xl md:rounded-none p-5 md:p-0 border border-white/5 md:border-none backdrop-blur-sm md:backdrop-blur-none">
            <div className="text-center md:text-right w-full">
              <p className="text-[10px] md:text-[11px] uppercase tracking-[0.15em] text-white/60 font-semibold mb-1">
                {isClockedIn ? 'Session Active' : now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })}
              </p>
              <p
                className="text-[32px] md:text-[42px] font-bold leading-none text-white tracking-tighter"
                style={{ fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", monospace', textShadow: '0 2px 20px rgba(0,0,0,0.2)' }}
              >
                {isClockedIn
                  ? formatTimer(clockInTime)
                  : now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </p>
              {isClockedIn && (
                <p className="text-[10px] md:text-[11px] text-white/50 mt-1.5 font-mono">
                  {now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
              )}
            </div>

            {isClockedIn ? (
              <button
                onClick={() => setIsClockOutOpen(true)}
                disabled={clockOutMutation.isPending}
                className="w-full md:w-auto justify-center group flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white font-semibold text-[13px] px-6 py-3 md:py-2.5 rounded-xl transition-all duration-150 disabled:opacity-60 shadow-lg shadow-red-900/30"
              >
                <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
                Clock Out
              </button>
            ) : (
              <button
                onClick={() => clockInMutation.mutate()}
                disabled={clockInMutation.isPending}
                className="w-full md:w-auto justify-center group flex items-center gap-2 bg-white text-emerald-700 font-semibold text-[13px] px-6 py-3 md:py-2.5 rounded-xl hover:bg-emerald-50 transition-all duration-150 disabled:opacity-60 shadow-lg shadow-emerald-900/20"
              >
                {clockInMutation.isPending
                  ? <Spinner size={16} />
                  : <LogIn size={16} className="group-hover:-translate-x-0.5 transition-transform" />}
                Clock In
              </button>
            )}
          </div>
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
