import { useSidebarStore } from '@/store/useSidebarStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, Sun, Moon, LogOut, Settings, User, MessageCircle } from 'lucide-react';

// Breadcrumb helper
const formatBreadcrumb = (pathname: string): string[] => {
  const parts = pathname.split('/').filter(Boolean);
  return parts.map((part) =>
    part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ')
  );
};

export const Topbar = () => {
  const { toggle } = useSidebarStore();
  const { theme, toggle: toggleTheme } = useThemeStore();
  const admin = useAuthStore((s) => s.admin);
  const customer = useAuthStore((s) => s.customer);
  const setAdmin = useAuthStore((s) => s.setAdmin);
  const setCustomer = useAuthStore((s) => s.setCustomer);
  const navigate = useNavigate();
  const location = useLocation();

  const isCustomer = location.pathname.startsWith('/portal');
  const user = isCustomer ? customer : admin;

  const parts = location.pathname.split('/');
  const companySlug = isCustomer && parts.length > 2 ? parts[2] : 'company';

  const breadcrumbs = formatBreadcrumb(location.pathname);

  const handleLogout = () => {
    if (isCustomer) {
      setCustomer(null);
      localStorage.removeItem('zeronix_customer_token');
      navigate('/login');
    } else {
      setAdmin(null);
      localStorage.removeItem('zeronix_token');
      navigate('/admin/login');
    }
  };

  return (
    <header className="h-16 bg-admin-surface border-b border-admin-border flex items-center px-4 justify-between flex-shrink-0">
      {/* Left: Menu toggle + Breadcrumbs */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="text-admin-text-secondary hover:text-admin-text-primary hover:bg-admin-surface-hover"
        >
          <Menu size={20} />
        </Button>

        <nav className="hidden sm:flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-admin-text-muted">/</span>}
              <span
                className={
                  i === breadcrumbs.length - 1
                    ? 'text-admin-text-primary font-medium'
                    : 'text-admin-text-muted'
                }
              >
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* Right: Theme toggle + Notifications + User */}
      <div className="flex items-center gap-2">
        {/* Chat Notifications */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(isCustomer ? `/portal/${companySlug}/chat` : '/admin/chat')}
          className="h-[38px] w-[38px] text-admin-text-secondary hover:text-admin-text-primary hover:bg-admin-surface-hover relative"
        >
          <MessageCircle size={18} />
          <span className="absolute top-2 right-2 h-2 w-2 bg-zeronix-blue rounded-full border-2 border-admin-surface"></span>
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-[38px] w-[38px] text-admin-text-secondary hover:text-admin-text-primary hover:bg-admin-surface-hover"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </Button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-admin-surface-hover">
              <Avatar className="h-8 w-8 border border-admin-border">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`} 
                  alt={user?.name}
                  className="h-full w-full object-cover"
                />
                <AvatarFallback className="bg-zeronix-blue text-white text-xs font-semibold">
                  {user?.name?.charAt(0) || (isCustomer ? 'C' : 'A')}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium text-admin-text-primary">
                {user?.name || (isCustomer ? 'Customer' : 'Admin')}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-admin-surface border-admin-border"
          >
            <DropdownMenuItem 
              className="text-admin-text-secondary hover:bg-admin-surface-hover cursor-pointer"
              onClick={() => navigate(isCustomer ? `/portal/${companySlug}/profile` : '#')}
            >
              <User size={16} className="mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-admin-text-secondary hover:bg-admin-surface-hover cursor-pointer">
              <Settings size={16} className="mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-admin-border" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-danger hover:bg-admin-surface-hover cursor-pointer"
            >
              <LogOut size={16} className="mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
