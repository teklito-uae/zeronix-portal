import { getBasePath } from '@/hooks/useBasePath';
import { useSidebarStore } from '@/store/useSidebarStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useBreadcrumbStore } from '@/store/useBreadcrumbStore';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Logo } from '@/components/shared/Logo';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { GlobalSearch } from './GlobalSearch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Menu, Sun, Moon, LogOut, Settings, User, ChevronRight, Home, Search, ShoppingCart, Bell, UserCircle2, Mail, MailOpen, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { CartDrawer } from '../portal/CartDrawer';
import { useCartStore } from '@/store/useCartStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';


// Static fallback breadcrumbs from URL when no store segments are set
const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  customers: 'Customers',
  suppliers: 'Suppliers',
  products: 'Products',
  enquiries: 'Enquiries',
  quotes: 'Quotes',
  invoices: 'Invoices',
  'payment-receipts': 'Payment Receipts',
  users: 'Users',
  settings: 'Settings',
  activities: 'Activities',
  chat: 'Chat',
  'bulk-import': 'Bulk Import',
};

export const Topbar = () => {
  const { toggle } = useSidebarStore();
  const { theme, toggle: toggleTheme } = useThemeStore();
  const admin = useAuthStore((s) => s.admin);
  const customer = useAuthStore((s) => s.customer);
  const navigate = useNavigate();
  const location = useLocation();
  const storeSegments = useBreadcrumbStore((s) => s.segments);
  const [searchOpen, setSearchOpen] = useState(false);
  const cartItems = useCartStore((s) => s.items);
  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const queryClient = useQueryClient();
  const isCustomer = location.pathname.startsWith('/portal');
  const user = isCustomer ? customer : admin;
  const initTheme = useThemeStore((s) => s.initTheme);

  // Notifications logic (Both Admin and Customer)
  const { data: unreadNotifs } = useQuery({
    queryKey: ['unread-notifications', isCustomer ? 'customer' : 'admin'],
    queryFn: async () => {
      const endpoint = isCustomer ? '/customer/notifications/unread' : `${getBasePath()}/notifications/unread`;
      return (await api.get(endpoint)).data;
    },
    enabled: !!user,
    refetchInterval: 600000, // Poll every 10 minutes to reduce DB load
    staleTime: 600000, // Consider data fresh for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch when switching tabs
    refetchOnMount: false, // Don't refetch every time the component remounts
  });

  const [lastNotifCount, setLastNotifCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: allNotifs } = useQuery({
    queryKey: ['topbar-notifications', isCustomer ? 'customer' : 'admin'],
    queryFn: async () => {
      const endpoint = isCustomer ? '/customer/notifications' : `${getBasePath()}/notifications`;
      return (await api.get(endpoint)).data;
    },
    enabled: !!user && notifOpen,
    staleTime: 30000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => {
      const endpoint = isCustomer ? '/customer/notifications/mark-read' : `${getBasePath()}/notifications/mark-read`;
      return api.post(endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['topbar-notifications'] });
      toast.success('All notifications marked as read');
    },
  });

  const markOneReadMutation = useMutation({
    mutationFn: (id: string) => {
      const endpoint = isCustomer ? `/customer/notifications/${id}/mark-read` : `${getBasePath()}/notifications/${id}/mark-read`;
      return api.post(endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['topbar-notifications'] });
    },
  });

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />;
      case 'error':   return <AlertTriangle size={14} className="text-red-500 shrink-0" />;
      case 'warning': return <AlertTriangle size={14} className="text-amber-500 shrink-0" />;
      default:        return <Bell size={14} className="text-brand-accent shrink-0" />;
    }
  };

  useEffect(() => {
    if (unreadNotifs && unreadNotifs.length > lastNotifCount) {
      const newNotif = unreadNotifs[0];
      const notifUrl = isCustomer ? `/portal/${companySlug}/notifications` : `${getBasePath()}/notifications`;
      
      toast(newNotif.data?.title || 'New Notification', {
        description: newNotif.data?.message || 'You have a new message.',
        position: 'bottom-right',
        action: {
          label: 'View',
          onClick: () => navigate(newNotif.data?.action_url || notifUrl)
        }
      });
      setLastNotifCount(unreadNotifs.length);
    } else if (unreadNotifs) {
      setLastNotifCount(unreadNotifs.length);
    }
  }, [unreadNotifs, lastNotifCount, navigate]);



  useEffect(() => {
    initTheme(isCustomer);
  }, [isCustomer, initTheme]);

  const parts = location.pathname.split('/');
  const companySlug = isCustomer && parts.length > 2 ? parts[2] : 'company';

  // Ctrl+K / Cmd+K to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Build breadcrumbs: use store if set, else derive from URL
  const breadcrumbs = storeSegments.length > 0
    ? storeSegments
    : (() => {
        const segments = parts.filter(Boolean);
        const baseParts = isCustomer ? segments.slice(2) : segments.slice(1); // skip "admin" or "portal/company"
        return baseParts.map((seg, i) => {
          const href = isCustomer
            ? `/portal/${companySlug}/${baseParts.slice(0, i + 1).join('/')}`
            : `${getBasePath()}/${baseParts.slice(0, i + 1).join('/')}`;
          return {
            label: routeLabels[seg] ?? (seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ')),
            href: i < baseParts.length - 1 ? href : undefined, // last segment is current page — no link
          };
        });
      })();

  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout(isCustomer ? 'customer' : 'admin');
    toast.success('Logged out successfully');
    navigate(isCustomer ? '/portal/login' : `${getBasePath()}/login`);
  };

  return (
    <header className="flex items-center justify-between mb-2 flex-shrink-0">
      {/* Left: Logo (mobile) / Menu toggle + Breadcrumbs (desktop) */}
      <div className="flex items-center gap-3">
        {/* Mobile: Show logo */}
        <div className="md:hidden">
          <Logo size="sm" showText />
        </div>
        {/* Desktop: Show sidebar toggle */}
        <button
          onClick={toggle}
          className="hidden md:flex p-2 rounded-lg hover:bg-brand-white border border-transparent hover:border-brand-border transition-colors text-brand-muted hover:text-brand-secondary"
        >
          <Menu size={16} />
        </button>

        <nav className="hidden sm:flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <ChevronRight size={14} className="text-brand-subtle" />}
              {crumb.href ? (
                <Link
                  to={crumb.href}
                  className="text-brand-muted hover:text-brand-secondary transition-colors text-[14px]"
                >
                  {crumb.label}
                </Link>
              ) : (
                <h1 className="text-[20px] font-semibold text-brand-primary">
                  {crumb.label}
                </h1>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Right: Theme + Chat + User */}
      <div className="flex items-center gap-2">
        {/* Mobile Search icon */}
        <button
          onClick={() => setSearchOpen(true)}
          className="md:hidden p-2 rounded-lg hover:bg-brand-white border border-transparent hover:border-brand-border transition-colors text-brand-muted hover:text-brand-secondary"
        >
          <Search size={16} />
        </button>
        
        {/* Desktop search trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden md:flex items-center gap-2 bg-brand-white border border-brand-border rounded-lg px-3 py-1.5 w-64 hover:border-brand-border-strong transition-colors"
        >
          <Search size={14} className="text-brand-subtle" />
          <span className="text-[13px] text-brand-subtle flex-1 text-left">Search...</span>
          <kbd className="text-[10px] text-brand-subtle bg-brand-surface px-1.5 py-0.5 rounded">⌘K</kbd>
        </button>

        {/* Notification Popover */}
        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <PopoverTrigger asChild>
            <button className="p-2 rounded-lg hover:bg-brand-white border border-transparent hover:border-brand-border transition-colors text-brand-muted hover:text-brand-secondary relative">
              <Mail size={16} />
              {user && (unreadNotifs?.length || 0) > 0 && (
                <span className="absolute top-1 right-1 h-3 w-3 text-[8px] font-bold text-brand-white flex items-center justify-center rounded-full bg-brand-danger shadow-sm">
                  {unreadNotifs.length}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[360px] p-0 bg-brand-white border border-brand-border shadow-xl rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border bg-brand-surface">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-brand-accent" />
                <span className="text-[13px] font-bold text-brand-primary">Notifications</span>
                {(unreadNotifs?.length || 0) > 0 && (
                  <span className="bg-brand-danger text-brand-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    {unreadNotifs.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {(unreadNotifs?.length || 0) > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    className="text-[11px] font-bold text-brand-accent hover:opacity-70 transition-opacity flex items-center gap-1"
                  >
                    <MailOpen size={12} /> Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-brand-border">
              {!allNotifs?.notifications?.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center mb-3">
                    <Bell size={22} className="text-brand-subtle/40" />
                  </div>
                  <p className="text-[12px] font-bold text-brand-subtle">No notifications yet</p>
                  <p className="text-[11px] text-brand-muted mt-0.5">You're all caught up!</p>
                </div>
              ) : (
                allNotifs.notifications.slice(0, 5).map((notif: any) => (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-brand-surface transition-colors group ${
                      !notif.read_at ? 'bg-brand-accent/5 border-l-2 border-l-brand-accent' : ''
                    }`}
                  >
                    <div className="mt-0.5">{getNotifIcon(notif.data?.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] font-semibold truncate ${
                        !notif.read_at ? 'text-brand-primary' : 'text-brand-secondary'
                      }`}>
                        {notif.data?.title || 'Notification'}
                      </p>
                      <p className="text-[11px] text-brand-muted leading-snug mt-0.5 line-clamp-2">
                        {notif.data?.message}
                      </p>
                      <p className="text-[10px] text-brand-subtle mt-1">
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {notif.data?.action_url && (
                        <button
                          onClick={() => { navigate(notif.data.action_url); setNotifOpen(false); }}
                          className="text-brand-accent hover:opacity-70 transition-opacity"
                          title="View"
                        >
                          <ExternalLink size={13} />
                        </button>
                      )}
                      {!notif.read_at && (
                        <button
                          onClick={() => markOneReadMutation.mutate(notif.id)}
                          className="text-[9px] font-bold text-brand-subtle hover:text-brand-primary transition-colors opacity-0 group-hover:opacity-100"
                          title="Mark as read"
                        >
                          <CheckCircle2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-brand-border bg-brand-surface">
              <button
                onClick={() => { navigate(isCustomer ? `/portal/${companySlug}/notifications` : `${getBasePath()}/notifications`); setNotifOpen(false); }}
                className="w-full text-[12px] font-bold text-brand-accent hover:opacity-70 transition-opacity flex items-center justify-center gap-1.5"
              >
                View more <ExternalLink size={12} />
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {isCustomer && (
          <CartDrawer>
            <button
              className="p-2 rounded-lg hover:bg-brand-white border border-transparent hover:border-brand-border transition-colors text-brand-muted hover:text-brand-secondary relative group"
            >
              <ShoppingCart size={16} className="group-hover:scale-110 transition-transform" />
              {totalCartItems > 0 && (
                <span className="absolute top-1 right-1 h-3 w-3 bg-brand-success text-[8px] font-bold text-brand-white flex items-center justify-center rounded-full shadow-sm animate-in zoom-in">
                  {totalCartItems}
                </span>
              )}
            </button>
          </CartDrawer>
        )}

        <button
          onClick={() => toggleTheme(isCustomer)}
          className="p-2 rounded-lg hover:bg-brand-white border border-transparent hover:border-brand-border transition-colors text-brand-muted hover:text-brand-secondary"
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
};
