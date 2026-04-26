import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { timeAgo } from '@/lib/utils';
import type { Product } from '@/types';
import { Plus, Trash2, MoreHorizontal, Pencil, Loader2, Search, Filter, X } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

export const Products = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [form, setForm] = useState({
    name: '', model_code: '', brand_id: '', category_id: '', description: '',
  });
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([]);

  // Queries
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', page, search, filterCategory, filterBrand],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), per_page: '15' });
      if (search) params.set('search', search);
      if (filterCategory) params.set('category_id', filterCategory);
      if (filterBrand) params.set('brand_id', filterBrand);
      const res = await api.get(`/admin/products?${params}`);
      return res.data;
    }
  });

  const products = productsData?.data || [];

  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => { const r = await api.get('/admin/brands'); return r.data; }
  });
  const brands = brandsData?.data || [];

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => { const r = await api.get('/admin/categories'); return r.data; }
  });
  const categories = categoriesData?.data || [];

  // Mutations
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      return editingProduct
        ? api.put(`/admin/products/${editingProduct.id}`, data)
        : api.post('/admin/products', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDialogOpen(false);
      toast.success(editingProduct ? 'Product updated' : 'Product added');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteOpen(false);
      toast.success('Product deleted');
    },
  });

  // Handlers
  const openAdd = () => {
    setEditingProduct(null);
    setForm({ name: '', model_code: '', brand_id: '', category_id: '', description: '' });
    setSpecs([{ key: '', value: '' }]);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name, model_code: product.model_code || '',
      brand_id: String(product.brand_id || ''), category_id: String(product.category_id || ''),
      description: product.description || '',
    });
    setSpecs(
      product.specs
        ? Object.entries(product.specs).map(([key, value]) => ({ key, value }))
        : [{ key: '', value: '' }]
    );
    setDialogOpen(true);
  };

  const handleSave = () => {
    const specsObj = specs.filter(s => s.key.trim()).reduce((a, s) => ({ ...a, [s.key]: s.value }), {} as Record<string, string>);
    mutation.mutate({
      ...form,
      brand_id: form.brand_id ? Number(form.brand_id) : null,
      category_id: form.category_id ? Number(form.category_id) : null,
      specs: specsObj,
    });
  };

  const handleSearch = () => { setSearch(searchInput); setPage(1); };
  const clearFilters = () => { setSearch(''); setSearchInput(''); setFilterCategory(''); setFilterBrand(''); setPage(1); };

  const addSpecRow = () => setSpecs([...specs, { key: '', value: '' }]);
  const removeSpecRow = (i: number) => setSpecs(specs.filter((_, idx) => idx !== i));
  const updateSpec = (i: number, field: 'key' | 'value', val: string) => {
    setSpecs(specs.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)));
  };

  const hasActiveFilters = search || filterCategory || filterBrand;

  // Columns
  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'model_code', header: 'Code',
      cell: ({ row }: any) => (
        <span className="font-mono text-xs text-zeronix-blue whitespace-nowrap">{row.original.model_code || '—'}</span>
      ),
    },
    {
      accessorKey: 'name', header: 'Product Name',
      cell: ({ row }: any) => (
        <div className="max-w-[280px]">
          <p className="font-medium text-admin-text-primary truncate" title={row.original.name}>{row.original.name}</p>
        </div>
      ),
    },
    {
      accessorKey: 'brand', header: 'Brand',
      cell: ({ row }: any) => (
        <Badge variant="secondary" className="bg-zeronix-blue/10 text-zeronix-blue border-0 text-xs">
          {row.original.brand?.name || '—'}
        </Badge>
      ),
    },
    {
      accessorKey: 'category', header: 'Category',
      cell: ({ row }: any) => (
        <span className="text-admin-text-secondary text-sm">{row.original.category?.name || '—'}</span>
      ),
    },
    {
      accessorKey: 'supplier_products_count', header: 'Suppliers',
      cell: ({ row }: any) => (
        <span className="text-admin-text-secondary">{row.original.supplier_products_count || 0}</span>
      ),
    },
    {
      accessorKey: 'created_at', header: 'Added',
      cell: ({ row }: any) => (
        <span className="text-xs text-admin-text-muted whitespace-nowrap">
          {row.original.created_at ? timeAgo(row.original.created_at) : '—'}
        </span>
      ),
    },
    {
      id: 'actions', header: '', enableSorting: false,
      cell: ({ row }: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-admin-text-muted hover:text-admin-text-primary" onClick={(e: any) => e.stopPropagation()}>
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-admin-surface border-admin-border">
            <DropdownMenuItem onClick={(e: any) => { e.stopPropagation(); openEdit(row.original); }} className="text-admin-text-secondary hover:bg-admin-surface-hover cursor-pointer">
              <Pencil size={14} className="mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e: any) => { e.stopPropagation(); setDeletingId(row.original.id); setDeleteOpen(true); }} className="text-danger hover:bg-admin-surface-hover cursor-pointer">
              <Trash2 size={14} className="mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading && page === 1) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-zeronix-blue mb-4" />
        <p className="text-admin-text-muted">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" />
            <Input
              placeholder="Search by name or model code..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="pl-9 h-[38px] bg-admin-surface border-admin-border text-admin-text-primary"
            />
          </div>
          <Button onClick={handleSearch} className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover h-[38px]">Search</Button>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={`h-[38px] border-admin-border ${showFilters ? 'bg-zeronix-blue/10 text-zeronix-blue' : 'text-admin-text-secondary'}`}>
            <Filter size={16} className="mr-1" /> Filters
          </Button>
          <Button onClick={openAdd} className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover h-[38px] font-medium">
            <Plus size={16} className="mr-1" /> Add Product
          </Button>
        </div>

        {showFilters && (
          <div className="flex items-center gap-3 p-3 bg-admin-surface border border-admin-border rounded-lg">
            <Select value={filterCategory} onValueChange={v => { setFilterCategory(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-48 h-[34px] bg-admin-bg border-admin-border text-admin-text-primary text-sm">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-admin-surface border-admin-border">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterBrand} onValueChange={v => { setFilterBrand(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-48 h-[34px] bg-admin-bg border-admin-border text-admin-text-primary text-sm">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent className="bg-admin-surface border-admin-border">
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((b: any) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-admin-text-muted hover:text-danger text-xs">
                <X size={14} className="mr-1" /> Clear All
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={products}
        onRowClick={(row: any) => navigate(`/admin/products/${row.id}`)}
        hidePagination={true}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between py-2">
        <p className="text-sm text-admin-text-muted">{productsData?.total || 0} products total</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="bg-admin-surface border-admin-border text-admin-text-secondary">Previous</Button>
          <span className="text-sm text-admin-text-muted px-2">Page {page} of {productsData?.last_page || 1}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= (productsData?.last_page || 1)} className="bg-admin-surface border-admin-border text-admin-text-secondary">Next</Button>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-admin-surface border-admin-border sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-admin-text-primary">{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogDescription className="text-admin-text-secondary">{editingProduct ? 'Update product details.' : 'Enter product information.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-admin-text-secondary text-sm">Product Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary" placeholder="Product name" />
            </div>
            <div className="space-y-2">
              <Label className="text-admin-text-secondary text-sm">Model Code</Label>
              <Input value={form.model_code} onChange={e => setForm({ ...form, model_code: e.target.value })} className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary font-mono" placeholder="e.g. 6ES7 515-2AM02-0AB0" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-admin-text-secondary text-sm">Brand</Label>
                <Select value={form.brand_id} onValueChange={val => setForm({ ...form, brand_id: val })}>
                  <SelectTrigger className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary"><SelectValue placeholder="Select brand" /></SelectTrigger>
                  <SelectContent className="bg-admin-surface border-admin-border">
                    {brands.map((b: any) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-admin-text-secondary text-sm">Category</Label>
                <Select value={form.category_id} onValueChange={val => setForm({ ...form, category_id: val })}>
                  <SelectTrigger className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent className="bg-admin-surface border-admin-border">
                    {categories.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.parent_id ? `  └ ${c.name}` : c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-admin-text-secondary text-sm">Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-admin-bg border-admin-border text-admin-text-primary resize-none" placeholder="Product description..." rows={3} />
            </div>
            {/* Specs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-admin-text-primary font-semibold">Specifications</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addSpecRow} className="text-zeronix-blue hover:bg-zeronix-blue/10 h-7 text-xs">
                  <Plus size={14} className="mr-1" /> Add Spec
                </Button>
              </div>
              {specs.map((spec, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input value={spec.key} onChange={e => updateSpec(i, 'key', e.target.value)} placeholder="Key" className="h-[34px] bg-admin-bg border-admin-border text-admin-text-primary text-sm flex-1" />
                  <Input value={spec.value} onChange={e => updateSpec(i, 'value', e.target.value)} placeholder="Value" className="h-[34px] bg-admin-bg border-admin-border text-admin-text-primary text-sm flex-1" />
                  {specs.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSpecRow(i)} className="h-[34px] w-[34px] text-admin-text-muted hover:text-danger flex-shrink-0">
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-admin-text-secondary">Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || mutation.isPending} className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover min-w-[100px]">
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingProduct ? 'Save Changes' : 'Add Product')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Product" description="Are you sure?" confirmLabel="Delete" onConfirm={() => deletingId && deleteMutation.mutate(deletingId)} variant="destructive" />
    </div>
  );
};
