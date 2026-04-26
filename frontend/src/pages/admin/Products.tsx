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
    queryFn: async () => (await api.get('/admin/brands')).data,
  });
  const brands = brandsData?.data || [];

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/admin/categories')).data,
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
            className="w-4 h-4 rounded border-admin-border bg-admin-bg text-zeronix-blue focus:ring-0 cursor-pointer"
            checked={selectedIds.length > 0}
            onChange={(_e) => {
               // Managed by ResourceListingPage in future, or manually for now
            }}
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center px-1">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-admin-border bg-admin-bg text-zeronix-blue focus:ring-0 cursor-pointer"
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
        <span className="font-mono text-[11px] font-medium text-zeronix-blue bg-zeronix-blue/5 px-2 py-0.5 rounded whitespace-nowrap border border-zeronix-blue/10">
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
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-bold text-admin-text-primary whitespace-nowrap">
          {Number(row.original.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] text-admin-text-muted ml-0.5">AED</span>
        </span>
      ),
    },
    {
      accessorKey: 'brand',
      header: 'Brand',
      cell: ({ row }) => (
        <Badge variant="secondary" className="bg-zeronix-blue/5 text-zeronix-blue border-0 text-[10px] font-bold px-2 h-5 uppercase tracking-tight">
          {row.original.brand?.name || '—'}
        </Badge>
      ),
    },
    {
      accessorKey: 'supplier_products',
      header: 'Suppliers',
      cell: ({ row }) => {
        const suppliers = row.original.supplier_products || [];
        if (suppliers.length === 0) return <span className="text-[10px] text-admin-text-muted italic">None</span>;
        return (
          <div className="flex flex-wrap gap-1 max-w-[150px]">
            {suppliers.map((sp: any, i: number) => (
              <Badge key={i} variant="outline" className="bg-admin-bg border-admin-border text-[9px] px-1 h-4 text-admin-text-secondary">
                {sp.supplier?.name}
              </Badge>
            ))}
          </div>
        );
      }
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <ActionGroup
          onEdit={() => openEdit(row.original)}
          onDelete={() => { setDeletingId(row.original.id); setDeleteOpen(true); }}
          onView={() => navigate(`/admin/products/${row.original.id}`)}
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
        onRowClick={(row) => navigate(`/admin/products/${row.id}`)}
        createLabel="Add Product"
        createPath="#" // We use openAdd instead
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
        <Button onClick={openAdd} className="h-14 w-14 rounded-full bg-zeronix-blue shadow-xl text-white hover:scale-110 active:scale-90 transition-all">
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
        <DialogContent className="bg-admin-surface border-admin-border sm:max-w-md rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-admin-text-primary">Bulk Update</DialogTitle>
            <DialogDescription className="text-admin-text-secondary">
              Apply changes to {selectedIds.length} selected products.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Change Brand To</Label>
              <Select value={bulkUpdateForm.brand_id} onValueChange={val => setBulkUpdateForm({ ...bulkUpdateForm, brand_id: val })}>
                <SelectTrigger className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl">
                  <SelectValue placeholder="Leave as is" />
                </SelectTrigger>
                <SelectContent className="bg-admin-surface border-admin-border rounded-xl">
                  <SelectItem value="none">No Change</SelectItem>
                  {brands.map((b: any) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-admin-text-muted ml-1">Change Category To</Label>
              <Select value={bulkUpdateForm.category_id} onValueChange={val => setBulkUpdateForm({ ...bulkUpdateForm, category_id: val })}>
                <SelectTrigger className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl">
                  <SelectValue placeholder="Leave as is" />
                </SelectTrigger>
                <SelectContent className="bg-admin-surface border-admin-border rounded-xl">
                  <SelectItem value="none">No Change</SelectItem>
                  {categories.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setBulkUpdateOpen(false)} className="text-admin-text-secondary rounded-xl">Cancel</Button>
            <Button
              onClick={() => {
                const data: any = { ids: selectedIds };
                if (bulkUpdateForm.brand_id && bulkUpdateForm.brand_id !== 'none') data.brand_id = Number(bulkUpdateForm.brand_id);
                if (bulkUpdateForm.category_id && bulkUpdateForm.category_id !== 'none') data.category_id = Number(bulkUpdateForm.category_id);
                bulkUpdate.mutate(data);
              }}
              disabled={(!bulkUpdateForm.brand_id && !bulkUpdateForm.category_id) || bulkUpdate.isPending}
              className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover rounded-xl font-bold shadow-lg"
            >
              {bulkUpdate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply Updates'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
