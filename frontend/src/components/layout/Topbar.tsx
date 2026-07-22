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

  // Section sub-navigation — mirrors the nav groups in Sidebar.tsx (CRM,
  // Sales, Purchasing, Management). Whichever group contains the active
  // route renders as an icon-tab row in place of breadcrumbs.
  const tabBasePath = isCustomer ? null : getBasePath();
  const tabGroups: { items: { id: string; label: string; icon: React.ReactNode; path: string }[] }[] = tabBasePath
    ? [
        {
          items: [
            { id: 'leads', label: 'Leads', icon: <UserCircle2 size={16} />, path: `${tabBasePath}/leads` },
            { id: 'companies', label: 'Companies', icon: <Users size={16} />, path: `${tabBasePath}/companies` },
            { id: 'contacts', label: 'Contacts', icon: <Users size={16} />, path: `${tabBasePath}/contacts` },
            { id: 'enquiries', label: 'Enquiries', icon: <MessageSquareText size={16} />, path: `${tabBasePath}/enquiries` },
            { id: 'deals', label: 'Deals', icon: <Handshake size={16} />, path: `${tabBasePath}/deals` },
          ],
        },
        {
          items: [
            { id: 'quotes', label: 'Quotes', icon: <FileText size={16} />, path: `${tabBasePath}/quotes` },
            { id: 'sales-orders', label: 'Sales Orders', icon: <ClipboardList size={16} />, path: `${tabBasePath}/sales-orders` },
            { id: 'deliveries', label: 'Deliveries', icon: <PackageCheck size={16} />, path: `${tabBasePath}/deliveries` },
            { id: 'invoices', label: 'Invoices', icon: <Receipt size={16} />, path: `${tabBasePath}/invoices` },
            { id: 'receipts', label: 'Payment Receipts', icon: <Receipt size={16} />, path: `${tabBasePath}/payment-receipts` },
          ],
        },
        {
          items: [
            { id: 'suppliers', label: 'Suppliers', icon: <Truck size={16} />, path: `${tabBasePath}/suppliers` },
            { id: 'purchases', label: 'Purchases', icon: <ShoppingCartIcon size={16} />, path: `${tabBasePath}/purchases` },
            { id: 'expenses', label: 'Expenses', icon: <Wallet size={16} />, path: `${tabBasePath}/expenses` },
          ],
        },
        {
          items: [
            { id: 'products', label: 'Products', icon: <Package size={16} />, path: `${tabBasePath}/products` },
            { id: 'users', label: 'Team', icon: <Users size={16} />, path: `${tabBasePath}/users` },
          ],
        },
      ]
    : [];
  const isTabItemActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');
  const activeTabGroup = tabGroups.find((group) => group.items.some((item) => isTabItemActive(item.path)));
  const activeTabItem = activeTabGroup?.items.find((item) => isTabItemActive(item.path));
  const isTabSection = Boolean(activeTabGroup);

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

        {/* Breadcrumbs, or section icon-tabs when on a page within one of the tab groups */}
        {isTabSection ? (
          <Tabs value={activeTabItem?.id} className="hidden sm:flex min-w-0">
            <TabsList className="bg-brand-accent-light p-1 h-8">
              {activeTabGroup!.items.map((item) => (
                <TabsTrigger
                  key={item.id}
                  value={item.id}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 text-brand-muted data-[state=active]:bg-brand-white data-[state=active]:text-brand-accent data-[state=active]:shadow-sm'
                  )}
                >
                  {item.icon}
                  <span className="hidden md:inline">{item.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        ) : (
          <nav className="hidden sm:flex items-center gap-1.5 text-sm min-w-0">
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
                    className="text-[13px] font-medium text-brand-muted hover:text-brand-accent transition-colors truncate max-w-[160px]"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-[13px] font-semibold text-brand-primary truncate max-w-[240px]">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}
      </div>

      {/* Right: page-injected actions (desktop) + mobile-only utility icons (desktop equivalents live in the sidebar) */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {pageActions && (
          <div className="hidden md:flex items-center gap-2">
            {pageActions}
          </div>
        )}

        <div className="flex md:hidden items-center gap-1">
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
