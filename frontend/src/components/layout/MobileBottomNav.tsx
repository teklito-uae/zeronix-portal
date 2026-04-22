import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Package,
  MessageSquareText,
  MessageCircle,
  Receipt
} from 'lucide-react';

const adminNavItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Management', icon: Users, path: '/admin/customers' },
  { label: 'Catalog', icon: Package, path: '/admin/products' },
  { label: 'Ops', icon: MessageSquareText, path: '/admin/enquiries' },
  { label: 'Chat', icon: MessageCircle, path: '/admin/chat' },
];

const getCustomerNavItems = (companySlug: string) => [
  { label: 'Home', icon: LayoutDashboard, path: `/portal/${companySlug}/dashboard` },
  { label: 'Catalog', icon: Package, path: `/portal/${companySlug}/products` },
  { label: 'Requests', icon: MessageSquareText, path: `/portal/${companySlug}/enquiries` },
  { label: 'Billing', icon: Receipt, path: `/portal/${companySlug}/invoices` },
  { label: 'Chat', icon: MessageCircle, path: `/portal/${companySlug}/chat` },
];

export const MobileBottomNav = ({ isVisible = true }: { isVisible?: boolean }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isCustomer = location.pathname.startsWith('/portal');
  
  // Extract company slug from /portal/:slug/xxx
  const parts = location.pathname.split('/');
  const companySlug = isCustomer && parts.length > 2 ? parts[2] : 'company';

  const navItems = isCustomer ? getCustomerNavItems(companySlug) : adminNavItems;

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className={cn(
      "md:hidden fixed bottom-0 left-0 right-0 z-50 bg-admin-surface border-t border-admin-border pb-safe transition-transform duration-300",
      isVisible ? "translate-y-0" : "translate-y-full"
    )}>
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors duration-150',
                active
                  ? 'text-zeronix-blue'
                  : 'text-admin-text-muted'
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
