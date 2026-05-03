import { useState, useEffect } from 'react';
import { usePublicResourceList } from '@/hooks/useApi';
import { SEO } from '@/components/shared/SEO';
import { useCartStore } from '@/store/useCartStore';
import { useThemeStore } from '@/store/useThemeStore';
import { Logo } from '@/components/shared/Logo';
import { 
  Search, 
  Loader2,
  X,
  ShieldCheck,
  Globe,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Send,
  Phone,
  Mail,
  Building2,
  User,
  CheckCircle2,
  Moon,
  Sun,
  LayoutGrid,
  ChevronDown,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetDescription
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface Product {
  id: number;
  name: string;
  model_code: string;
  brand?: { name: string };
  category?: { name: string };
  description?: string;
}

export const PublicInventory = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [rfqForm, setRfqForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    notes: ''
  });

  const { theme, toggle: toggleTheme, initTheme } = useThemeStore();
  const { items, addItem, removeItem, updateQuantity, clearCart } = useCartStore();

  useEffect(() => {
    initTheme(true);
  }, [initTheme]);

  // Sync search input with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Data Fetching
  const { data: resourceData, isLoading: productsLoading } = usePublicResourceList<Product>('products', {
    page,
    search,
    category_id: selectedCategory,
    brand_id: selectedBrand,
    per_page: 16
  });

  const { data: categoriesData } = usePublicResourceList<any>('categories', {});
  const { data: brandsData } = usePublicResourceList<any>('brands', {});

  const products = resourceData?.data || [];
  const total = resourceData?.total || 0;
  const lastPage = resourceData?.last_page || 1;
  const categories = categoriesData?.data || [];
  const brands = brandsData?.data || [];

  const handleSendRFQ = async () => {
    if (items.length === 0) return;
    if (!rfqForm.name || !rfqForm.email) {
      toast.error('Please fill in your name and email');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/public/rfq', {
        customer_name: rfqForm.name,
        customer_email: rfqForm.email,
        customer_phone: rfqForm.phone,
        customer_company: rfqForm.company,
        notes: rfqForm.notes,
        items: items.map(item => ({
          product_id: item.product?.id,
          quantity: item.quantity
        }))
      });
      setIsSuccess(true);
      clearCart();
      toast.success('RFQ Sent Successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send RFQ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-admin-bg text-admin-text-primary selection:bg-zeronix-blue/30 font-sans transition-colors duration-300">
      <SEO title="Inventory Portal | ZERONIX" description="Browse our professional hardware inventory and request a quote." />
      
      {/* Responsive Header */}
      <header className="sticky top-0 z-50 w-full border-b border-admin-border bg-admin-surface/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-8">
            <Logo size="sm" showText className="sm:hidden" />
            <Logo size="md" showText className="hidden sm:flex" />
            
            {/* Desktop Navigation Menus */}
            <nav className="hidden md:flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 px-3 text-sm font-bold text-admin-text-secondary hover:text-admin-text-primary hover:bg-admin-surface-hover gap-2">
                    <LayoutGrid size={16} className="text-zeronix-blue" />
                    Categories
                    <ChevronDown size={14} className="opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 max-h-[400px] overflow-y-auto no-scrollbar bg-admin-surface border-admin-border rounded-xl shadow-2xl p-2 grid grid-cols-1 gap-1">
                  <DropdownMenuItem 
                    onClick={() => { setSelectedCategory(null); setPage(1); }}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm font-semibold",
                      !selectedCategory ? "bg-zeronix-blue/10 text-zeronix-blue" : "text-admin-text-secondary hover:bg-admin-surface-hover"
                    )}
                  >
                    All Components
                    {!selectedCategory && <CheckCircle2 size={14} />}
                  </DropdownMenuItem>
                  {categories.map((cat: any) => (
                    <DropdownMenuItem 
                      key={cat.id}
                      onClick={() => { setSelectedCategory(String(cat.id)); setPage(1); }}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm font-semibold",
                        selectedCategory === String(cat.id) ? "bg-zeronix-blue/10 text-zeronix-blue" : "text-admin-text-secondary hover:bg-admin-surface-hover"
                      )}
                    >
                      {cat.name}
                      {selectedCategory === String(cat.id) && <CheckCircle2 size={14} />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 px-3 text-sm font-bold text-admin-text-secondary hover:text-admin-text-primary hover:bg-admin-surface-hover gap-2">
                    <Building2 size={16} className="text-emerald-500" />
                    Brands
                    <ChevronDown size={14} className="opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 max-h-[400px] overflow-y-auto no-scrollbar bg-admin-surface border-admin-border rounded-xl shadow-2xl p-2">
                  <DropdownMenuItem 
                    onClick={() => { setSelectedBrand(null); setPage(1); }}
                    className="px-3 py-2 rounded-lg cursor-pointer text-sm font-semibold text-admin-text-secondary hover:bg-admin-surface-hover"
                  >
                    All Brands
                  </DropdownMenuItem>
                  {brands.slice(0, 20).map((brand: any) => (
                    <DropdownMenuItem 
                      key={brand.id}
                      onClick={() => { setSelectedBrand(String(brand.id)); setPage(1); }}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm font-semibold",
                        selectedBrand === String(brand.id) ? "bg-emerald-500/10 text-emerald-500" : "text-admin-text-secondary hover:bg-admin-surface-hover"
                      )}
                    >
                      {brand.name}
                      {selectedBrand === String(brand.id) && <CheckCircle2 size={14} />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>

          <div className="flex-1 flex items-center justify-end gap-1 sm:gap-2 min-w-0">
            <div className="relative flex-1 max-w-md group min-w-[100px] sm:min-w-[200px]">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-admin-text-muted group-focus-within:text-zeronix-blue transition-colors sm:size-4" />
              <Input 
                placeholder="Search..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8 sm:pl-10 bg-admin-bg border-admin-border h-8 sm:h-9 text-xs sm:text-sm focus:ring-zeronix-blue/10 w-full rounded-lg"
              />
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleTheme(true)}
              className="h-8 w-8 sm:h-9 sm:w-9 text-admin-text-secondary hover:text-admin-text-primary"
            >
              {theme === 'light' ? <Moon size={16} className="sm:size-18" /> : <Sun size={16} className="sm:size-18" />}
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button className="relative bg-zeronix-blue hover:bg-zeronix-blue-hover text-white rounded-lg h-8 sm:h-9 px-2 sm:px-4 font-bold text-[10px] sm:text-xs uppercase tracking-wider shadow-lg shadow-zeronix-blue/20">
                  <ShoppingCart size={14} className="sm:mr-2 sm:size-16" />
                  <span className="hidden sm:inline">RFQ</span>
                  {items.length > 0 && (
                    <span className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 bg-white text-zeronix-blue text-[8px] sm:text-[10px] font-black flex items-center justify-center rounded-full border-2 border-zeronix-blue animate-in zoom-in">
                      {items.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-admin-surface border-admin-border text-admin-text-primary w-full sm:max-w-md flex flex-col p-0 overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-admin-border bg-admin-bg/30">
                  <SheetHeader>
                    <SheetTitle className="text-admin-text-primary flex items-center gap-2">
                      <ShoppingCart size={20} className="text-zeronix-blue" />
                      Quote Request
                    </SheetTitle>
                    <SheetDescription className="text-admin-text-muted font-medium">
                      Submit your selection for pricing and availability.
                    </SheetDescription>
                  </SheetHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
                  {isSuccess ? (
                    <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
                      <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 size={32} className="text-emerald-500" />
                      </div>
                      <h3 className="text-lg font-bold text-admin-text-primary mb-2">Request Submitted</h3>
                      <p className="text-admin-text-secondary text-sm font-medium leading-relaxed mb-8">
                        Your RFQ has been sent to our sales team. You will receive a response shortly.
                      </p>
                      <Button 
                        onClick={() => setIsSuccess(false)}
                        className="bg-zeronix-blue hover:bg-zeronix-blue-hover text-white px-8 h-11 rounded-xl font-bold uppercase tracking-widest"
                      >
                        New Request
                      </Button>
                    </div>
                  ) : items.length > 0 ? (
                    <>
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-admin-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                          Items in Quote
                        </h4>
                        <div className="space-y-2">
                          {items.map((item) => (
                            <div key={item.product?.id} className="bg-admin-bg border border-admin-border rounded-xl p-3 flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-bold text-admin-text-primary truncate">{item.product?.name}</h5>
                                <div className="text-[10px] font-mono text-admin-text-muted truncate">{item.product?.model_code}</div>
                              </div>
                              <div className="flex items-center bg-admin-surface rounded-lg p-1 border border-admin-border">
                                <button 
                                  onClick={() => updateQuantity(item.quantity - 1, item.product?.id)}
                                  className="h-6 w-6 flex items-center justify-center text-admin-text-muted hover:text-admin-text-primary"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-6 text-center text-xs font-bold text-admin-text-primary">{item.quantity}</span>
                                <button 
                                  onClick={() => updateQuantity(item.quantity + 1, item.product?.id)}
                                  className="h-6 w-6 flex items-center justify-center text-admin-text-muted hover:text-admin-text-primary"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                              <button 
                                onClick={() => removeItem(item.product?.id)}
                                className="h-8 w-8 flex items-center justify-center text-admin-text-muted hover:text-danger"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-admin-border">
                        <h4 className="text-[10px] font-black text-admin-text-muted uppercase tracking-[0.2em]">Contact Details</h4>
                        <div className="grid grid-cols-1 gap-3">
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-admin-text-muted" />
                            <Input 
                              placeholder="Full Name *" 
                              className="pl-10 bg-admin-bg border-admin-border h-11 text-sm focus:border-zeronix-blue/50"
                              value={rfqForm.name}
                              onChange={(e) => setRfqForm({...rfqForm, name: e.target.value})}
                            />
                          </div>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-admin-text-muted" />
                            <Input 
                              placeholder="Email Address *" 
                              type="email"
                              className="pl-10 bg-admin-bg border-admin-border h-11 text-sm focus:border-zeronix-blue/50"
                              value={rfqForm.email}
                              onChange={(e) => setRfqForm({...rfqForm, email: e.target.value})}
                            />
                          </div>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-admin-text-muted" />
                            <Input 
                              placeholder="Phone Number" 
                              className="pl-10 bg-admin-bg border-admin-border h-11 text-sm focus:border-zeronix-blue/50"
                              value={rfqForm.phone}
                              onChange={(e) => setRfqForm({...rfqForm, phone: e.target.value})}
                            />
                          </div>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-3 h-4 w-4 text-admin-text-muted" />
                            <Input 
                              placeholder="Company" 
                              className="pl-10 bg-admin-bg border-admin-border h-11 text-sm focus:border-zeronix-blue/50"
                              value={rfqForm.company}
                              onChange={(e) => setRfqForm({...rfqForm, company: e.target.value})}
                            />
                          </div>
                          <Textarea 
                            placeholder="Additional notes..."
                            className="bg-admin-bg border-admin-border min-h-[80px] text-sm focus:border-zeronix-blue/50"
                            value={rfqForm.notes}
                            onChange={(e) => setRfqForm({...rfqForm, notes: e.target.value})}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <div className="h-16 w-16 bg-admin-bg rounded-2xl flex items-center justify-center mb-6 border border-admin-border">
                        <ShoppingCart size={24} className="text-admin-text-muted" />
                      </div>
                      <h3 className="text-lg font-bold text-admin-text-primary mb-2">Quote is Empty</h3>
                      <p className="text-admin-text-secondary text-sm">
                        Add items from the inventory to start your quote request.
                      </p>
                    </div>
                  )}
                </div>

                {!isSuccess && items.length > 0 && (
                  <div className="p-6 border-t border-admin-border bg-admin-bg/30">
                    <Button 
                      onClick={handleSendRFQ}
                      disabled={isSubmitting}
                      className="w-full bg-zeronix-blue hover:bg-zeronix-blue-hover text-white h-12 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-zeronix-blue/20"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={18} className="mr-2" />
                          Send Quote Request
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Filters Bar - Sticky below header */}
        <div className="md:hidden flex items-center gap-1 overflow-x-auto no-scrollbar px-4 py-2 border-t border-admin-border bg-admin-surface/50 backdrop-blur-sm">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-3 text-[10px] font-black uppercase tracking-wider text-admin-text-secondary border border-admin-border/50 bg-admin-surface flex-shrink-0 gap-1.5 rounded-full">
                <LayoutGrid size={12} className="text-zeronix-blue" />
                {selectedCategory ? categories.find((c: any) => String(c.id) === selectedCategory)?.name : 'Categories'}
                <ChevronDown size={10} className="opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 max-h-[300px] overflow-y-auto no-scrollbar bg-admin-surface border-admin-border rounded-xl shadow-2xl p-1">
              <DropdownMenuItem onClick={() => { setSelectedCategory(null); setPage(1); }} className="text-xs font-bold py-2 rounded-lg">All Components</DropdownMenuItem>
              {categories.map((cat: any) => (
                <DropdownMenuItem key={cat.id} onClick={() => { setSelectedCategory(String(cat.id)); setPage(1); }} className="text-xs font-bold py-2 rounded-lg">{cat.name}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-3 text-[10px] font-black uppercase tracking-wider text-admin-text-secondary border border-admin-border/50 bg-admin-surface flex-shrink-0 gap-1.5 rounded-full">
                <Building2 size={12} className="text-emerald-500" />
                {selectedBrand ? brands.find((b: any) => String(b.id) === selectedBrand)?.name : 'Brands'}
                <ChevronDown size={10} className="opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 max-h-[300px] overflow-y-auto no-scrollbar bg-admin-surface border-admin-border rounded-xl shadow-2xl p-1">
              <DropdownMenuItem onClick={() => { setSelectedBrand(null); setPage(1); }} className="text-xs font-bold py-2 rounded-lg">All Brands</DropdownMenuItem>
              {brands.slice(0, 20).map((brand: any) => (
                <DropdownMenuItem key={brand.id} onClick={() => { setSelectedBrand(String(brand.id)); setPage(1); }} className="text-xs font-bold py-2 rounded-lg">{brand.name}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {(selectedCategory || selectedBrand || search) && (
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={() => { setSelectedCategory(null); setSelectedBrand(null); setSearchInput(''); setSearch(''); }}
               className="h-8 px-3 text-[9px] font-black uppercase tracking-wider text-danger hover:bg-danger/5 flex-shrink-0 rounded-full"
             >
               <X size={10} className="mr-1" /> Reset
             </Button>
          )}
        </div>
      </header>
      

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {productsLoading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="animate-spin text-zeronix-blue h-10 w-10" />
                <p className="text-sm font-medium text-admin-text-muted animate-pulse uppercase tracking-widest">Loading Catalog...</p>
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((product: Product) => (
                    <div
                      key={product.id}
                      className="group bg-admin-surface border border-admin-border rounded-xl p-4 hover:border-zeronix-blue/40 transition-all duration-300 shadow-sm flex flex-col"
                    >
                      <div className="flex flex-col mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-black text-zeronix-blue uppercase tracking-tighter">
                            {product.brand?.name || 'GENERIC'}
                          </span>
                          <Badge variant="outline" className="text-[8px] font-bold uppercase p-0 h-auto text-admin-text-muted border-none bg-transparent">
                            {product.category?.name}
                          </Badge>
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-admin-text-primary group-hover:text-zeronix-blue transition-colors line-clamp-2 min-h-[2rem] leading-tight">
                          {product.name}
                        </h3>
                      </div>

                      <div className="bg-admin-bg/50 rounded-lg p-2 border border-admin-border mb-4">
                        <div className="text-[8px] font-bold text-admin-text-muted uppercase tracking-[0.1em] mb-0.5">Model / Part No</div>
                        <code className="text-[10px] font-mono text-emerald-500 font-black block truncate">
                          {product.model_code}
                        </code>
                      </div>

                      <div className="mt-auto pt-3 border-t border-admin-border/50 flex items-center justify-between">
                        <div className="flex flex-col">
                             <span className="text-[8px] font-black uppercase tracking-tighter text-admin-text-muted">Availability</span>
                             <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                               In Stock
                             </span>
                        </div>
                        
                        <Button 
                          size="sm"
                          onClick={() => {
                            addItem(product as any);
                            toast.success(`Added to quote`);
                          }}
                          className="bg-admin-bg hover:bg-zeronix-blue text-admin-text-primary hover:text-white border border-admin-border h-8 px-3 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all"
                        >
                          <Plus size={14} className="mr-1" />
                          Quote
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Standardized Pagination */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-admin-surface border border-admin-border rounded-xl shadow-sm">
                  <div className="text-[11px] font-medium text-admin-text-muted">
                    Showing <span className="text-admin-text-primary">{(page - 1) * 16 + 1}</span>- <span className="text-admin-text-primary">{Math.min(page * 16, total)}</span> of <span className="text-admin-text-primary">{total}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
                      disabled={page === 1}
                      className="h-8 px-3 rounded-lg border-admin-border bg-admin-surface text-[10px] font-black uppercase tracking-widest disabled:opacity-30"
                    >
                      Prev
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {[...Array(Math.min(3, lastPage))].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => { setPage(pageNum); window.scrollTo(0, 0); }}
                            className={cn(
                              "h-8 w-8 p-0 rounded-lg text-[10px] font-black transition-all",
                              page === pageNum ? "bg-zeronix-blue text-white shadow-lg" : "text-admin-text-muted"
                            )}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }}
                      disabled={page >= lastPage}
                      className="h-8 px-3 rounded-lg border-admin-border bg-admin-surface text-[10px] font-black uppercase tracking-widest disabled:opacity-30"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 bg-admin-surface border border-dashed border-admin-border rounded-[2rem]">
                <div className="h-16 w-16 bg-admin-bg rounded-2xl flex items-center justify-center mb-6 border border-admin-border shadow-inner">
                  <X size={24} className="text-admin-text-muted/30" />
                </div>
                <h3 className="text-lg font-bold text-admin-text-primary mb-2">No hardware found</h3>
                <p className="text-admin-text-secondary text-[11px] max-w-xs text-center leading-relaxed mb-8">
                  Try adjusting your filters or search terms to find what you're looking for.
                </p>
                <Button 
                  onClick={() => { setSearchInput(''); setSelectedCategory(null); setSelectedBrand(null); setPage(1); }}
                  className="bg-zeronix-blue hover:bg-zeronix-blue-hover text-white px-8 h-10 rounded-xl font-black uppercase tracking-widest text-[10px]"
                >
                  Clear filters
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="border-t border-admin-border py-8 px-6 bg-admin-surface">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <Logo size="sm" showText />
            <p className="text-[9px] font-black text-admin-text-muted uppercase tracking-widest">Global Distribution Portal</p>
          </div>
          
          <div className="flex items-center gap-6 text-[9px] font-black text-admin-text-muted uppercase tracking-widest">
             <div className="flex items-center gap-2">
               <ShieldCheck size={12} className="text-emerald-500" />
               Quality Assured
             </div>
             <div className="flex items-center gap-2">
               <Globe size={12} className="text-zeronix-blue" />
               Global Sourcing
             </div>
             <span>&copy; 2026 ZERONIX</span>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/971567850662?text=Hi%20Zeronix%2C%20I'm%20interested%20in%20your%20hardware%20inventory."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-3.5 rounded-full shadow-2xl shadow-green-500/30 hover:scale-110 active:scale-95 transition-all duration-300 group"
      >
        <MessageCircle size={24} className="group-hover:rotate-12 transition-transform" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-admin-surface border border-admin-border px-3 py-1.5 rounded-lg text-xs font-black text-admin-text-primary uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
          Chat with Sales
        </span>
      </a>
    </div>
  );
};
