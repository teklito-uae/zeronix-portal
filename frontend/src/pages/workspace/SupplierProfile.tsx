import { getBasePath } from '@/hooks/useBasePath';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { ColumnDef } from '@tanstack/react-table';
import type { SupplierProduct } from '@/types';
import { cn } from '@/lib/utils';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { CopyableText } from '@/components/shared/CopyableText';
import { ActionGroup } from '@/components/shared/ActionGroup';
import { ProductModal } from '@/components/shared/ProductModal';
import { PageLoader } from '@/components/shared/PageLoader';
import Avatar from 'boring-avatars';
import { useThemeStore } from '@/store/useThemeStore';
import { Mail, Phone, Globe, MapPin, UserCircle, Package } from 'lucide-react';

/**
 * Supplier Profile Detail View
 * Refactored for high-fidelity partner management and catalog tracking.
 */
export const SupplierProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const avatarColors = theme === 'dark' 
    ? ['#ff4d6d', '#ff758f', '#ffbe0b', '#fdfcdc', '#48cae4']
    : ['#cc063e', '#e83535', '#fd9407', '#e2d9c2', '#10898b'];
  
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
    return <PageLoader label="Establishing Secure Link..." iconSize={40} className="h-96 gap-3" />;
  }

  if (!supplier) {
    return (
      <div className="flex items-center justify-center h-64 bg-brand-surface border border-dashed border-brand-border/50 rounded-2xl">
        <p className="text-[13px] font-semibold text-brand-subtle uppercase tracking-wider">Partner Identity Not Found</p>
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
        <span className="font-mono text-[11px] font-medium text-brand-accent bg-brand-accent/5 px-2 py-0.5 rounded whitespace-nowrap border border-brand-accent/10">
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
        <span className="font-mono text-[14px] font-semibold text-brand-primary whitespace-nowrap">
          {Number(row.original.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[11px] text-brand-subtle ml-0.5">{row.original.currency}</span>
        </span>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge variant="secondary" className="bg-brand-surface text-brand-secondary border-brand-border/50 text-[10px] font-medium px-2 h-5">
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
            "rounded-md px-2 py-0.5 text-[10px] font-medium border",
            row.original.availability
              ? 'bg-brand-success-bg text-brand-success border-brand-success/10'
              : 'bg-brand-danger-bg text-brand-danger border-brand-danger/10'
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
          onView={() => navigate(`${getBasePath()}/products/${row.original.product_id}`)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Premium Identity Header */}
      <div className="bg-brand-surface border border-brand-border/50 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
           <Avatar
             size={64}
             name={supplier.name || 'Supplier'}
             variant="marble"
             colors={avatarColors}
           />
           <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-semibold text-brand-primary tracking-tight">{supplier.name}</h1>
                <Badge variant="secondary" className="bg-brand-accent/10 text-brand-accent border-0 text-[10px] font-medium h-5">SUPPLIER</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-[13px] text-brand-secondary font-medium">
                 {supplier.supplier_code && (
                   <span className="font-mono text-brand-subtle">{supplier.supplier_code}</span>
                 )}
                 {supplier.email && (
                   <span className="flex items-center gap-1.5"><Mail size={14} className="opacity-50" /> {supplier.email}</span>
                 )}
                 {supplier.phone && (
                   <span className="flex items-center gap-1.5"><Phone size={14} className="opacity-50" /> {supplier.phone}</span>
                 )}
              </div>
           </div>
        </div>
      </div>

      <div className="bg-brand-white border border-brand-border/50 rounded-xl overflow-hidden shadow-sm">
         <div className="px-6 py-4 border-b border-brand-border/50 bg-brand-surface/30">
            <h2 className="text-[13px] font-medium text-brand-primary flex items-center gap-2"><Package size={16} className="text-brand-accent" /> Product Catalog</h2>
         </div>
         <DataTable 
           columns={productColumns} 
           data={products} 
           hidePagination={true}
         />
         
         <div className="flex items-center justify-between px-6 py-4 border-t border-brand-border/50 bg-brand-surface/30">
            <p className="text-[12px] font-medium text-brand-subtle">
               Showing {products.length} of {productsResult?.total || 0} entries
            </p>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="h-8 px-3 rounded-lg border-brand-border/50 bg-brand-white font-medium text-[12px] shadow-sm text-brand-secondary hover:bg-brand-surface"
              >
                Previous
              </Button>
              <div className="h-8 px-3 rounded-lg bg-brand-surface border border-brand-border/50 flex items-center justify-center font-semibold text-[12px] text-brand-primary">
                 {page} / {productsResult?.last_page || 1}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => p + 1)} 
                disabled={page >= (productsResult?.last_page || 1)}
                className="h-8 px-3 rounded-lg border-brand-border/50 bg-brand-white font-medium text-[12px] shadow-sm text-brand-secondary hover:bg-brand-surface"
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
