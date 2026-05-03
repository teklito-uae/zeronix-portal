import { useState, useEffect } from 'react';
import { usePublicResourceList } from '@/hooks/useApi';
import { SEO } from '@/components/shared/SEO';
import { useCartStore } from '@/store/useCartStore';
import { useThemeStore } from '@/store/useThemeStore';
import { Logo } from '@/components/shared/Logo';
import { 
  Search, 
  ChevronRight, 
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
  ChevronDown
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
    per_page: 12
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
      <SEO title="Inventory Portal | ZERONIX" description="Request a quote for enterprise-grade hardware and components." />
      
      {/* Header with Categories MegaMenu */}
      <header className="sticky top-0 z-50 w-full border-b border-admin-border bg-admin-surface/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Logo size="md" showText />
            
            {/* Navigation Menus - Now visible on mobile */}
            <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
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

              {/* Brands Dropdown */}
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
                  {brands.slice(0, 12).map((brand: any) => (
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

          <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
            <div className="relative flex-1 max-w-md group min-w-[140px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted group-focus-within:text-zeronix-blue transition-colors" />
              <Input 
                placeholder="Search inventory..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 bg-admin-bg border-admin-border h-9 text-sm focus:ring-zeronix-blue/10 w-full"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleTheme(true)}
              className="h-9 w-9 text-admin-text-secondary hover:text-admin-text-primary hover:bg-admin-surface-hover"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button className="relative bg-zeronix-blue hover:bg-zeronix-blue-hover text-white rounded-lg h-9 px-4 font-bold text-xs uppercase tracking-wider shadow-lg shadow-zeronix-blue/20">
                  <ShoppingCart size={16} className="mr-2" />
                  RFQ
                  {items.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-white text-zeronix-blue text-[10px] font-black flex items-center justify-center rounded-full border-2 border-zeronix-blue animate-in zoom-in">
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
      </header>
      
      {/* Mini Breadcrumb / Hero Replacement */}
      <div className="bg-admin-surface border-b border-admin-border py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="text-admin-text-muted hover:text-admin-text-primary cursor-pointer" onClick={() => { setSelectedCategory(null); setSelectedBrand(null); setPage(1); }}>Home</span>
            <ChevronRight size={12} className="text-admin-text-muted/50" />
            <span className="text-admin-text-primary font-bold">Inventory</span>
            {selectedCategory && (
              <>
                <ChevronRight size={12} className="text-admin-text-muted/50" />
                <span className="text-zeronix-blue font-bold uppercase tracking-tight">{categories.find((c: any) => String(c.id) === selectedCategory)?.name}</span>
              </>
            )}
          </div>
          <div className="text-[10px] font-bold text-admin-text-muted uppercase tracking-widest">
            {total} Products Available
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {productsLoading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="animate-spin text-zeronix-blue h-10 w-10" />
                <p className="text-sm font-medium text-admin-text-muted animate-pulse">Syncing Inventory...</p>
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map((product: Product) => (
                    <div
                      key={product.id}
                      className="group bg-admin-surface border border-admin-border rounded-2xl p-6 hover:border-zeronix-blue/40 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-zeronix-blue/5 flex flex-col"
                    >
                      <div className="flex flex-col mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase py-0 border-admin-border bg-admin-bg/50 text-admin-text-muted">
                            {product.category?.name || 'Hardware'}
                          </Badge>
                          {product.brand && (
                            <span className="text-[10px] font-black text-zeronix-blue uppercase tracking-tighter">{product.brand.name}</span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-admin-text-primary group-hover:text-zeronix-blue transition-colors leading-snug line-clamp-2 min-h-[3rem]">
                          {product.name}
                        </h3>
                      </div>

                      <div className="bg-admin-bg/50 rounded-xl p-3 border border-admin-border mb-4">
                        <div className="text-[8px] font-bold text-admin-text-muted uppercase tracking-[0.2em] mb-1">Model / PN</div>
                        <code className="text-xs font-mono text-emerald-500 font-bold block truncate">
                          {product.model_code || 'ZNX-PART-101'}
                        </code>
                      </div>

                      <p className="text-xs text-admin-text-secondary line-clamp-2 leading-relaxed mb-6">
                        {product.description || 'High-performance component optimized for enterprise systems and professional workflows.'}
                      </p>

                      <div className="mt-auto pt-4 border-t border-admin-border flex items-center justify-between">
                        <div className="flex items-center gap-4 text-admin-text-muted">
                           <div className="flex flex-col">
                             <span className="text-[8px] font-black uppercase tracking-tighter">Status</span>
                             <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                               Available
                             </span>
                           </div>
                        </div>
                        
                        <Button 
                          size="sm"
                          onClick={() => {
                            addItem(product as any);
                            toast.success(`Added ${product.name} to quote`);
                          }}
                          className="bg-admin-bg hover:bg-zeronix-blue text-admin-text-primary hover:text-white border border-admin-border h-8 px-4 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all"
                        >
                          <Plus size={14} className="mr-1.5" />
                          Add Quote
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Standardized Pagination */}
                <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-admin-surface border border-admin-border rounded-2xl shadow-sm">
                  <div className="text-xs font-medium text-admin-text-muted">
                    Showing <span className="text-admin-text-primary">{(page - 1) * 12 + 1}</span> to <span className="text-admin-text-primary">{Math.min(page * 12, total)}</span> of <span className="text-admin-text-primary">{total}</span> items
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
                      disabled={page === 1}
                      className="h-9 px-4 rounded-lg border-admin-border bg-admin-surface hover:bg-admin-surface-hover text-xs font-bold shadow-sm transition-all disabled:opacity-30"
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      {[...Array(Math.min(5, lastPage))].map((_, i) => {
                        const pageNum = i + 1;
                        // Simple logic for showing pages near current
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => { setPage(pageNum); window.scrollTo(0, 0); }}
                            className={cn(
                              "h-9 w-9 p-0 rounded-lg text-xs font-bold transition-all",
                              page === pageNum ? "bg-zeronix-blue text-white shadow-lg shadow-zeronix-blue/20" : "text-admin-text-muted hover:bg-admin-surface-hover hover:text-admin-text-primary"
                            )}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      {lastPage > 5 && <span className="text-admin-text-muted px-1">...</span>}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }}
                      disabled={page >= lastPage}
                      className="h-9 px-4 rounded-lg border-admin-border bg-admin-surface hover:bg-admin-surface-hover text-xs font-bold shadow-sm transition-all disabled:opacity-30"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-40 bg-admin-surface border border-dashed border-admin-border rounded-[2.5rem]">
                <div className="h-20 w-20 bg-admin-bg rounded-3xl flex items-center justify-center mb-6 border border-admin-border shadow-inner">
                  <X size={32} className="text-admin-text-muted/30" />
                </div>
                <h3 className="text-xl font-bold text-admin-text-primary mb-2">No hardware found</h3>
                <p className="text-admin-text-secondary text-sm max-w-xs text-center leading-relaxed mb-8">
                  Try adjusting your filters or search terms to find what you're looking for.
                </p>
                <Button 
                  onClick={() => { setSearchInput(''); setSelectedCategory(null); setSelectedBrand(null); setPage(1); }}
                  className="bg-zeronix-blue hover:bg-zeronix-blue-hover text-white px-8 h-11 rounded-xl font-bold uppercase tracking-widest"
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="border-t border-admin-border py-12 px-6 bg-admin-surface">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Logo size="sm" showText />
            <p className="text-[10px] font-bold text-admin-text-muted uppercase tracking-widest">Global Distribution Portal</p>
          </div>
          
          <div className="flex items-center gap-8 text-[10px] font-bold text-admin-text-muted uppercase tracking-widest">
             <div className="flex items-center gap-2">
               <ShieldCheck size={14} className="text-emerald-500" />
               Quality Assured
             </div>
             <div className="flex items-center gap-2">
               <Globe size={14} className="text-zeronix-blue" />
               Global Sourcing
             </div>
             <span>&copy; 2026 ZERONIX</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
