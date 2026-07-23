import { getBasePath } from '@/hooks/useBasePath';
import { useThemeStore } from '@/store/useThemeStore';
import { useBreadcrumbStore } from '@/store/useBreadcrumbStore';
import { useTopbarActionsStore } from '@/store/useTopbarActionsStore';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Logo } from '@/components/shared/Logo';
import { useState, useEffect } from 'react';
import {
  ChevronRight,
  Home,
  Search,
  Sun,
  Moon,
  ShoppingCart,
  UserCircle2,
  Users,
  MessageSquareText,
  Handshake,
  FileText,
  ClipboardList,
  PackageCheck,
  Receipt,
  Truck,
  ShoppingCart as ShoppingCartIcon,
  Wallet,
  Package,
} from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';
import { NotificationBell } from './NotificationBell';
import { CartDrawer } from '../portal/CartDrawer';
import { useCartStore } from '@/store/useCartStore';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Static fallback breadcrumbs from URL when no store segments are set
const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  companies: 'Companies',
  contacts: 'Contacts',
  suppliers: 'Suppliers',
  products: 'Products',
  enquiries: 'Enquiries',
  quotes: 'Quotes',
  invoices: 'Invoices',
  'payment-receipts': 'Payment Receipts',
  users: 'Users',
  settings: 'Settings',
  activities: 'Activities',
};

export const Topbar = () => {
  const { theme, toggle: toggleTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const storeSegments = useBreadcrumbStore((s) => s.segments);
  const pageActions = useTopbarActionsStore((s) => s.actions);
  const [searchOpen, setSearchOpen] = useState(false);
  const cartItems = useCartStore((s) => s.items);
  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const isCustomer = location.pathname.startsWith('/portal');
  const initTheme = useThemeStore((s) => s.initTheme);

  useEffect(() => {
    initTheme(isCustomer);
  }, [isCustomer, initTheme]);

  const parts = location.pathname.split('/');
  const companySlug = isCustomer && parts.length > 2 ? parts[2] : 'company';
  const homePath = isCustomer ? `/portal/${companySlug}/dashboard` : `${getBasePath()}/dashboard`;



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

  return (
    <header className="flex items-center justify-between mb-2 flex-shrink-0 h-11">
      {/* Left: Logo (mobile) / Breadcrumbs (desktop) */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile: Show logo */}
        <div className="md:hidden">
          <Logo size="sm" showText />
        </div>

        {/* Breadcrumbs */}
          <nav className="hidden md:flex items-center gap-1.5 text-sm min-w-0">
            <Link
              to={homePath}
              className="flex items-center justify-center h-6 w-6 rounded-md text-brand-subtle hover:text-brand-accent hover:bg-brand-accent-light transition-colors shrink-0"
            >
              <Home size={13} />
            </Link>
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5 min-w-0">
                <ChevronRight size={13} className="text-brand-border shrink-0" />
                {crumb.href ? (
                  <Link
                    to={crumb.href}
                    className="flex items-center gap-2 text-[13px] font-medium text-brand-muted hover:text-brand-accent transition-colors"
                  >
                    <span className="truncate max-w-[160px]">{crumb.label}</span>
                    {crumb.badge}
                  </Link>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-brand-primary truncate max-w-[240px]">
                      {crumb.label}
                    </span>
                    {crumb.badge}
                  </div>
                )}
              </span>
            ))}
          </nav>
      </div>

      {/* Right: page-injected actions (desktop) + mobile-only utility icons (desktop equivalents live in the sidebar) */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {pageActions && (
          <div className="hidden md:flex items-center gap-2">
            {pageActions}
          </div>
        )}

        {/* Mobile utility icons */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-lg hover:bg-brand-white border border-transparent hover:border-brand-border transition-colors text-brand-muted hover:text-brand-secondary"
          >
            <Search size={16} />
          </button>

          <NotificationBell side="bottom" align="end" />

          {isCustomer && (
            <CartDrawer>
              <button className="p-2 rounded-lg hover:bg-brand-white border border-transparent hover:border-brand-border transition-colors text-brand-muted hover:text-brand-secondary relative">
                <ShoppingCart size={16} />
                {totalCartItems > 0 && (
                  <span className="absolute top-1 right-1 h-3 w-3 bg-brand-success text-[8px] font-bold text-brand-white flex items-center justify-center rounded-full shadow-sm">
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
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
};
