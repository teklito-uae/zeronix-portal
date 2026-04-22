import { useLocation, useNavigate } from 'react-router-dom';
import { useSidebarStore } from '@/store/useSidebarStore';
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
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const adminNavGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/admin/dashboard' },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Customers', icon: <Users size={18} />, path: '/admin/customers' },
      { label: 'Suppliers', icon: <Truck size={18} />, path: '/admin/suppliers' },
      { label: 'Products', icon: <Package size={18} />, path: '/admin/products' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Enquiries', icon: <MessageSquareText size={18} />, path: '/admin/enquiries' },
      { label: 'Quotes', icon: <FileText size={18} />, path: '/admin/quotes' },
      { label: 'Invoices', icon: <Receipt size={18} />, path: '/admin/invoices' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { label: 'Chat', icon: <MessageCircle size={18} />, path: '/admin/chat' },
    ],
  },
];

const getCustomerNavGroups = (companySlug: string): NavGroup[] => [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: `/portal/${companySlug}/dashboard` },
    ],
  },
  {
    label: 'Purchasing',
    items: [
      { label: 'Products', icon: <Package size={18} />, path: `/portal/${companySlug}/products` },
      { label: 'My Enquiries', icon: <MessageSquareText size={18} />, path: `/portal/${companySlug}/enquiries` },
      { label: 'Quotes', icon: <FileText size={18} />, path: `/portal/${companySlug}/quotes` },
      { label: 'Invoices', icon: <Receipt size={18} />, path: `/portal/${companySlug}/invoices` },
    ],
  },
  {
    label: 'Communication',
    items: [
      { label: 'Chat Support', icon: <MessageCircle size={18} />, path: `/portal/${companySlug}/chat` },
    ],
  },
];

export const Sidebar = () => {
  const { isOpen, toggle } = useSidebarStore();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isCustomer = location.pathname.startsWith('/portal');
  
  // Extract company slug from /portal/:slug/xxx
  const parts = location.pathname.split('/');
  const companySlug = isCustomer && parts.length > 2 ? parts[2] : 'company';

  const navGroups = isCustomer ? getCustomerNavGroups(companySlug) : adminNavGroups;

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
          <div className={cn(
            "flex items-center font-bold transition-all duration-200",
            isOpen ? "text-2xl tracking-tight" : "text-3xl w-full justify-center tracking-tighter"
          )}>
            <span className="text-emerald-500">Z</span>
            {isOpen && (
              <span className="text-blue-950 dark:text-white ml-1 font-black uppercase tracking-[0.05em] text-xl">
                eronix
              </span>
            )}
          </div>
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
