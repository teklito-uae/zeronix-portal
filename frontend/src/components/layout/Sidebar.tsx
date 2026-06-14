import { useLocation, useNavigate } from 'react-router-dom';
import { useSidebarStore } from '@/store/useSidebarStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Logo } from '@/components/shared/Logo';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
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
  MessageCircle,
  ChevronsLeft,
  ChevronsRight,
  Upload,
  Settings,
  Activity,
  Clock,
  ChevronDown,
  MoreHorizontal,
  Plus,
  Bell,
  Sparkles,
  User,
  LogOut,
  UserCircle2
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
      { id: 'attendance', label: 'Attendance', icon: <Clock size={18} />, path: `${basePath}/attendance`, adminOnly: true },
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
  const customerUser = useAuthStore((state) => state.customer);
  const logout = useAuthStore((state) => state.logout);
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
        if (item.id === 'dashboard') return true; // Everyone sees dashboard
        if (item.id === 'chat') return true; // Chat is generic
        if (item.id === 'settings') return true; // Settings is for personal config
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

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'hidden md:flex flex-col h-[calc(100vh-24px)] bg-brand-white border border-brand-border rounded-xl shadow-sm flex-shrink-0 transition-all duration-300 relative z-20',
          isOpen ? 'w-64' : 'w-16'
        )}
      >
        {/* ROW 1: User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className={cn("flex items-center gap-2 py-2 mb-1 border-b border-brand-border/50 pb-3 cursor-pointer hover:bg-brand-bg rounded-lg transition-colors", isOpen ? "px-2 mx-1" : "justify-center mx-0")}>
              <Avatar className="h-6 w-6 border border-brand-border">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`}
                  alt={user?.name}
                  className="h-full w-full object-cover"
                />
                <AvatarFallback className="bg-brand-accent text-brand-white text-[10px] font-semibold">
                  {user?.name?.charAt(0) || (isCustomer ? 'C' : 'A')}
                </AvatarFallback>
              </Avatar>
              {isOpen && (
                <>
                  <span className="text-[13px] font-medium text-brand-primary flex-1 truncate text-left">
                    {user?.name || 'User'}
                  </span>
                  <ChevronDown size={12} className="text-brand-subtle" />
                </>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-brand-white border-brand-border rounded-xl">
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
            <DropdownMenuItem
              className="text-brand-secondary hover:bg-brand-surface cursor-pointer text-[13px]"
              onClick={() => navigate(isCustomer ? `/portal/${companySlug}/profile` : '#')}
            >
              <User size={14} className="mr-2" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-brand-secondary hover:bg-brand-surface cursor-pointer text-[13px]">
              <Settings size={14} className="mr-2" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-brand-border" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-brand-danger hover:bg-brand-danger-bg cursor-pointer text-[13px]"
            >
              <LogOut size={14} className="mr-2" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="space-y-4 px-3">
            {navGroups.map((group) => (
              <div key={group.label}>
                {/* Group Label */}
                {isOpen ? (
                  <div className="flex items-center justify-between px-2 mt-3 mb-1">
                    <span className="text-[10px] font-semibold text-brand-subtle uppercase tracking-[0.06em]">
                      {group.label}
                    </span>
                    <MoreHorizontal size={13} className="text-brand-subtle" />
                  </div>
                ) : (
                  <Separator className="my-2 bg-brand-border/50" />
                )}

                {/* Nav Items */}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item.path);
                    const button = (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={cn(
                          'w-full flex items-center gap-2 rounded-lg transition-colors',
                          isOpen ? 'px-2 py-2.5' : 'justify-center p-2.5 mx-auto',
                          active
                            ? 'text-[13px] font-medium text-brand-primary bg-brand-surface'
                            : 'text-[13px] font-medium text-brand-muted hover:bg-brand-surface'
                        )}
                      >
                        <span className={cn("flex-shrink-0 flex items-center justify-center", active ? "text-brand-secondary" : "text-brand-subtle")}>
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
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Bottom Section */}
        {isOpen && (
          <div className="border-t border-brand-border/50 pt-3 flex flex-col gap-2 mt-2">
            <div className="px-2">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <span className="text-[11px] text-brand-subtle">Online & Ready</span>
              </div>
            </div>
            <div className="flex items-center justify-between px-2">
              <button className="flex items-center gap-1 text-[12px] font-medium text-brand-secondary hover:text-brand-primary transition-colors">
                <Plus size={13} /> Invite
              </button>
              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded-lg hover:bg-brand-bg transition-colors"><Settings size={13} className="text-brand-subtle hover:text-brand-secondary" /></button>
                <button className="p-1.5 rounded-lg hover:bg-brand-bg transition-colors"><Sparkles size={13} className="text-brand-subtle hover:text-brand-secondary" /></button>
                <button className="p-1.5 rounded-lg hover:bg-brand-bg transition-colors"><Bell size={13} className="text-brand-subtle hover:text-brand-secondary" /></button>
              </div>
            </div>
          </div>
        )}

        {/* Collapse Toggle */}
        <div className="border-t border-brand-border/50 p-2 mt-3 flex-shrink-0">
          <button
            onClick={toggle}
            className={cn(
              'w-full flex items-center gap-3 h-[30px] rounded-lg text-brand-muted hover:bg-brand-bg hover:text-brand-primary transition-all duration-150',
              isOpen ? 'px-3 mx-1' : 'justify-center'
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
