import { getBasePath } from '@/hooks/useBasePath';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Product } from '@/types';
import { Plus, Loader2, Package } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useResourceMutation } from '@/hooks/useApi';
import { ResourceListingPage } from '@/components/shared/ResourceListingPage';
import { CopyableText } from '@/components/shared/CopyableText';
import { ActionGroup } from '@/components/shared/ActionGroup';
import { ProductModal } from '@/components/shared/ProductModal';

/**
 * Products Module
 * Refactored to use the standardized State-Driven architecture.
 */
export const Products = () => {
  const navigate = useNavigate();

  // Dialog States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false);
  const [bulkUpdateForm, setBulkUpdateForm] = useState({ brand_id: '', category_id: '' });

  // CRUD State Hooks
  const { remove, bulkUpdate } = useResourceMutation('products');

  // Fetch static data for filters/forms
  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => (await api.get(`/admin/brands`)).data,
  });
  const brands = brandsData?.data || [];

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get(`/admin/categories`)).data,
  });
  const categories = categoriesData?.data || [];

  // Handlers
  const openAdd = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const columns: ColumnDef<Product>[] = [
    {
      id: 'selection',
      header: () => (
        <div className="flex items-center px-1">
          <input
            type="checkbox"
            className="w-[18px] h-[18px] rounded border-brand-border/50 bg-brand-surface text-brand-accent focus:ring-0 cursor-pointer shadow-sm"
            checked={selectedIds.length > 0}
            onChange={(_e) => {}}
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center px-1">
          <input
            type="checkbox"
            className="w-[18px] h-[18px] rounded border-brand-border/50 bg-brand-surface text-brand-accent focus:ring-0 cursor-pointer shadow-sm"
            checked={selectedIds.includes(row.original.id)}
            onChange={(e) => {
              e.stopPropagation();
              if (e.target.checked) setSelectedIds([...selectedIds, row.original.id]);
              else setSelectedIds(selectedIds.filter(id => id !== row.original.id));
            }}
          />
        </div>
      ),
    },
    {
      accessorKey: 'model_code',
      header: 'Code',
      cell: ({ row }) => (
        <span className="font-mono text-[11px] font-semibold text-brand-accent bg-brand-accent/5 px-2.5 py-1 rounded-md border border-brand-accent/10 shadow-sm">
          {row.original.model_code || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Product Name',
      cell: ({ row }) => <CopyableText value={row.original.name} limit={85} />,
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge variant="secondary" className="bg-brand-surface border-brand-border/50 text-brand-primary text-[10px] font-semibold px-2 py-0.5 uppercase tracking-wider">
          {(row.original as any).category?.name || 'Uncategorized'}
        </Badge>
      ),
    },
    {
      accessorKey: 'brand',
      header: 'Brand',
      cell: ({ row }) => (
        <Badge variant="secondary" className="bg-brand-info-bg text-brand-info border-brand-info/20 text-[10px] font-semibold px-2 py-0.5 uppercase tracking-wider">
          {row.original.brand?.name || '—'}
        </Badge>
      ),
    },
    {
      accessorKey: 'supplier_products',
      header: 'Suppliers',
      cell: ({ row }) => {
        const suppliers = row.original.supplier_products || [];
        if (suppliers.length === 0) return <span className="text-[11px] text-brand-subtle italic">None</span>;
        return (
          <div className="flex flex-wrap gap-1 max-w-[150px]">
            {suppliers.map((sp: any, i: number) => (
              <Badge key={i} variant="outline" className="bg-brand-surface border-brand-border/50 text-[10px] px-1.5 py-0 font-medium text-brand-secondary">
                {sp.supplier?.name}
              </Badge>
            ))}
          </div>
        );
      }
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider ${row.original.is_active ? 'bg-brand-success-bg text-brand-success border-brand-success/20' : 'bg-brand-warning-bg text-brand-warning border-brand-warning/20'}`}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <ActionGroup
          onEdit={() => openEdit(row.original)}
          onDelete={() => { setDeletingId(row.original.id); setDeleteOpen(true); }}
          onView={() => navigate(`${getBasePath()}/products/${row.original.id}`)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Listing Engine */}
      <ResourceListingPage<Product>
        resource="products"
        title="Products Inventory"
        subtitle="Manage your global IT and hardware stock."
        icon={<Package size={20} />}
        columns={columns}
        onRowClick={(row) => navigate(`${getBasePath()}/products/${row.id}`)}
        createLabel="Add Product"
        createPath="#" // We use openAdd instead
        onCreateClick={openAdd}
        searchPlaceholder="Search by name, model, or brand..."
        filters={[
          {
            name: 'brand_id',
            label: 'Brand',
            placeholder: 'Filter by brand',
            options: brands.map((b: any) => ({ label: b.name, value: String(b.id) }))
          },
          {
            name: 'category_id',
            label: 'Category',
            placeholder: 'Filter by category',
            options: categories.map((c: any) => ({ label: c.name, value: String(c.id) }))
          }
        ]}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        onBulkUpdate={() => setBulkUpdateOpen(true)}
      />

      {/* Manual Button for Add (Since we use a modal not a path) */}
      <div className="fixed bottom-8 right-8 z-50 lg:hidden">
        <Button onClick={openAdd} className="h-14 w-14 rounded-full bg-brand-primary shadow-xl text-brand-white hover:scale-110 active:scale-90 transition-all">
          <Plus size={24} />
        </Button>
      </div>

      <ProductModal
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editingProduct={editingProduct}
        brands={brands}
        categories={categories}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog 
        open={deleteOpen} 
        onOpenChange={setDeleteOpen} 
        title="Delete Product" 
        description="This action cannot be undone. This product will be removed from all inventory listings." 
        confirmLabel="Yes, Delete Product" 
        onConfirm={() => deletingId && remove.mutate(deletingId)} 
        variant="destructive" 
      />

      {/* Bulk Update Dialog */}
      <Dialog open={bulkUpdateOpen} onOpenChange={setBulkUpdateOpen}>
        <DialogContent className="bg-brand-white border-brand-border/50 sm:max-w-md rounded-xl shadow-xl p-0 overflow-hidden">
          <div className="p-6 bg-brand-surface border-b border-brand-border/50">
            <DialogHeader>
              <DialogTitle className="text-[16px] font-semibold text-brand-primary">Bulk Update Products</DialogTitle>
              <DialogDescription className="text-[13px] text-brand-subtle mt-0.5">
                Apply changes to {selectedIds.length} selected products.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-5 p-6">
            <div className="space-y-2">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Change Brand To</Label>
              <Select value={bulkUpdateForm.brand_id} onValueChange={val => setBulkUpdateForm({ ...bulkUpdateForm, brand_id: val })}>
                <SelectTrigger className="h-[36px] bg-brand-surface border-brand-border/50 text-brand-primary rounded-lg text-[13px] font-medium">
                  <SelectValue placeholder="Leave as is" />
                </SelectTrigger>
                <SelectContent className="bg-brand-white border-brand-border/50 rounded-xl shadow-lg">
                  <SelectItem value="none">No Change</SelectItem>
                  {brands.map((b: any) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Change Category To</Label>
              <Select value={bulkUpdateForm.category_id} onValueChange={val => setBulkUpdateForm({ ...bulkUpdateForm, category_id: val })}>
                <SelectTrigger className="h-[36px] bg-brand-surface border-brand-border/50 text-brand-primary rounded-lg text-[13px] font-medium">
                  <SelectValue placeholder="Leave as is" />
                </SelectTrigger>
                <SelectContent className="bg-brand-white border-brand-border/50 rounded-xl shadow-lg">
                  <SelectItem value="none">No Change</SelectItem>
                  {categories.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="p-6 pt-2">
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setBulkUpdateOpen(false)} className="rounded-lg text-[13px] font-medium">Cancel</Button>
              <Button
                onClick={() => {
                  const data: any = { ids: selectedIds };
                  if (bulkUpdateForm.brand_id && bulkUpdateForm.brand_id !== 'none') data.brand_id = Number(bulkUpdateForm.brand_id);
                  if (bulkUpdateForm.category_id && bulkUpdateForm.category_id !== 'none') data.category_id = Number(bulkUpdateForm.category_id);
                  bulkUpdate.mutate(data);
                }}
                disabled={(!bulkUpdateForm.brand_id && !bulkUpdateForm.category_id) || bulkUpdate.isPending}
                className="bg-brand-primary text-brand-white hover:opacity-90 rounded-lg text-[13px] font-medium px-6 shadow-sm"
              >
                {bulkUpdate.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Apply Updates
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
