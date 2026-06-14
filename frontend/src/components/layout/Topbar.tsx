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
import { Menu, Sun, Moon, LogOut, Settings, User, ChevronRight, Home, Search, ShoppingCart, Bell, UserCircle2 } from 'lucide-react';
import { CartDrawer } from '../portal/CartDrawer';
import { useCartStore } from '@/store/useCartStore';
import { useQuery } from '@tanstack/react-query';
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

        <button
          onClick={() => navigate(isCustomer ? `/portal/${companySlug}/notifications` : `${getBasePath()}/notifications`)}
          className="p-2 rounded-lg hover:bg-brand-white border border-transparent hover:border-brand-border transition-colors text-brand-muted hover:text-brand-secondary relative"
        >
          <Bell size={16} />
          {user && (unreadNotifs?.length || 0) > 0 && (
            <span className="absolute top-1 right-1 h-3 w-3 text-[8px] font-bold text-brand-white flex items-center justify-center rounded-full bg-brand-danger shadow-sm">
              {unreadNotifs.length}
            </span>
          )}
        </button>

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
