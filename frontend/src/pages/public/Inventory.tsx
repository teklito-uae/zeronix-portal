import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { SEO } from '@/components/shared/SEO';
import { 
  Search, 
  Package, 
  Layers, 
  ChevronRight, 
  ArrowRight,
  Loader2,
  X,
  LayoutGrid,
  List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Product {
  id: number;
  name: string;
  model_code: string;
  brand?: { name: string };
  category?: { name: string };
  image?: string;
  description?: string;
}

export const PublicInventory = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Data Fetching
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['public-products', search, selectedCategory, selectedBrand],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedBrand) params.brand_id = selectedBrand;
      const res = await api.get('/public/products', { params });
      return res.data;
    }
  });

  const { data: categories } = useQuery({
    queryKey: ['public-categories'],
    queryFn: async () => (await api.get('/public/categories')).data
  });

  const { data: brands } = useQuery({
    queryKey: ['public-brands'],
    queryFn: async () => (await api.get('/public/brands')).data
  });

  const products = productsData?.data || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-zeronix-blue/30">
      <SEO title="Product Inventory" description="Browse our extensive collection of tech hardware and components." />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-16 pb-8 px-6 border-b border-white/5 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-zeronix-blue/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-emerald-500/5 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div
            className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
          >
            <Badge className="mb-4 bg-zeronix-blue/10 text-zeronix-blue border-zeronix-blue/20 px-3 py-1 text-[10px] uppercase tracking-widest font-bold">
              Premium Hardware Solutions
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
              Inventory <span className="text-transparent bg-clip-text bg-gradient-to-r from-zeronix-blue to-emerald-400">Hub</span>
            </h1>
            <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
              Explore our comprehensive range of high-performance components and enterprise systems.
            </p>
          </div>

          <div 
            className="mt-10 max-w-xl mx-auto flex items-center gap-2 bg-white/5 p-1.5 rounded-full border border-white/10 shadow-2xl focus-within:border-zeronix-blue/50 focus-within:ring-1 focus-within:ring-zeronix-blue/50 transition-all group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both"
          >
            <div className="pl-4 text-slate-500 group-focus-within:text-zeronix-blue transition-colors">
              <Search size={20} />
            </div>
            <input 
              type="text"
              placeholder="Search components by name or model code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-600 text-sm py-2"
            />
            <Button className="rounded-full bg-zeronix-blue hover:bg-zeronix-blue/90 text-white px-6 font-bold tracking-tight shadow-lg shadow-zeronix-blue/20">
              Search
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-72 shrink-0 space-y-8">
            <div>
              <div className="flex items-center gap-2 text-white font-bold mb-4">
                <Layers size={18} className="text-zeronix-blue" />
                Categories
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between group",
                    !selectedCategory ? "bg-zeronix-blue text-white shadow-lg shadow-zeronix-blue/20" : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  All Categories
                  <ChevronRight size={14} className={cn("transition-transform", !selectedCategory ? "translate-x-0" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100")} />
                </button>
                {categories?.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(String(cat.id))}
                    className={cn(
                      "w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between group",
                      selectedCategory === String(cat.id) ? "bg-zeronix-blue text-white shadow-lg shadow-zeronix-blue/20" : "text-slate-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {cat.name}
                    <ChevronRight size={14} className={cn("transition-transform", selectedCategory === String(cat.id) ? "translate-x-0" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100")} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-white font-bold mb-4">
                <Package size={18} className="text-emerald-500" />
                Popular Brands
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedBrand(null)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-bold transition-all border",
                    !selectedBrand ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-white/5 border-white/10 text-slate-400 hover:border-emerald-500/20 hover:text-white"
                  )}
                >
                  All Brands
                </button>
                {brands?.slice(0, 10).map((brand: any) => (
                  <button
                    key={brand.id}
                    onClick={() => setSelectedBrand(String(brand.id))}
                    className={cn(
                      "px-3 py-2 rounded-lg text-xs font-bold transition-all border truncate",
                      selectedBrand === String(brand.id) ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-white/5 border-white/10 text-slate-400 hover:border-emerald-500/20 hover:text-white"
                    )}
                  >
                    {brand.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-zeronix-blue/20 to-emerald-500/20 rounded-3xl border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Package size={80} />
              </div>
              <h3 className="text-white font-bold mb-2 relative z-10">Custom Sourcing?</h3>
              <p className="text-slate-300 text-xs leading-relaxed mb-4 relative z-10">
                Can't find a specific component? Our procurement team can source rare and enterprise-grade hardware globally.
              </p>
              <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl h-10 shadow-xl relative z-10">
                Submit Request
              </Button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
              <div className="text-sm text-slate-400 font-medium">
                Showing <span className="text-white font-bold">{products.length}</span> high-performance products
              </div>
              
              <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-white/10 text-white shadow-inner" : "text-slate-500 hover:text-slate-300")}
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-white/10 text-white shadow-inner" : "text-slate-500 hover:text-slate-300")}
                >
                  <List size={18} />
                </button>
              </div>
            </div>

            {productsLoading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="animate-spin text-zeronix-blue h-10 w-10" />
                <p className="text-slate-400 font-medium animate-pulse uppercase tracking-widest text-[10px]">Updating Inventory...</p>
              </div>
            ) : products.length > 0 ? (
              <div 
                className={cn(
                  "grid gap-6 animate-in fade-in duration-500",
                  viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
                )}
              >
                {products.map((product: Product) => (
                  <div
                    key={product.id}
                    className={cn(
                      "group bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden hover:border-zeronix-blue/30 transition-all duration-500 shadow-2xl hover:shadow-zeronix-blue/5 animate-in fade-in zoom-in-95 duration-300",
                      viewMode === 'list' && "flex flex-col md:flex-row items-center gap-6 p-4"
                    )}
                  >
                      {/* Product Image */}
                      <div className={cn(
                        "relative bg-slate-950 overflow-hidden",
                        viewMode === 'grid' ? "aspect-[4/3] w-full" : "aspect-square w-full md:w-48 rounded-2xl shrink-0"
                      )}>
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 text-slate-700">
                            <Package size={viewMode === 'grid' ? 64 : 48} strokeWidth={1} />
                            <span className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-50">Zeronix Certified</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                        
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-slate-950/80 backdrop-blur-md border-white/10 text-[10px] text-slate-300">
                            {product.model_code}
                          </Badge>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className={cn(
                        "p-6 flex flex-col",
                        viewMode === 'list' && "p-0 flex-1 h-full py-2"
                      )}>
                        <div className="flex items-center gap-2 mb-2">
                          {product.brand && (
                            <span className="text-[10px] font-black text-zeronix-blue uppercase tracking-wider">{product.brand.name}</span>
                          )}
                          <div className="h-1 w-1 rounded-full bg-slate-700" />
                          {product.category && (
                            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{product.category.name}</span>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-bold text-white group-hover:text-zeronix-blue transition-colors line-clamp-1 mb-2">
                          {product.name}
                        </h3>
                        
                        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed mb-6 font-medium">
                          {product.description || 'High-performance component optimized for professional and enterprise workloads.'}
                        </p>

                        <div className="mt-auto flex items-center justify-between gap-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Status</span>
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Ready to Source
                            </span>
                          </div>
                          
                          <button className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-zeronix-blue group-hover:border-zeronix-blue transition-all duration-300">
                            <ArrowRight size={18} />
                          </button>
                        </div>
                      </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 bg-slate-900/30 rounded-[40px] border border-dashed border-white/5">
                <div className="h-20 w-20 bg-slate-950 rounded-full flex items-center justify-center mb-6 border border-white/5 shadow-2xl">
                  <X size={32} className="text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No components found</h3>
                <p className="text-slate-400 text-sm max-w-xs text-center leading-relaxed">
                  We couldn't find any products matching your search criteria. Try broadening your filters.
                </p>
                <Button 
                  onClick={() => { setSearch(''); setSelectedCategory(null); setSelectedBrand(null); }}
                  variant="outline" 
                  className="mt-8 border-white/10 hover:bg-white/5 text-slate-300 px-8 rounded-full"
                >
                  Reset All Filters
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
      
      {/* Footer / CTA */}
      <footer className="border-t border-white/5 py-16 px-6 mt-20 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="max-w-md">
            <h2 className="text-3xl font-black text-white mb-4">Ready to upgrade your infrastructure?</h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              Contact our sales specialists for volume pricing, custom configurations, and enterprise support agreements.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button className="bg-zeronix-blue hover:bg-zeronix-blue/90 text-white px-8 h-12 font-bold rounded-2xl shadow-xl shadow-zeronix-blue/20">
              Get Enterprise Quote
            </Button>
            <Button variant="outline" className="border-white/10 hover:bg-white/5 text-white px-8 h-12 font-bold rounded-2xl">
              Contact Support
            </Button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="text-xs font-bold text-slate-600 tracking-widest uppercase">
            &copy; 2026 ZERONIX PORTAL — PROFESSIONAL HARDWARE DISTRIBUTION
          </div>
          <div className="flex items-center gap-8 text-[10px] font-black text-slate-500 tracking-widest uppercase">
            <a href="#" className="hover:text-zeronix-blue transition-colors">Privacy</a>
            <a href="#" className="hover:text-zeronix-blue transition-colors">Terms</a>
            <a href="#" className="hover:text-zeronix-blue transition-colors">Global Network</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
