import { getBasePath } from '@/hooks/useBasePath';
import { useState, useEffect } from 'react';
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
import { Loader2, Package } from 'lucide-react';
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
    queryFn: async () => (await api.get(`${getBasePath()}/brands`)).data,
  });
  const brands = brandsData?.data || [];

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get(`${getBasePath()}/categories`)).data,
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

  // Editable Price Component
  const EditablePrice = ({ product }: { product: Product }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(String(product.price || 0));
    const { update } = useResourceMutation('products');

    // Sync local state when product data changes from server
    useEffect(() => {
      if (!isEditing) {
        setLocalValue(String(product.price || 0));
      }
    }, [product.price, isEditing]);

    const handleUpdate = () => {
      const newPrice = Number(localValue);
      setIsEditing(false);
      
      if (newPrice === Number(product.price)) return;
      
      update.mutate({ 
        id: product.id, 
        data: { price: newPrice } 
      });
    };

    if (isEditing) {
      return (
        <input
          autoFocus
          type="number"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleUpdate}
          onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
          className="w-24 h-8 px-2 bg-admin-bg border-2 border-zeronix-blue rounded-lg font-mono text-sm focus:outline-none shadow-sm"
        />
      );
    }

    return (
      <div 
        onDoubleClick={() => setIsEditing(true)}
        className="font-mono text-sm font-bold text-admin-text-primary whitespace-nowrap cursor-pointer hover:text-zeronix-blue hover:bg-zeronix-blue/5 px-2 py-1 rounded-md transition-all group flex items-center gap-1.5 border border-transparent hover:border-zeronix-blue/20"
        title="Double click to edit"
      >
        {Number(localValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        <span className="text-[10px] text-admin-text-muted">AED</span>
      </div>
    );
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
      cell: ({ row }) => <EditablePrice product={row.original} />,
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
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-admin-text-muted/30" />
          <span className="text-[11px] font-semibold text-admin-text-secondary whitespace-nowrap">
            {row.original.category?.name || 'Uncategorized'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'supplier_products_count',
      header: 'Stock Status',
      cell: ({ row }) => {
        const count = row.original.supplier_products_count || 0;
        return (
          <Badge 
            variant="outline" 
            className={`
              text-[9px] font-bold px-1.5 h-5 border-0
              ${count > 0 
                ? 'bg-emerald-500/10 text-emerald-600' 
                : 'bg-amber-500/10 text-amber-600'}
            `}
          >
            {count > 0 ? `${count} SUPPLIERS` : 'NO STOCK'}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'created_at',
      header: 'Added On',
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 min-w-[80px]">
          <span className="text-[11px] font-bold text-admin-text-primary">
            {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) : '—'}
          </span>
          <span className="text-[9px] font-medium text-admin-text-muted uppercase">
            {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString(undefined, { year: 'numeric' }) : ''}
          </span>
        </div>
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
        icon={<Package size={20} />}
        columns={columns}
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
