import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useThemeStore } from '@/store/useThemeStore';
import { useCartStore } from '@/store/useCartStore';
import logo from '@/assets/logo.webp';
import { Button } from '@/components/ui/button';
import { Search, Package, MessageSquareText, Moon, Sun, User, LogOut, ShoppingCart } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export const CustomerLayout = () => {
  const { theme, toggle } = useThemeStore();
  const cartItems = useCartStore((state) => state.items);
  const totalCartItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    navigate('/login');
  };

  const navLinks = [
    { label: 'Products', path: '/portal/products', icon: <Package size={18} /> },
    { label: 'My Enquiries', path: '/portal/enquiries', icon: <MessageSquareText size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-cust-bg text-cust-text-primary font-sans transition-colors duration-200">
      {/* Topbar */}
      <header className="sticky top-0 z-50 w-full border-b border-cust-border bg-white/80 dark:bg-[#0A1520]/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/portal/products" className="flex items-center gap-2">
              <img src={logo} alt="Zeronix" className="h-8 w-auto dark:brightness-0 dark:invert" />
            </Link>
          </div>

          {/* Search (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cust-text-secondary w-5 h-5" />
            <input
              type="text"
              placeholder="Search products, part numbers, or brands..."
              className="w-full h-10 pl-10 pr-4 rounded-full border border-cust-border bg-cust-bg-subtle text-sm focus:outline-none focus:ring-2 focus:ring-zeronix-blue transition-all dark:bg-cust-bg-dark dark:border-admin-border"
              onClick={() => navigate('/portal/products')}
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            <nav className="hidden sm:flex items-center gap-1 mr-2">
              {navLinks.map((link) => {
                const active = location.pathname.startsWith(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      active 
                        ? "text-zeronix-blue bg-zeronix-blue/10" 
                        : "text-cust-text-secondary hover:text-cust-text-primary hover:bg-cust-bg-subtle dark:hover:bg-admin-surface-hover"
                    )}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggle(false)}
              className="rounded-full text-cust-text-secondary hover:text-cust-text-primary hover:bg-cust-bg-subtle dark:hover:bg-admin-surface-hover"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/portal/request-form')}
              className="relative rounded-full text-cust-text-secondary hover:text-cust-text-primary hover:bg-cust-bg-subtle dark:hover:bg-admin-surface-hover"
            >
              <ShoppingCart size={20} />
              {totalCartItems > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-zeronix-blue rounded-full">
                  {totalCartItems}
                </span>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-cust-bg-subtle dark:bg-admin-surface-hover text-zeronix-blue">
                  <User size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#152030] border-cust-border dark:border-admin-border">
                <div className="px-4 py-3 border-b border-cust-border dark:border-admin-border">
                  <p className="text-sm font-medium text-cust-text-primary">Ahmed Al Mansoori</p>
                  <p className="text-xs text-cust-text-secondary truncate">ahmed@gulfind.ae</p>
                </div>
                <DropdownMenuItem onClick={() => navigate('/portal/enquiries')} className="cursor-pointer text-cust-text-primary focus:bg-cust-bg-subtle dark:focus:bg-admin-surface-hover">
                  <MessageSquareText size={16} className="mr-2" />
                  My Enquiries
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-cust-border dark:bg-admin-border" />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-danger focus:bg-danger/10">
                  <LogOut size={16} className="mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};
