import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Product, Category, PaginatedResponse } from '@/types';
import { DataTable } from '@/components/shared/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Search, Loader2, Plus, AlertCircle, Filter } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { SEO } from '@/components/shared/SEO';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';

export const CustomerProducts = () => {
  const addItem = useCartStore((state) => state.addItem);
  const addManualItem = useCartStore((state) => state.addManualItem);
  
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('all');
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualDescription, setManualDescription] = useState('');
  const [manualQty, setManualQty] = useState(1);

  const { data: productsData, isLoading } = useQuery<PaginatedResponse<Product>>({
    queryKey: ['customer-products', page, perPage, search, category],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, per_page: perPage };
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
        <span className="font-mono text-sm text-brand-accent font-medium">
          {row.original.model_code || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Product Name',
      cell: ({ row }) => (
        <div className="max-w-[300px] lg:max-w-[450px] truncate text-sm text-brand-primary font-medium">
          {row.original.name}
        </div>
      ),
    },
    {
      accessorKey: 'brand',
      header: 'Brand',
      cell: ({ row }) => (
        <span className="text-xs text-brand-secondary bg-brand-bg px-2 py-0.5 rounded border border-brand-border">
          {row.original.brand?.name || 'Generic'}
        </span>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <span className="text-xs text-brand-subtle">
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
          className="h-8 px-3 text-xs font-bold bg-brand-accent/10 text-brand-accent hover:bg-brand-accent hover:text-white transition-all rounded-md"
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
          <div className="h-8 w-1 bg-brand-accent rounded-full" />
          <h2 className="text-lg font-bold text-brand-primary tracking-tight uppercase">Catalog</h2>
        </div>
        <Button 
          onClick={() => setManualModalOpen(true)}
          variant="outline"
          className="h-9 text-xs font-bold border-brand-border text-brand-primary hover:bg-brand-bg rounded-md shadow-sm"
        >
          <Plus size={14} className="mr-1.5 text-brand-accent" /> Request Manual Item
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="bg-brand-white border border-brand-border rounded-md p-3 flex flex-wrap items-center gap-2 shadow-sm">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-subtle" size={13} />
          <Input 
            placeholder="Search by part number, name..." 
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="pl-8 h-9 bg-brand-bg border-brand-border text-sm rounded-md"
          />
        </div>
        <div className="flex items-center gap-2">
           <Filter size={13} className="text-brand-subtle" />
           <Select value={category} onValueChange={setCategory}>
             <SelectTrigger className="h-9 w-44 bg-brand-bg border-brand-border text-xs rounded-md font-medium">
               <SelectValue placeholder="All Categories" />
             </SelectTrigger>
             <SelectContent className="bg-brand-white border-brand-border">
               <SelectItem value="all">All Categories</SelectItem>
               {categories?.data?.map((c: Category) => (
                 <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
               ))}
             </SelectContent>
           </Select>
           <Button onClick={handleSearch} className="h-9 bg-brand-accent text-white px-4 text-xs font-bold rounded-md">
             Filter
           </Button>
        </div>
      </div>

      {/* Table - No background card as requested */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-brand-white/30 rounded-lg border border-dashed border-brand-border">
            <Loader2 className="h-8 w-8 animate-spin text-brand-accent" />
            <p className="text-[10px] font-bold text-brand-subtle uppercase tracking-widest">Loading Catalog...</p>
          </div>
        ) : productsData?.data && productsData.data.length > 0 ? (
          <>
            <div className="bg-brand-white border border-brand-border rounded-md overflow-hidden shadow-sm">
              <DataTable
                columns={columns}
                data={productsData.data}
                hidePagination={true}
                renderRowDetails={(product) => (
                  <div className="p-5 bg-brand-bg/50 rounded-lg m-2 border border-brand-border flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-3">
                        <h4 className="text-[10px] font-bold text-brand-subtle uppercase tracking-widest">Full Product Name</h4>
                        <p className="text-base font-bold text-brand-primary leading-tight tracking-tight">
                          {product.name}
                        </p>
                        <div className="flex gap-4 pt-4">
                          <div className="bg-brand-white p-2 rounded border border-brand-border min-w-[100px]">
                            <p className="text-[9px] text-brand-subtle font-bold uppercase">Brand</p>
                            <p className="text-xs font-semibold text-brand-primary">{product.brand?.name || 'Generic'}</p>
                          </div>
                          <div className="bg-brand-white p-2 rounded border border-brand-border min-w-[100px]">
                            <p className="text-[9px] text-brand-subtle font-bold uppercase">Category</p>
                            <p className="text-xs font-semibold text-brand-primary">{product.category?.name || 'Hardware'}</p>
                          </div>
                        </div>
                    </div>
                    <div className="md:w-64 flex flex-col justify-center bg-brand-white p-4 rounded-lg border border-brand-border">
                        <p className="text-[11px] text-brand-secondary italic text-center mb-4">
                          "Need a custom solution or bulk pricing?"
                        </p>
                        <Button 
                          className="w-full h-9 bg-brand-accent hover:bg-brand-accent-hover text-white font-bold text-xs gap-2 shadow-sm"
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
            <Pagination
              page={page}
              perPage={perPage}
              total={productsData.total}
              lastPage={productsData.last_page}
              onPageChange={setPage}
              onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
              className="mt-2"
            />
          </>
        ) : (
          <EmptyState
            icon={AlertCircle}
            title="No results found"
            description="Couldn't find what you need? Use the manual enquiry option."
            actionLabel="Manual Request"
            onAction={() => setManualModalOpen(true)}
          />
        )}
      </div>

      {/* Manual Enquiry Sheet */}
      <Sheet open={manualModalOpen} onOpenChange={setManualModalOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[450px] bg-brand-white border-brand-border p-0 flex flex-col gap-0">
          <div className="p-6 border-b border-brand-border flex-shrink-0">
            <SheetHeader className="space-y-1 text-left">
              <SheetTitle className="text-lg font-bold text-brand-primary flex items-center gap-2 pr-6">
                <Plus className="h-5 w-5 text-brand-accent" /> Manual Request
              </SheetTitle>
              <SheetDescription className="text-xs text-brand-secondary">
                Provide product details and we will source it for you.
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 p-6">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-subtle">Description / Part #</Label>
              <Textarea 
                placeholder="e.g. Dell Latitude 5440 with 16GB RAM..."
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                className="bg-brand-bg border-brand-border focus:ring-brand-accent/20 min-h-[100px] text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-brand-subtle">Quantity</Label>
              <Input 
                type="number" min={1}
                value={manualQty}
                onChange={(e) => setManualQty(parseInt(e.target.value) || 1)}
                className="bg-brand-bg border-brand-border w-24 h-9"
              />
            </div>
          </div>

          <div className="p-6 pt-4 border-t border-brand-border flex-shrink-0">
            <SheetFooter className="gap-2 sm:justify-end">
              <Button variant="ghost" onClick={() => setManualModalOpen(false)} className="h-9 text-xs border border-brand-border">Cancel</Button>
              <Button onClick={handleAddManual} className="bg-brand-accent text-white h-9 px-6 text-xs font-bold">Add to Enquiry</Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
