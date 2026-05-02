import { useLocation, useNavigate } from 'react-router-dom';
import { useSidebarStore } from '@/store/useSidebarStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Logo } from '@/components/shared/Logo';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  MessageSquareText,
  FileText,
  Receipt,
  MessageCircle,
  ChevronsLeft,
  ChevronsRight,
  Upload,
  Settings,
  Activity,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  adminOnly?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const getAdminNavGroups = (basePath: string): NavGroup[] => [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: `${basePath}/dashboard` },
    ],
  },
  {
    label: 'Management',
    items: [
      { id: 'customers', label: 'Customers', icon: <Users size={18} />, path: `${basePath}/customers` },
      { id: 'suppliers', label: 'Suppliers', icon: <Truck size={18} />, path: `${basePath}/suppliers` },
      { id: 'products', label: 'Products', icon: <Package size={18} />, path: `${basePath}/products` },
      { id: 'users', label: 'Team', icon: <Users size={18} />, path: `${basePath}/users`, adminOnly: true },
      { id: 'bulk-import', label: 'Bulk Import', icon: <Upload size={18} />, path: `${basePath}/bulk-import`, adminOnly: true },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'enquiries', label: 'Enquiries', icon: <MessageSquareText size={18} />, path: `${basePath}/enquiries` },
      { id: 'quotes', label: 'Quotes', icon: <FileText size={18} />, path: `${basePath}/quotes` },
      { id: 'invoices', label: 'Invoices', icon: <Receipt size={18} />, path: `${basePath}/invoices` },
      { id: 'receipts', label: 'Payment Receipts', icon: <Receipt size={18} />, path: `${basePath}/payment-receipts` },
    ],
  },
  {
    label: 'Communication',
    items: [
      { id: 'chat', label: 'Chat', icon: <MessageCircle size={18} />, path: `${basePath}/chat` },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'activities', label: 'Activities', icon: <Activity size={18} />, path: `${basePath}/activities`, adminOnly: true },
      { id: 'settings', label: 'Settings', icon: <Settings size={18} />, path: `${basePath}/settings` },
    ],
  },
];

const getCustomerNavGroups = (companySlug: string): NavGroup[] => [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: `/portal/${companySlug}/dashboard` },
    ],
  },
  {
    label: 'Purchasing',
    items: [
      { id: 'products', label: 'Products', icon: <Package size={18} />, path: `/portal/${companySlug}/products` },
      { id: 'my-enquiries', label: 'My Enquiries', icon: <MessageSquareText size={18} />, path: `/portal/${companySlug}/enquiries` },
      { id: 'quotes', label: 'Quotes', icon: <FileText size={18} />, path: `/portal/${companySlug}/quotes` },
      { id: 'invoices', label: 'Invoices', icon: <Receipt size={18} />, path: `/portal/${companySlug}/invoices` },
    ],
  },
  {
    label: 'Communication',
    items: [
      { id: 'chat', label: 'Chat Support', icon: <MessageCircle size={18} />, path: `/portal/${companySlug}/chat` },
    ],
  },
];

export const Sidebar = () => {
  const { isOpen, toggle } = useSidebarStore();
  const adminUser = useAuthStore((state) => state.admin);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isCustomer = location.pathname.startsWith('/portal');
  
  // Extract company slug from /portal/:slug/xxx
  const parts = location.pathname.split('/');
  const companySlug = isCustomer && parts.length > 2 ? parts[2] : 'company';

  // Filter groups based on permissions
  const filterAdminGroups = () => {
    if (!adminUser) return [];
    const basePath = adminUser.role === 'salesman' ? '/staff' : '/admin';
    const groups = getAdminNavGroups(basePath);
    if (adminUser.role === 'admin') return groups;

    return groups.map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (item.adminOnly) return false;
        if (item.id === 'dashboard') return true; // Everyone sees dashboard
        if (item.id === 'chat') return true; // Chat is generic
        if (item.id === 'settings') return true; // Settings is for personal config
        return adminUser.permissions?.includes(item.id);
      })
    })).filter(group => group.items.length > 0);
  };

  const navGroups = isCustomer ? getCustomerNavGroups(companySlug) : filterAdminGroups();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'hidden md:flex flex-col bg-admin-sidebar-bg border-r border-admin-border transition-all duration-200 ease-out flex-shrink-0',
          isOpen ? 'w-60' : 'w-16'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center border-b border-admin-border px-6 flex-shrink-0 overflow-hidden">
          <Logo size={isOpen ? 'md' : 'lg'} showText={isOpen} />
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-6 px-2">
            {navGroups.map((group) => (
              <div key={group.label}>
                {/* Group Label */}
                {isOpen && (
                  <p className="px-3 mb-2 text-[11px] font-medium uppercase tracking-wider text-admin-text-muted">
                    {group.label}
                  </p>
                )}
                {!isOpen && <Separator className="mb-2 bg-admin-border" />}

                {/* Nav Items */}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = isActive(item.path);
                    const button = (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={cn(
                          'w-full flex items-center gap-3 rounded-lg transition-all duration-150 ease-out',
                          isOpen ? 'h-[38px] px-3 mx-1' : 'h-[38px] justify-center mx-auto',
                          active
                            ? 'bg-zeronix-blue text-white shadow-sm'
                            : 'text-admin-text-secondary hover:bg-admin-surface-hover hover:text-admin-text-primary'
                        )}
                      >
                        <span className="flex-shrink-0">{item.icon}</span>
                        {isOpen && (
                          <span className="text-sm font-medium truncate">{item.label}</span>
                        )}
                      </button>
                    );

                    if (!isOpen) {
                      return (
                        <Tooltip key={item.path}>
                          <TooltipTrigger asChild>{button}</TooltipTrigger>
                          <TooltipContent side="right" className="bg-admin-surface text-admin-text-primary border-admin-border">
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return button;
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Collapse Toggle */}
        <div className="border-t border-admin-border p-2 flex-shrink-0">
          <button
            onClick={toggle}
            className={cn(
              'w-full flex items-center gap-3 h-[38px] rounded-lg text-admin-text-muted hover:bg-admin-surface-hover hover:text-admin-text-primary transition-all duration-150',
              isOpen ? 'px-3 mx-1' : 'justify-center'
            )}
          >
            {isOpen ? (
              <>
                <ChevronsLeft size={18} />
                <span className="text-sm font-medium">Collapse</span>
              </>
            ) : (
              <ChevronsRight size={18} />
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
};
