import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Product, Category, PaginatedResponse } from '@/types';
import { DataTable } from '@/components/shared/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Search, Loader2, Plus, AlertCircle, Send, Filter } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { SEO } from '@/components/shared/SEO';

export const CustomerProducts = () => {
  const navigate = useNavigate();
  const { company } = useParams();
  const addItem = useCartStore((state) => state.addItem);
  const addManualItem = useCartStore((state) => state.addManualItem);
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('all');
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualDescription, setManualDescription] = useState('');
  const [manualQty, setManualQty] = useState(1);

  const { data: productsData, isLoading } = useQuery<PaginatedResponse<Product>>({
    queryKey: ['customer-products', page, search, category],
    queryFn: async () => {
      const params: any = { page, per_page: 15 };
      if (search) params.search = search;
      if (category !== 'all') params.category = category;
      const res = await api.get('/customer/products', { params });
      return res.data;
    }
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/customer/categories')).data
  });

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'model_code',
      header: 'Part Number',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-zeronix-blue font-medium">
          {row.original.model_code || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Product Name',
      cell: ({ row }) => (
        <div className="max-w-[300px] lg:max-w-[450px] truncate text-sm text-admin-text-primary font-medium">
          {row.original.name}
        </div>
      ),
    },
    {
      accessorKey: 'brand',
      header: 'Brand',
      cell: ({ row }) => (
        <span className="text-xs text-admin-text-secondary bg-admin-bg px-2 py-0.5 rounded border border-admin-border">
          {row.original.brand?.name || 'Generic'}
        </span>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <span className="text-xs text-admin-text-muted">
          {row.original.category?.name || 'Hardware'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="secondary"
          size="sm"
          className="h-8 px-3 text-xs font-bold bg-zeronix-blue/10 text-zeronix-blue hover:bg-zeronix-blue hover:text-white transition-all rounded-md"
          onClick={(e) => {
            e.stopPropagation();
            addItem(row.original);
            toast.success(`Added to enquiry`);
          }}
        >
          <ShoppingCart size={13} className="mr-1.5" /> Add
        </Button>
      ),
    },
  ];

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleAddManual = () => {
    if (!manualDescription.trim()) return toast.error('Please enter details');
    addManualItem(manualDescription, manualQty);
    toast.success('Manual item added');
    setManualDescription('');
    setManualQty(1);
    setManualModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <SEO title="Product Catalog" description="Browse enterprise hardware." />
      
      {/* Header - Simplified as requested */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 bg-zeronix-blue rounded-full" />
          <h2 className="text-lg font-bold text-admin-text-primary tracking-tight uppercase">Catalog</h2>
        </div>
        <Button 
          onClick={() => setManualModalOpen(true)}
          variant="outline"
          className="h-9 text-xs font-bold border-admin-border text-admin-text-primary hover:bg-admin-surface-hover rounded-md shadow-sm"
        >
          <Plus size={14} className="mr-1.5 text-zeronix-blue" /> Request Manual Item
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="bg-admin-surface border border-admin-border rounded-md p-3 flex flex-wrap items-center gap-2 shadow-sm">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" size={13} />
          <Input 
            placeholder="Search by part number, name..." 
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="pl-8 h-9 bg-admin-bg border-admin-border text-sm rounded-md"
          />
        </div>
        <div className="flex items-center gap-2">
           <Filter size={13} className="text-admin-text-muted" />
           <Select value={category} onValueChange={setCategory}>
             <SelectTrigger className="h-9 w-44 bg-admin-bg border-admin-border text-xs rounded-md font-medium">
               <SelectValue placeholder="All Categories" />
             </SelectTrigger>
             <SelectContent className="bg-admin-surface border-admin-border">
               <SelectItem value="all">All Categories</SelectItem>
               {categories?.data?.map((c: Category) => (
                 <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
               ))}
             </SelectContent>
           </Select>
           <Button onClick={handleSearch} className="h-9 bg-zeronix-blue text-white px-4 text-xs font-bold rounded-md">
             Filter
           </Button>
        </div>
      </div>

      {/* Table - No background card as requested */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-admin-surface/30 rounded-lg border border-dashed border-admin-border">
            <Loader2 className="h-8 w-8 animate-spin text-zeronix-blue" />
            <p className="text-[10px] font-bold text-admin-text-muted uppercase tracking-widest">Loading Catalog...</p>
          </div>
        ) : productsData?.data && productsData.data.length > 0 ? (
          <>
            <div className="bg-admin-surface border border-admin-border rounded-md overflow-hidden shadow-sm">
              <DataTable
                columns={columns}
                data={productsData.data}
                hidePagination={true}
                renderRowDetails={(product) => (
                  <div className="p-5 bg-admin-bg/50 rounded-lg m-2 border border-admin-border flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-3">
                        <h4 className="text-[10px] font-bold text-admin-text-muted uppercase tracking-widest">Full Product Name</h4>
                        <p className="text-base font-bold text-admin-text-primary leading-tight tracking-tight">
                          {product.name}
                        </p>
                        <div className="flex gap-4 pt-4">
                          <div className="bg-admin-surface p-2 rounded border border-admin-border min-w-[100px]">
                            <p className="text-[9px] text-admin-text-muted font-bold uppercase">Brand</p>
                            <p className="text-xs font-semibold text-admin-text-primary">{product.brand?.name || 'Generic'}</p>
                          </div>
                          <div className="bg-admin-surface p-2 rounded border border-admin-border min-w-[100px]">
                            <p className="text-[9px] text-admin-text-muted font-bold uppercase">Category</p>
                            <p className="text-xs font-semibold text-admin-text-primary">{product.category?.name || 'Hardware'}</p>
                          </div>
                        </div>
                    </div>
                    <div className="md:w-64 flex flex-col justify-center bg-admin-surface p-4 rounded-lg border border-admin-border">
                        <p className="text-[11px] text-admin-text-secondary italic text-center mb-4">
                          "Need a custom solution or bulk pricing?"
                        </p>
                        <Button 
                          className="w-full h-9 bg-zeronix-blue hover:bg-zeronix-blue-hover text-white font-bold text-xs gap-2 shadow-sm"
                          onClick={() => {
                            addItem(product);
                            toast.success('Added to enquiry');
                          }}
                        >
                          <ShoppingCart size={14} /> Add to Enquiry
                        </Button>
                    </div>
                  </div>
                )}
              />
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 mt-2">
              <p className="text-[11px] text-admin-text-muted font-bold uppercase tracking-wider">
                {productsData.total} products available
              </p>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1}
                  className="h-8 text-xs font-medium border-admin-border bg-admin-surface"
                >
                  Prev
                </Button>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-admin-surface border border-admin-border rounded-md">
                  <span className="text-xs font-bold text-admin-text-primary">{page}</span>
                  <span className="text-[10px] text-admin-text-muted">/</span>
                  <span className="text-xs font-medium text-admin-text-muted">{productsData.last_page}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => p + 1)} 
                  disabled={page >= productsData.last_page}
                  className="h-8 text-xs font-medium border-admin-border bg-admin-surface"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-admin-surface/30 rounded-lg border border-dashed border-admin-border">
            <AlertCircle className="h-10 w-10 text-admin-text-muted/30 mb-4" />
            <h3 className="text-sm font-bold text-admin-text-primary mb-2">No results found</h3>
            <p className="text-xs text-admin-text-secondary max-w-[250px] mb-6">
              Couldn't find what you need? Use the manual enquiry option.
            </p>
            <Button onClick={() => setManualModalOpen(true)} className="bg-zeronix-blue text-white h-9 px-6 text-xs font-bold rounded-md gap-2">
              <Send size={14} /> Manual Request
            </Button>
          </div>
        )}
      </div>

      {/* Manual Enquiry Modal */}
      <Dialog open={manualModalOpen} onOpenChange={setManualModalOpen}>
        <DialogContent className="bg-admin-surface border-admin-border sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-admin-text-primary flex items-center gap-2">
              <Plus className="h-5 w-5 text-zeronix-blue" /> Manual Request
            </DialogTitle>
            <DialogDescription className="text-xs text-admin-text-secondary">
              Provide product details and we will source it for you.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted">Description / Part #</Label>
              <Textarea 
                placeholder="e.g. Dell Latitude 5440 with 16GB RAM..."
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                className="bg-admin-bg border-admin-border focus:ring-zeronix-blue/20 min-h-[100px] text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted">Quantity</Label>
              <Input 
                type="number" min={1}
                value={manualQty}
                onChange={(e) => setManualQty(parseInt(e.target.value) || 1)}
                className="bg-admin-bg border-admin-border w-24 h-9"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setManualModalOpen(false)} className="h-9 text-xs border border-admin-border">Cancel</Button>
            <Button onClick={handleAddManual} className="bg-zeronix-blue text-white h-9 px-6 text-xs font-bold">Add to Enquiry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
