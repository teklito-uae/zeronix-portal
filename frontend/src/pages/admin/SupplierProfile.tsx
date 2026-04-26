import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { ColumnDef } from '@tanstack/react-table';
import type { SupplierProduct } from '@/types';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { CopyableText } from '@/components/shared/CopyableText';
import { ActionGroup } from '@/components/shared/ActionGroup';
import { ProductModal } from '@/components/shared/ProductModal';

/**
 * Supplier Profile Detail View
 * Refactored for high-fidelity partner management and catalog tracking.
 */
export const SupplierProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [page, setPage] = useState(1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SupplierProduct | null>(null);

  const { data: supplierData, isLoading } = useQuery({
    queryKey: ['supplier', id, page],
    queryFn: async () => (await api.get(`/admin/suppliers/${id}?page=${page}`)).data
  });

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

  const supplier = supplierData?.supplier;
  const productsResult = supplierData?.products;
  const products = productsResult?.data || [];

  if (isLoading && page === 1) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-zeronix-blue" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-admin-text-muted">Establishing Secure Link...</p>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex items-center justify-center h-64 bg-admin-surface border border-dashed border-admin-border rounded-2xl">
        <p className="text-sm font-bold text-admin-text-muted uppercase tracking-wider">Partner Identity Not Found</p>
      </div>
    );
  }

  const openEdit = (item: SupplierProduct) => {
    setEditingItem(item);
    setEditDialogOpen(true);
  };

  const productColumns: ColumnDef<SupplierProduct>[] = [
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
          {Number(row.original.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] text-admin-text-muted ml-0.5">{row.original.currency}</span>
        </span>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge variant="secondary" className="bg-zeronix-blue/5 text-zeronix-blue border-0 text-[10px] font-bold px-2 h-5 uppercase tracking-tight">
          {row.original.category?.name || '—'}
        </Badge>
      ),
    },
    {
      accessorKey: 'availability',
      header: 'Availability',
      cell: ({ row }) => (
        <Badge
          className={cn(
            "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border",
            row.original.availability
              ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/10'
              : 'bg-red-500/5 text-red-600 border-red-500/10'
          )}
        >
          {row.original.availability ? 'IN STOCK' : 'OUT OF STOCK'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <ActionGroup
          onEdit={() => openEdit(row.original)}
          onView={() => navigate(`/admin/products/${row.original.product_id}`)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-admin-text-primary tracking-tight uppercase">{supplier.name}</h1>
      </div>

      <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden shadow-sm">
         <div className="px-6 py-4 border-b border-admin-border bg-admin-bg/10">
            <h2 className="text-xs font-semibold text-admin-text-primary uppercase tracking-wider">Product Catalog</h2>
         </div>
         <DataTable 
           columns={productColumns} 
           data={products} 
           hidePagination={true}
         />
         
         <div className="flex items-center justify-between px-6 py-4 border-t border-admin-border bg-admin-bg/10">
            <p className="text-[10px] font-bold text-admin-text-muted uppercase tracking-wider">
               Showing {products.length} of {productsResult?.total || 0} entries
            </p>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="h-8 px-3 rounded-md border-admin-border bg-admin-surface font-bold text-[10px] uppercase tracking-wider shadow-sm"
              >
                Prev
              </Button>
              <div className="h-8 px-3 rounded-md bg-admin-bg border border-admin-border flex items-center justify-center font-bold text-[10px] text-zeronix-blue">
                 {page} / {productsResult?.last_page || 1}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => p + 1)} 
                disabled={page >= (productsResult?.last_page || 1)}
                className="h-8 px-3 rounded-md border-admin-border bg-admin-surface font-bold text-[10px] uppercase tracking-wider shadow-sm"
              >
                Next
              </Button>
            </div>
         </div>
      </div>

      <ProductModal
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        editingProduct={editingItem?.product || null}
        brands={brands}
        categories={categories}
      />
    </div>
  );
};
