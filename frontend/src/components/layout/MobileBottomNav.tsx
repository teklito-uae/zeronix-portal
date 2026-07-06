import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { getBasePath } from '@/hooks/useBasePath';

import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  MessageSquareText,
  FileText,
  Receipt,
  Settings,
  Activity,
  Menu,
  X,
  ChevronRight,
  Clock,
  ShoppingCart,
  Wallet,
  BarChart3,
  ClipboardList,
  PackageCheck,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path: string;
  adminOnly?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// Primary bottom tabs — the 4 most used + Menu hamburger
const getAdminPrimaryTabs = (basePath: string) => [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard, path: `${basePath}/dashboard` },
  { id: 'enquiries', label: 'Enquiries', icon: MessageSquareText, path: `${basePath}/enquiries` },
  { id: 'quotes', label: 'Quotes', icon: FileText, path: `${basePath}/quotes` },
  { id: 'invoices', label: 'Invoices', icon: Receipt, path: `${basePath}/invoices` },
];

const getCustomerPrimaryTabs = (slug: string) => [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard, path: `/portal/${slug}/dashboard` },
  { id: 'products', label: 'Catalog', icon: Package, path: `/portal/${slug}/products` },
  { id: 'enquiries', label: 'Requests', icon: MessageSquareText, path: `/portal/${slug}/enquiries` },
  { id: 'quotes', label: 'Quotes', icon: FileText, path: `/portal/${slug}/quotes` },
];

// Full grouped navigation for the drawer
const getAdminDrawerGroups = (basePath: string): NavGroup[] => [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: `${basePath}/dashboard` },
    ],
  },
  {
    label: 'CRM',
    items: [
      { id: 'crm-dashboard', label: 'CRM Dashboard', icon: BarChart3, path: `${basePath}/crm-dashboard` },
      { id: 'leads', label: 'Leads', icon: Users, path: `${basePath}/leads` },
      { id: 'customers', label: 'Customers', icon: Users, path: `${basePath}/customers` },
      { id: 'enquiries', label: 'Enquiries', icon: MessageSquareText, path: `${basePath}/enquiries` },
    ],
  },
  {
    label: 'Management',
    items: [
      { id: 'suppliers', label: 'Suppliers', icon: Truck, path: `${basePath}/suppliers` },
      { id: 'products', label: 'Products', icon: Package, path: `${basePath}/products` },
      { id: 'users', label: 'Team', icon: Users, path: `${basePath}/users`, adminOnly: true },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'quotes', label: 'Quotes', icon: FileText, path: `${basePath}/quotes` },
      { id: 'sales-orders', label: 'Sales Orders', icon: ClipboardList, path: `${basePath}/sales-orders` },
      { id: 'deliveries', label: 'Deliveries', icon: PackageCheck, path: `${basePath}/deliveries` },
      { id: 'invoices', label: 'Invoices', icon: Receipt, path: `${basePath}/invoices` },
      { id: 'receipts', label: 'Payment Receipts', icon: Receipt, path: `${basePath}/payment-receipts` },
      { id: 'purchases', label: 'Purchases', icon: ShoppingCart, path: `${basePath}/purchases` },
      { id: 'expenses', label: 'Expenses', icon: Wallet, path: `${basePath}/expenses` },
    ],
  },
  {
    label: 'Insights',
    items: [
      { id: 'reports', label: 'Reports', icon: BarChart3, path: `${basePath}/reports` },
    ],
  },
  {
    label: 'Workforce',
    items: [
      { id: 'attendance', label: 'Attendance', icon: Clock, path: `${basePath}/attendance`, adminOnly: true },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'activities', label: 'Activities', icon: Activity, path: `${basePath}/activities`, adminOnly: true },
      { id: 'settings', label: 'Settings', icon: Settings, path: `${basePath}/settings` },
    ],
  },
];

const getCustomerDrawerGroups = (slug: string): NavGroup[] => [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: `/portal/${slug}/dashboard` },
    ],
  },
  {
    label: 'Purchasing',
    items: [
      { id: 'products', label: 'Products', icon: Package, path: `/portal/${slug}/products` },
      { id: 'enquiries', label: 'My Enquiries', icon: MessageSquareText, path: `/portal/${slug}/enquiries` },
      { id: 'quotes', label: 'Quotes', icon: FileText, path: `/portal/${slug}/quotes` },
      { id: 'invoices', label: 'Invoices', icon: Receipt, path: `/portal/${slug}/invoices` },
    ],
  },
];

export const MobileBottomNav = ({ isVisible = true }: { isVisible?: boolean }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const adminUser = useAuthStore((s) => s.admin);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrollHidden, setScrollHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const scroller = document.getElementById('main-content');
    if (!scroller) return;
    const onScroll = () => {
      const current = scroller.scrollTop;
      const diff = current - lastScrollY.current;
      if (diff < -8) {
        // Scrolling UP → hide the nav
        setScrollHidden(true);
      } else if (diff > 4) {
        // Scrolling DOWN → show the nav
        setScrollHidden(false);
      }
      lastScrollY.current = current;
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, []);

  const isCustomer = location.pathname.startsWith('/portal');
  const parts = location.pathname.split('/');
  const companySlug = isCustomer && parts.length > 2 ? parts[2] : 'company';

  const basePath = getBasePath();
  const primaryTabs = isCustomer ? getCustomerPrimaryTabs(companySlug) : getAdminPrimaryTabs(basePath);
  const drawerGroups = isCustomer ? getCustomerDrawerGroups(companySlug) : getAdminDrawerGroups(basePath);

  // Filter admin-only items based on role & permissions
  const filteredGroups = isCustomer ? drawerGroups : drawerGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (adminUser?.role === 'admin') return true;
      if (item.id === 'dashboard') return true;
      if (item.id === 'settings') return true;
      return adminUser?.permissions?.includes(item.id);
    })
  })).filter(group => group.items.length > 0);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  // Check if current page is any non-primary page (to highlight "Menu" tab)
  const isMenuActive = !primaryTabs.some(tab => isActive(tab.path));

  return (
    <>
      {/* Bottom Tab Bar */}
      <nav className={cn(
        "md:hidden fixed bottom-4 left-4 right-4 z-50 bg-brand-white/85 backdrop-blur-xl border border-brand-border/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-transform duration-300",
        !isVisible || scrollHidden ? "translate-y-[150%]" : "translate-y-0"
      )}>
        <div className="flex items-center justify-around h-16 px-1">
          {primaryTabs.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-150 relative',
                  active ? 'text-zeronix-blue' : 'text-admin-text-muted'
                )}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-zeronix-blue rounded-full" />
                )}
                <Icon size={22} className={active ? 'scale-110 transition-transform' : 'transition-transform'} />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </button>
            );
          })}
          
          {/* Hamburger Menu Tab */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-150 relative',
              isMenuActive || drawerOpen ? 'text-zeronix-blue' : 'text-admin-text-muted'
            )}
          >
            {(isMenuActive || drawerOpen) && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-zeronix-blue rounded-full" />
            )}
            <Menu size={22} />
            <span className="text-[10px] font-semibold">More</span>
          </button>
        </div>
      </nav>

      {/* Drawer Overlay */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-200"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Navigation Drawer — slides from bottom */}
      <div className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-[70] bg-admin-surface rounded-t-2xl border-t border-admin-border transition-transform duration-300 ease-out flex flex-col",
        drawerOpen ? "translate-y-0" : "translate-y-full"
      )} style={{ maxHeight: '85dvh' }}>
        {/* Header Section (Fixed) */}
        <div className="shrink-0">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-admin-border rounded-full" />
          </div>
          <div className="flex items-center justify-between px-5 pb-3">
            <h3 className="text-base font-bold text-admin-text-primary">Navigation</h3>
            <button
              onClick={() => setDrawerOpen(false)}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-admin-text-muted hover:bg-admin-surface-hover hover:text-admin-text-primary transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <Separator className="bg-admin-border" />
        </div>

        {/* Grouped Navigation (Scrollable) */}
        <div className="flex-1 overflow-y-auto touch-scroll overscroll-contain scrollbar-green">
          <div className="p-4 space-y-6 pb-16">
            {filteredGroups.map((group) => (
              <div key={group.label}>
                <p className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-admin-text-muted">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item.path);
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          setDrawerOpen(false);
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 h-12 px-3 rounded-xl transition-all duration-150',
                          active
                            ? 'bg-zeronix-blue text-white shadow-sm'
                            : 'text-admin-text-secondary hover:bg-admin-surface-hover'
                        )}
                      >
                        <Icon size={20} />
                        <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                        <ChevronRight size={14} className={active ? 'text-white/60' : 'text-admin-text-muted/50'} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
