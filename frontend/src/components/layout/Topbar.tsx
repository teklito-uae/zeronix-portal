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
import { Menu, Sun, Moon, LogOut, Settings, User, ChevronRight, Home, Search, ShoppingCart, Bell, UserCircle2 } from 'lucide-react';
import { CartDrawer } from '../portal/CartDrawer';
import { useCartStore } from '@/store/useCartStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const storeSegments = useBreadcrumbStore((s) => s.segments);
  const [searchOpen, setSearchOpen] = useState(false);
  const cartItems = useCartStore((s) => s.items);
  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const isCustomer = location.pathname.startsWith('/portal');
  const user = isCustomer ? customer : admin;
  const initTheme = useThemeStore((s) => s.initTheme);

  // Notifications logic (Both Admin and Customer)
  const { data: unreadNotifs } = useQuery({
    queryKey: ['unread-notifications', isCustomer ? 'customer' : 'admin'],
    queryFn: async () => {
      const endpoint = isCustomer ? '/customer/notifications/unread' : '/admin/notifications/unread';
      return (await api.get(endpoint)).data;
    },
    enabled: !!user,
    refetchInterval: 300000, // Poll every 5 minutes to reduce DB load
    refetchOnWindowFocus: true, // Fetch immediately when user switches back to tab
  });

  const [lastNotifCount, setLastNotifCount] = useState(0);

  useEffect(() => {
    if (unreadNotifs && unreadNotifs.length > lastNotifCount) {
      const newNotif = unreadNotifs[0];
      const notifUrl = isCustomer ? `/portal/${companySlug}/notifications` : '/admin/notifications';
      
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
            : `/admin/${baseParts.slice(0, i + 1).join('/')}`;
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
    navigate(isCustomer ? '/portal/login' : '/admin/login');
  };

  return (
    <header className="h-14 bg-admin-surface border-b border-admin-border flex items-center px-4 justify-between flex-shrink-0">
      {/* Left: Logo (mobile) / Menu toggle + Breadcrumbs (desktop) */}
      <div className="flex items-center gap-3">
        {/* Mobile: Show logo */}
        <div className="md:hidden">
          <Logo size="sm" showText />
        </div>
        {/* Desktop: Show sidebar toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="hidden md:flex h-8 w-8 text-admin-text-secondary hover:text-admin-text-primary hover:bg-admin-surface-hover"
        >
          <Menu size={18} />
        </Button>

        <nav className="hidden sm:flex items-center gap-1 text-sm">
          {/* Home icon */}
          <Link
            to={isCustomer ? `/portal/${companySlug}/dashboard` : '/admin/dashboard'}
            className="text-admin-text-muted hover:text-admin-text-primary transition-colors"
          >
            <Home size={13} />
          </Link>

          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight size={12} className="text-admin-text-muted/50" />
              {crumb.href ? (
                <Link
                  to={crumb.href}
                  className="text-admin-text-muted hover:text-admin-text-primary transition-colors text-sm"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-admin-text-primary font-medium text-sm">
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Right: Theme + Chat + User */}
      <div className="flex items-center gap-1.5">
        {/* Mobile Search icon */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSearchOpen(true)}
          className="md:hidden h-8 w-8 text-admin-text-secondary hover:text-admin-text-primary hover:bg-admin-surface-hover"
        >
          <Search size={17} />
        </Button>
        {/* Desktop search trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden md:flex items-center gap-2 h-8 px-3 rounded-md bg-admin-bg border border-admin-border text-admin-text-muted hover:border-zeronix-blue/40 hover:text-admin-text-primary transition-colors"
        >
          <Search size={13} />
          <span className="text-xs">Search…</span>
          <kbd className="ml-3 text-[10px] opacity-60 border border-admin-border rounded px-1 py-0.5 bg-admin-surface">⌘K</kbd>
        </button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(isCustomer ? `/portal/${companySlug}/notifications` : '/admin/notifications')}
            className="h-8 w-8 text-admin-text-secondary hover:text-admin-text-primary hover:bg-admin-surface-hover relative"
          >
            <Bell size={17} />
            {user && (unreadNotifs?.length || 0) > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 text-[8px] font-black text-white flex items-center justify-center rounded-full bg-red-500 border-2 border-admin-surface shadow-sm">
                {unreadNotifs.length}
              </span>
            )}
          </Button>


        {isCustomer && (
          <CartDrawer>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-admin-text-secondary hover:text-admin-text-primary hover:bg-admin-surface-hover relative group"
            >
              <ShoppingCart size={17} className="group-hover:scale-110 transition-transform" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-500 text-[10px] font-bold text-white flex items-center justify-center rounded-full border-2 border-admin-surface animate-in zoom-in">
                  {totalCartItems}
                </span>
              )}
            </Button>
          </CartDrawer>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => toggleTheme(isCustomer)}
          className="h-8 w-8 text-admin-text-secondary hover:text-admin-text-primary hover:bg-admin-surface-hover"
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 h-9 hover:bg-admin-surface-hover">
              <Avatar className="h-7 w-7 border border-admin-border">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`}
                  alt={user?.name}
                  className="h-full w-full object-cover"
                />
                <AvatarFallback className="bg-zeronix-blue text-white text-xs font-semibold">
                  {user?.name?.charAt(0) || (isCustomer ? 'C' : 'A')}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start leading-tight">
                {isCustomer ? (
                  <>
                    <span className="text-sm font-black text-emerald-500 uppercase tracking-tight">
                      {customer?.company || 'My Company'}
                    </span>
                    <span className="text-[10px] text-admin-text-muted font-bold flex items-center gap-1">
                      <UserCircle2 size={10} className="text-zeronix-blue" />
                      Account Mgr: {customer?.assigned_user?.name || 'Zeronix Sales'}
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-bold text-admin-text-primary">
                    {user?.name || 'Admin'}
                  </span>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-admin-surface border-admin-border">
            <DropdownMenuItem
              className="text-admin-text-secondary hover:bg-admin-surface-hover cursor-pointer text-sm"
              onClick={() => navigate(isCustomer ? `/portal/${companySlug}/profile` : '#')}
            >
              <User size={14} className="mr-2" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-admin-text-secondary hover:bg-admin-surface-hover cursor-pointer text-sm">
              <Settings size={14} className="mr-2" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-admin-border" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-danger hover:bg-admin-surface-hover cursor-pointer text-sm"
            >
              <LogOut size={14} className="mr-2" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
};
