import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useSidebarStore } from '@/store/useSidebarStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useCartStore } from '@/store/useCartStore';
import { Logo } from '@/components/shared/Logo';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { NotificationBell } from './NotificationBell';
import { CartDrawer } from '../portal/CartDrawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getBasePath } from '@/hooks/useBasePath';
import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  MessageSquareText,
  FileText,
  Receipt,
  ChevronsLeft,
  ChevronsRight,
  Settings,
  Activity,
  Clock,
  ChevronDown,
  User,
  LogOut,
  UserCircle2,
  Building2,
  BookOpen,
  ShoppingCart,
  Wallet,
  BarChart3,
  ClipboardList,
  PackageCheck,
  Megaphone,
  Handshake,
  Search,
  Sun,
  Moon,
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
  description?: string;
  items: NavItem[];
}

const getSuperAdminNavGroups = (basePath: string): NavGroup[] => [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: `${basePath}/dashboard` },
    ],
  },
  {
    label: 'Platform Management',
    items: [
      { id: 'companies', label: 'Companies', icon: <Building2 size={18} />, path: `${basePath}/companies` },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'activities', label: 'Activities', icon: <Activity size={18} />, path: `${basePath}/activities` },
      { id: 'system-docs', label: 'Architecture Docs', icon: <BookOpen size={18} />, path: `${basePath}/system-docs` },
      { id: 'settings', label: 'Settings', icon: <Settings size={18} />, path: `${basePath}/settings` },
    ],
  },
];

const getTenantAdminNavGroups = (basePath: string): NavGroup[] => [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: `${basePath}/dashboard` },
    ],
  },
  {
    label: 'CRM',
    description: 'Lead → Enquiry → Customer',
    items: [
      { id: 'leads', label: 'Leads', icon: <UserCircle2 size={18} />, path: `${basePath}/leads` },
      { id: 'companies', label: 'Companies', icon: <Building2 size={18} />, path: `${basePath}/companies` },
      { id: 'contacts', label: 'Contacts', icon: <Users size={18} />, path: `${basePath}/contacts` },
      { id: 'enquiries', label: 'Enquiries', icon: <MessageSquareText size={18} />, path: `${basePath}/enquiries` },
      { id: 'deals', label: 'Deals', icon: <Handshake size={18} />, path: `${basePath}/deals` },
    ],
  },
  {
    label: 'Sales',
    description: 'Quote → Order → Delivery → Invoice → Receipt',
    items: [
      { id: 'quotes', label: 'Quotes', icon: <FileText size={18} />, path: `${basePath}/quotes` },
      { id: 'sales-orders', label: 'Sales Orders', icon: <ClipboardList size={18} />, path: `${basePath}/sales-orders` },
      { id: 'deliveries', label: 'Deliveries', icon: <PackageCheck size={18} />, path: `${basePath}/deliveries` },
      { id: 'invoices', label: 'Invoices', icon: <Receipt size={18} />, path: `${basePath}/invoices` },
      { id: 'receipts', label: 'Payment Receipts', icon: <Receipt size={18} />, path: `${basePath}/payment-receipts` },
    ],
  },
  {
    label: 'Purchasing',
    items: [
      { id: 'suppliers', label: 'Suppliers', icon: <Truck size={18} />, path: `${basePath}/suppliers` },
      { id: 'purchases', label: 'Purchases', icon: <ShoppingCart size={18} />, path: `${basePath}/purchases` },
      { id: 'expenses', label: 'Expenses', icon: <Wallet size={18} />, path: `${basePath}/expenses` },
    ],
  },
  {
    label: 'Management',
    items: [
      { id: 'products', label: 'Products', icon: <Package size={18} />, path: `${basePath}/products` },
      { id: 'users', label: 'Team', icon: <Users size={18} />, path: `${basePath}/users` },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { id: 'marketing', label: 'Marketing', icon: <Megaphone size={18} />, path: `${basePath}/marketing/dashboard` },
    ],
  },
  {
    label: 'Insights',
    items: [
      { id: 'reports', label: 'Reports', icon: <BarChart3 size={18} />, path: `${basePath}/reports` },
    ],
  },
  {
    label: 'Workforce',
    items: [
      { id: 'attendance', label: 'Attendance', icon: <Clock size={18} />, path: `${basePath}/attendance` },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'settings', label: 'Settings', icon: <Settings size={18} />, path: `${basePath}/settings` },
    ],
  },
];

const getTenantStaffNavGroups = (basePath: string): NavGroup[] => [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: `${basePath}/dashboard` },
    ],
  },
  {
    label: 'CRM',
    description: 'Lead → Enquiry → Customer',
    items: [
      { id: 'leads', label: 'Leads', icon: <UserCircle2 size={18} />, path: `${basePath}/leads` },
      { id: 'companies', label: 'Companies', icon: <Building2 size={18} />, path: `${basePath}/companies` },
      { id: 'contacts', label: 'Contacts', icon: <Users size={18} />, path: `${basePath}/contacts` },
      { id: 'enquiries', label: 'Enquiries', icon: <MessageSquareText size={18} />, path: `${basePath}/enquiries` },
      { id: 'deals', label: 'Deals', icon: <Handshake size={18} />, path: `${basePath}/deals` },
    ],
  },
  {
    label: 'Sales',
    description: 'Quote → Order → Delivery → Invoice → Receipt',
    items: [
      { id: 'quotes', label: 'Quotes', icon: <FileText size={18} />, path: `${basePath}/quotes` },
      { id: 'sales-orders', label: 'Sales Orders', icon: <ClipboardList size={18} />, path: `${basePath}/sales-orders` },
      { id: 'deliveries', label: 'Deliveries', icon: <PackageCheck size={18} />, path: `${basePath}/deliveries` },
      { id: 'invoices', label: 'Invoices', icon: <Receipt size={18} />, path: `${basePath}/invoices` },
      { id: 'receipts', label: 'Payment Receipts', icon: <Receipt size={18} />, path: `${basePath}/payment-receipts` },
    ],
  },
  {
    label: 'Purchasing',
    items: [
      { id: 'suppliers', label: 'Suppliers', icon: <Truck size={18} />, path: `${basePath}/suppliers` },
      { id: 'purchases', label: 'Purchases', icon: <ShoppingCart size={18} />, path: `${basePath}/purchases` },
      { id: 'expenses', label: 'Expenses', icon: <Wallet size={18} />, path: `${basePath}/expenses` },
    ],
  },
  {
    label: 'Management',
    items: [
      { id: 'products', label: 'Products', icon: <Package size={18} />, path: `${basePath}/products` },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { id: 'marketing', label: 'Marketing', icon: <Megaphone size={18} />, path: `${basePath}/marketing/dashboard` },
    ],
  },
  {
    label: 'Insights',
    items: [
      { id: 'reports', label: 'Reports', icon: <BarChart3 size={18} />, path: `${basePath}/reports` },
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
];

export const Sidebar = () => {
  const { isOpen, toggle, setOpen } = useSidebarStore();
  const asideRef = useRef<HTMLElement>(null);
  const adminUser = useAuthStore((state) => state.admin);
  const customerUser = useAuthStore((state) => state.customer);
  const logout = useAuthStore((state) => state.logout);
  const { theme, toggle: toggleTheme } = useThemeStore();
  const cartItems = useCartStore((s) => s.items);
  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const location = useLocation();
  const navigate = useNavigate();

  // The Topbar owns the actual search modal + Cmd/Ctrl+K listener (it's
  // mounted on every breakpoint); this button just re-dispatches the same
  // shortcut so there's a single source of truth for the open state.
  const openGlobalSearch = () =>
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));

  // Group-flyout hover state (collapsed mode only)
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openGroup = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setHoveredGroup(label);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setHoveredGroup(null), 150);
  };

  // Auto-hide: once expanded, collapse back as soon as the user interacts
  // outside the sidebar, so it doesn't permanently eat into the content area.
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (asideRef.current && !asideRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen, setOpen]);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isCustomer = location.pathname.startsWith('/portal');

  // Extract company slug from /portal/:slug/xxx
  const parts = location.pathname.split('/');
  const companySlug = isCustomer && parts.length > 2 ? parts[2] : 'company';

  // Filter groups based on role
  const filterAdminGroups = () => {
    if (!adminUser) return [];

    if (adminUser.role === 'super_admin') {
      return getSuperAdminNavGroups('/saas-admin');
    }
    if (adminUser.role === 'admin') {
      return getTenantAdminNavGroups('/workspace');
    }

    // For staff, we use the staff arrays
    const groups = getTenantStaffNavGroups('/workspace');
    return groups.map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (item.id === 'dashboard') return true; // Everyone sees dashboard
        return adminUser.permissions?.includes(item.id);
      })
    })).filter(group => group.items.length > 0);
  };

  const navGroups = isCustomer ? getCustomerNavGroups(companySlug) : filterAdminGroups();
  const user = isCustomer ? customerUser : adminUser;

  const handleLogout = () => {
    logout(isCustomer ? 'customer' : 'admin');
    navigate(isCustomer ? '/portal/login' : `${getBasePath()}/login`);
  };

  const isSuperAdmin = !isCustomer && adminUser?.role === 'super_admin';
  const docsPath = isSuperAdmin ? '/saas-admin/system-docs' : null;

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        ref={asideRef}
        className={cn(
          'hidden md:flex flex-col h-screen bg-brand-white border-r border-brand-border flex-shrink-0 transition-all duration-300 relative z-20',
          isOpen ? 'w-64' : 'w-17'
        )}
      >
        {/* Brand Row */}
        <div className={cn(
          'flex items-center h-14 flex-shrink-0 border-b border-brand-border/60',
          isOpen ? 'px-4 justify-between' : 'justify-center'
        )}>
          <Logo size="sm" showText={isOpen} />
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-3">
          <nav className="flex flex-col gap-5 px-3">
            {navGroups.map((group) => (
              <div
                key={group.label}
                onMouseEnter={() => !isOpen && openGroup(group.label)}
                onMouseLeave={() => !isOpen && scheduleClose()}
              >
                {/* Group Label */}
                {isOpen ? (
                  <div className="px-2.5 mb-1.5">
                    <span className="text-[10px] font-semibold text-brand-subtle uppercase tracking-[0.08em]">
                      {group.label}
                    </span>
                    {group.description && (
                      <span className="block text-[10px] text-brand-subtle/70 normal-case tracking-normal mt-0.5">
                        {group.description}
                      </span>
                    )}
                  </div>
                ) : (
                  <Separator className="my-2 bg-brand-border/50" />
                )}

                {/* Nav Items */}
                <Popover open={!isOpen && hoveredGroup === group.label}>
                  <PopoverAnchor asChild>
                    <div className="flex flex-col gap-0.5">
                      {group.items.map((item) => {
                        const active = isActive(item.path);
                        const button = (
                          <button
                            key={item.path}
                            onClick={() => { navigate(item.path); setOpen(false); }}
                            className={cn(
                              'w-full flex items-center gap-2 rounded-lg transition-colors relative',
                              isOpen ? 'px-2.5 py-2.5' : 'justify-center p-2.5 mx-auto',
                              active
                                ? 'text-[13px] font-medium text-brand-accent bg-brand-accent-light'
                                : 'text-[13px] font-medium text-brand-muted hover:bg-brand-surface hover:text-brand-primary'
                            )}
                          >
                            {active && isOpen && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-brand-accent" />
                            )}
                            <span className={cn('flex-shrink-0 flex items-center justify-center', active ? 'text-brand-accent' : 'text-brand-subtle')}>
                              {item.icon}
                            </span>
                            {isOpen && (
                              <span className="truncate">{item.label}</span>
                            )}
                          </button>
                        );

                        if (!isOpen) {
                          return (
                            <Tooltip key={item.path}>
                              <TooltipTrigger asChild>{button}</TooltipTrigger>
                              <TooltipContent side="right" className="bg-brand-surface text-brand-primary border-brand-border/50 text-[12px] font-medium">
                                {item.label}
                              </TooltipContent>
                            </Tooltip>
                          );
                        }

                        return button;
                      })}
                    </div>
                  </PopoverAnchor>

                  {/* Collapsed-mode group flyout */}
                  <PopoverContent
                    side="right"
                    align="start"
                    sideOffset={10}
                    onMouseEnter={() => openGroup(group.label)}
                    onMouseLeave={scheduleClose}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    className="w-56 p-1.5 bg-brand-white border-brand-border rounded-xl shadow-lg"
                  >
                    <p className="px-2.5 pt-1 pb-1.5 text-[10px] font-semibold text-brand-subtle uppercase tracking-[0.06em]">
                      {group.label}
                    </p>
                    <div className="flex flex-col gap-0.5">
                      {group.items.map((item) => {
                        const active = isActive(item.path);
                        return (
                          <button
                            key={item.path}
                            onClick={() => { navigate(item.path); setHoveredGroup(null); }}
                            className={cn(
                              'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors',
                              active
                                ? 'text-brand-accent bg-brand-accent-light'
                                : 'text-brand-secondary hover:bg-brand-surface hover:text-brand-primary'
                            )}
                          >
                            <span className={cn('flex-shrink-0', active ? 'text-brand-accent' : 'text-brand-subtle')}>
                              {item.icon}
                            </span>
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Bottom Section */}
        <div className="border-t border-brand-border/60 mt-2 pt-2 px-2 flex flex-col gap-0.5 shrink-0">
          {/* Quick Actions — search, notifications, theme, cart. Hidden on
              mobile since this <aside> doesn't render there; Topbar carries
              mobile-only equivalents instead. */}
          <div className={cn('hidden md:flex pb-1.5 mb-1 border-b border-brand-border/60', isOpen ? 'items-center justify-around' : 'flex-col items-center gap-1')}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={openGlobalSearch}
                  className="p-2 rounded-lg text-brand-muted hover:bg-brand-surface hover:text-brand-primary transition-colors"
                >
                  <Search size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side={isOpen ? 'top' : 'right'} className="bg-brand-surface text-brand-primary border-brand-border/50 text-[12px] font-medium">
                Search <kbd className="ml-1 text-[10px] opacity-60">⌘K</kbd>
              </TooltipContent>
            </Tooltip>

            <NotificationBell side={isOpen ? 'top' : 'right'} align="start" />

            {isCustomer && (
              <CartDrawer>
                <button className="p-2 rounded-lg text-brand-muted hover:bg-brand-surface hover:text-brand-primary transition-colors relative">
                  <ShoppingCart size={16} />
                  {totalCartItems > 0 && (
                    <span className="absolute top-1 right-1 h-3 w-3 bg-brand-success text-[8px] font-bold text-brand-white flex items-center justify-center rounded-full shadow-sm">
                      {totalCartItems}
                    </span>
                  )}
                </button>
              </CartDrawer>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => toggleTheme(isCustomer)}
                  className="p-2 rounded-lg text-brand-muted hover:bg-brand-surface hover:text-brand-primary transition-colors"
                >
                  {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                </button>
              </TooltipTrigger>
              <TooltipContent side={isOpen ? 'top' : 'right'} className="bg-brand-surface text-brand-primary border-brand-border/50 text-[12px] font-medium">
                Toggle theme
              </TooltipContent>
            </Tooltip>
          </div>

          {docsPath && (
            isOpen ? (
              <button
                onClick={() => navigate(docsPath)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-brand-muted hover:bg-brand-surface hover:text-brand-primary transition-colors"
              >
                <BookOpen size={17} className="text-brand-subtle shrink-0" />
                <span className="truncate">Documentation</span>
              </button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate(docsPath)}
                    className="w-full flex items-center justify-center p-2.5 rounded-lg text-brand-muted hover:bg-brand-surface hover:text-brand-primary transition-colors"
                  >
                    <BookOpen size={17} className="text-brand-subtle" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-brand-surface text-brand-primary border-brand-border/50 text-[12px] font-medium">
                  Documentation
                </TooltipContent>
              </Tooltip>
            )
          )}

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'w-full flex items-center gap-2.5 rounded-lg hover:bg-brand-surface transition-colors',
                  isOpen ? 'px-2 py-2' : 'justify-center p-2'
                )}
              >
                <Avatar className="size-7 border border-brand-border shrink-0">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`}
                    alt={user?.name}
                  />
                  <AvatarFallback className="bg-brand-accent text-brand-white text-[10px] font-semibold">
                    {user?.name?.charAt(0) || (isCustomer ? 'C' : 'A')}
                  </AvatarFallback>
                </Avatar>
                {isOpen && (
                  <>
                    <span className="flex-1 min-w-0 text-left">
                      <span className="block text-[13px] font-medium text-brand-primary truncate">
                        {user?.name || 'User'}
                      </span>
                      <span className="block text-[11px] text-brand-subtle truncate">
                        {isCustomer ? (customerUser?.company || 'Customer') : (adminUser?.role?.replace('_', ' ') || 'Admin')}
                      </span>
                    </span>
                    <ChevronDown size={13} className="text-brand-subtle shrink-0" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side={isOpen ? 'top' : 'right'} className="w-52 bg-brand-white border-brand-border rounded-xl">
              {isCustomer && (
                <div className="px-2 py-1.5 border-b border-brand-border mb-1">
                  <span className="text-[13px] font-semibold text-brand-success uppercase tracking-tight block">
                    {customerUser?.company || 'My Company'}
                  </span>
                  <span className="text-[10px] text-brand-subtle font-medium flex items-center gap-1">
                    <UserCircle2 size={10} className="text-brand-accent" />
                    Mgr: {customerUser?.assigned_users?.map(u => u.name.split(' ')[0]).join(', ') || 'Zeronix Sales'}
                  </span>
                </div>
              )}
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="text-brand-secondary hover:bg-brand-surface cursor-pointer text-[13px]"
                  onClick={() => navigate(isCustomer ? `/portal/${companySlug}/profile` : '#')}
                >
                  <User size={14} className="mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-brand-secondary hover:bg-brand-surface cursor-pointer text-[13px]"
                  onClick={() => navigate(isCustomer ? `/portal/${companySlug}/profile` : `${getBasePath()}/settings`)}
                >
                  <Settings size={14} className="mr-2" /> Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-brand-border" />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-brand-danger hover:bg-brand-danger-bg cursor-pointer text-[13px]"
                >
                  <LogOut size={14} className="mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Collapse Toggle */}
        <div className="border-t border-brand-border/60 p-2 shrink-0">
          <button
            onClick={toggle}
            className={cn(
              'w-full flex items-center gap-3 h-8 rounded-lg text-brand-muted hover:bg-brand-bg hover:text-brand-primary transition-all duration-150',
              isOpen ? 'px-3' : 'justify-center'
            )}
          >
            {isOpen ? (
              <>
                <ChevronsLeft size={16} />
                <span className="text-[12px] font-medium">Collapse</span>
              </>
            ) : (
              <ChevronsRight size={16} />
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
};
