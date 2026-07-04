import { getBasePath } from '@/hooks/useBasePath';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowRight, AlertCircle, LogIn, LogOut,
  Users, MessageSquare, FileText, Receipt, Package, DollarSign,
  Search, Bell, Sun, Moon, Mail, Calendar
} from 'lucide-react';
import { PageLoader } from '@/components/shared/PageLoader';
import { Spinner } from '@/components/shared/Spinner';

import {
  FcAreaChart, FcConferenceCall, FcCustomerSupport, FcDocument,
  FcRules, FcMoneyTransfer, FcPackage, FcShipped, FcPlanner,
  FcTimeline, FcReading
} from 'react-icons/fc';
import Avatar from 'boring-avatars';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ProductivitySuite } from '@/components/dashboard/ProductivitySuite';
import { useThemeStore } from '@/store/useThemeStore';
import { SEO } from '@/components/shared/SEO';

// ── Module Registry ───────────────────────────────────────────────────────────
const MODULE_REGISTRY: Record<string, any> = {
  dashboard: { label: 'Dashboard', icon: FcAreaChart, path: '/dashboard' },
  customers: { label: 'Customers', icon: FcConferenceCall, path: '/customers' },
  enquiries: { label: 'Enquiries', icon: FcCustomerSupport, path: '/enquiries' },
  quotes: { label: 'Quotes', icon: FcDocument, path: '/quotes' },
  invoices: { label: 'Invoices', icon: FcRules, path: '/invoices' },
  receipts: { label: 'Receipts', icon: FcMoneyTransfer, path: '/payment-receipts' },
  products: { label: 'Products', icon: FcPackage, path: '/products' },
  suppliers: { label: 'Suppliers', icon: FcShipped, path: '/suppliers' },
  attendance: { label: 'Attendance', icon: FcPlanner, path: '/attendance' },
  activities: { label: 'Activities', icon: FcTimeline, path: '/activities' },
  users: { label: 'Team', icon: FcReading, path: '/users' },
};

const PRODUCTIVITY_QUOTES = [
  "Success is not final; failure is not fatal. It is the courage to continue that counts.",
  "Your most unhappy customers are your greatest source of learning.",
  "Don't watch the clock; do what it does. Keep going.",
  "Quality means doing it right when no one is looking.",
  "Opportunities don't happen. You create them.",
  "The secret of getting ahead is getting started.",
  "Well done is better than well said.",
];

// ── Component ─────────────────────────────────────────────────────────────────
export const StaffDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const admin = useAuthStore(state => state.admin);
  const { theme, toggle } = useThemeStore();

  const randomQuote = useMemo(() => PRODUCTIVITY_QUOTES[Math.floor(Math.random() * PRODUCTIVITY_QUOTES.length)], []);

  const [now, setNow] = useState(new Date());
  const [isClockOutOpen, setIsClockOutOpen] = useState(false);
  const [clockOutReason, setClockOutReason] = useState('Shift ended');
  const [customReason, setCustomReason] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Sticky topbar: fires when app-icons sentinel scrolls past the top of #main-content
  useEffect(() => {
    const scroller = document.getElementById('main-content');
    if (!scroller) return;
    const onScroll = () => {
      const sentinel = sentinelRef.current;
      if (!sentinel) { setIsScrolled(scroller.scrollTop > 10); return; }
      const rect = sentinel.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      setIsScrolled(rect.top <= scrollerRect.top + 10);
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await api.get(`/admin/dashboard`)).data,
    refetchInterval: 60_000,
  });

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

  const fmt = (val: number) => val > 0 ? `${Number(val).toLocaleString(undefined, { minimumFractionDigits: 0 })} AED` : '0 AED';

  // ── Loading / Error ──────────────────────────────────────────────────────
  if (isLoading) return (
    <PageLoader label="Synchronizing data…" iconSize={28} className="min-h-[400px] gap-3" />
  );

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
      <AlertCircle className="text-brand-danger" size={36} />
      <p className="text-sm font-semibold text-brand-primary">Failed to load dashboard.</p>
      <p className="text-xs text-brand-danger">{error ? (error as any).message || String(error) : 'No data returned'}</p>
      <button onClick={() => window.location.reload()} className="text-xs text-zeronix-blue hover:underline font-medium">Retry</button>
    </div>
  );

  const { stats, points = {}, recent_activities = [] } = data;
  const isClockedIn = !!attendanceStatus?.active_attendance;
  const clockInTime = attendanceStatus?.active_attendance?.clock_in;
  const permissions = admin?.permissions || [];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col pb-10 animate-in fade-in duration-200">
      <SEO title="Dashboard" description="Staff workspace" />

      {/* ── TOPBAR (matches ResourceListingPage / staff/customers) ─────────── */}
      <div
        className={`sticky top-0 z-20 flex flex-col md:flex-row md:items-center justify-between px-4 md:px-5 py-3 md:py-4 gap-3 md:gap-0 border-b border-brand-border bg-brand-white flex-shrink-0 transition-all duration-200 ${isScrolled
          ? 'shadow-[0_2px_12px_rgba(0,0,0,0.08)] backdrop-blur-sm'
          : ''
          }`}
      >
        {/* Top Row on Mobile: Title + Notification Icons */}
        <div className="flex items-center justify-between w-full md:w-auto">
          {/* Left: Title */}
          <div className="flex items-center gap-4 md:gap-6">
            <h1 className="text-[16px] md:text-[18px] font-bold text-brand-primary flex items-center gap-2">
              Dashboard
            </h1>
          </div>

          {/* Mobile Right: Notification Icons */}
          <div className="flex md:hidden items-center gap-3">
            <button className="text-brand-subtle hover:text-brand-primary transition-colors" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}>
              <Search size={18} />
            </button>
            <button onClick={() => toggle()} className="text-brand-subtle hover:text-brand-primary transition-colors relative">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="text-brand-subtle hover:text-brand-primary transition-colors relative">
              <Bell size={18} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand-danger rounded-full border border-brand-white" />
            </button>
          </div>
        </div>

        {/* Desktop Search */}
        <div className="hidden md:flex relative w-80 items-center mx-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-subtle" size={14} />
          <div
            className="w-full h-[34px] bg-brand-surface border border-brand-border rounded-lg flex items-center pl-9 pr-3 text-[13px] text-brand-subtle cursor-pointer hover:bg-brand-bg transition-colors"
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          >
            <span className="flex-1 text-left truncate min-w-0">Search globally...</span>
            <kbd className="hidden sm:inline-block flex-shrink-0 text-[10px] bg-brand-white border border-brand-border rounded px-1.5 py-0.5 ml-2 font-mono text-brand-muted">⌘K</kbd>
          </div>
        </div>

        {/* Right Section: Desktop Icons */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-3 border-l border-brand-border/50 pl-4">
            <button className="text-brand-subtle hover:text-brand-primary transition-colors" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}>
              <Search size={18} />
            </button>
            <button onClick={() => toggle()} className="text-brand-subtle hover:text-brand-primary transition-colors relative">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="text-brand-subtle hover:text-brand-primary transition-colors">
              <Mail size={18} />
            </button>
            <button className="text-brand-subtle hover:text-brand-primary transition-colors">
              <Calendar size={18} />
            </button>
            <button className="text-brand-subtle hover:text-brand-primary transition-colors relative">
              <Bell size={18} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand-danger rounded-full border border-brand-white" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 1. WELCOME SECTION (emerald gradient, rounded top, no card) ──── */}
      <div
        className="w-full relative px-4 md:px-8 pt-8 md:pt-10 pb-12 md:pb-16"
        style={{
          background: 'linear-gradient(to bottom, #059669 0%, #10B981 30%, rgba(16,185,129,0.12) 80%, transparent 100%)',
          borderRadius: '0 0 0 0',
        }}
      >
        {/* Subtle top-left light wash */}
        <div
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 90% at 15% 10%, rgba(255,255,255,0.15) 0%, transparent 65%)' }}
        />

        {/* Dot pattern overlay blending into the gradient */}
        <div
          className="absolute inset-0 pointer-events-none opacity-80"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1.5' fill='%23ffffff' fill-opacity='0.25'/%3E%3C/svg%3E")`,
            maskImage: 'linear-gradient(to bottom, black 10%, transparent 70%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 10%, transparent 70%)'
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6 md:gap-8">
          {/* Left: Avatar + greeting + quote */}
          <div className="flex items-center gap-4 md:gap-5">
            <div className="shrink-0 scale-90 md:scale-100 origin-left">
              <Avatar
                size={72}
                name={admin?.name || 'User'}
                variant="beam"
                colors={['#fdfcdc', '#fed9b7', '#f07167', '#00afb9', '#0081a7']}
              />
            </div>
            <div>
              <p className="text-emerald-100/70 text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.12em] mb-1">Welcome back</p>
              <h1 className="text-[24px] md:text-[28px] font-bold text-white leading-tight tracking-tight drop-shadow-sm">
                {admin?.name}
              </h1>
              <p className="text-white/65 text-[11px] md:text-[12px] mt-1 md:mt-2 max-w-[360px] italic leading-relaxed">
                &ldquo;{randomQuote}&rdquo;
              </p>
            </div>
          </div>

          {/* Right: Digital clock + clock-in/out */}
          <div className="flex flex-col items-center md:items-end gap-3 md:gap-4 w-full md:w-auto bg-black/10 md:bg-transparent rounded-2xl md:rounded-none p-5 md:p-0 border border-white/5 md:border-none backdrop-blur-sm md:backdrop-blur-none">
            {/* Digital clock display — no card, raw text */}
            <div className="text-center md:text-right w-full">
              <p className="text-[10px] md:text-[11px] uppercase tracking-[0.15em] text-white/60 font-semibold mb-1">
                {isClockedIn ? 'Session Active' : now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })}
              </p>
              <p
                className="text-[36px] md:text-[48px] font-bold leading-none text-white tracking-tighter"
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

            {/* Clock In / Out button */}
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

      {/* ── 2. CIRCULAR APP ICONS (centered) — sentinel for sticky trigger ── */}
      <div ref={sentinelRef} className="flex flex-wrap items-center justify-center gap-3 md:gap-5 py-5 px-2 md:px-6">
        {permissions.slice(0, 8).map((perm: string) => {
          const mod = MODULE_REGISTRY[perm];
          if (!mod) return null;
          const Icon = mod.icon;
          return (
            <button
              key={perm}
              onClick={() => navigate(`${getBasePath()}${mod.path}`)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="h-14 w-14 flex items-center justify-center rounded-full bg-brand-white border border-brand-border hover:border-brand-accent/40 hover:bg-brand-surface transition-all duration-150">
                <Icon size={28} />
              </div>
              <span className="text-[11px] font-medium text-brand-muted group-hover:text-brand-primary transition-colors">{mod.label}</span>
            </button>
          );
        })}
        {permissions.length > 8 && (
          <div className="flex flex-col items-center gap-1.5 group cursor-pointer">
            <div className="h-14 w-14 flex items-center justify-center rounded-full bg-brand-surface border border-brand-border hover:border-brand-border-strong transition-all">
              <span className="text-[18px] font-bold text-brand-muted">+{permissions.length - 8}</span>
            </div>
            <span className="text-[11px] font-medium text-brand-muted group-hover:text-brand-primary transition-colors">More</span>
          </div>
        )}
      </div>

      {/* ── 5. PRODUCTIVITY SUITE (Tasks / Activity / Notes) ─────────────── */}
      <div className="px-2 md:px-6 mt-5">
        <ProductivitySuite activities={recent_activities} />
      </div>

      {/* ── Clock Out Dialog ─────────────────────────────────────────────── */}
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
    </div>
  );
};
