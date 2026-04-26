import { useParams } from 'react-router-dom';
import { useBreadcrumb } from '@/hooks/useBreadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/DataTable';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { ColumnDef } from '@tanstack/react-table';
import type { SupplierProduct } from '@/types';
import { Tag, Layers, Package, Loader2, User } from 'lucide-react';

export const ProductDetail = () => {
  const { id } = useParams();

  const { data: productData, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await api.get(`/admin/products/${id}`);
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-zeronix-blue mb-4" />
        <p className="text-admin-text-muted">Loading product details...</p>
      </div>
    );
  }

  const product = productData?.product;
  const suppliers = productData?.suppliers || [];

  useBreadcrumb([
    { label: 'Products', href: '/admin/products' },
    { label: product?.name || 'Loading…' },
  ]);

  if (!product) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-admin-text-muted">Product not found.</p>
      </div>
    );
  }

  const supplierColumns: ColumnDef<SupplierProduct>[] = [
    {
      accessorKey: 'supplier',
      header: 'Supplier',
      cell: ({ row }: any) => (
        <div className="flex flex-col">
          <span className="font-medium text-admin-text-primary">
            {row.original.supplier?.name}
          </span>
          <span className="text-[10px] text-admin-text-muted flex items-center gap-1">
            <User size={10} /> {row.original.supplier?.contact_person || 'No contact'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }: any) => (
        <span className="font-mono text-sm font-bold text-admin-text-primary">
          {row.original.price} {row.original.currency}
        </span>
      ),
    },
    {
      accessorKey: 'availability',
      header: 'Status',
      cell: ({ row }: any) => (
        <Badge
          variant="secondary"
          className={
            row.original.availability
              ? 'bg-zeronix-green-dim text-zeronix-green border-0'
              : 'bg-danger/10 text-danger border-0'
          }
        >
          {row.original.availability ? 'In Stock' : 'Out of Stock'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Product Info Card */}
      <div className="bg-admin-surface border border-admin-border rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Image Placeholder */}
          <div className="flex items-center justify-center bg-admin-bg rounded-lg border border-admin-border aspect-square group overflow-hidden">
            <Package size={48} className="text-admin-text-muted group-hover:scale-110 transition-transform duration-300" />
          </div>

          {/* Details */}
          <div className="md:col-span-2 space-y-4">
            {product.description && (
              <div>
                <p className="text-xs text-admin-text-muted uppercase font-medium mb-1">Description</p>
                <p className="text-sm text-admin-text-secondary leading-relaxed">{product.description}</p>
              </div>
            )}

            <div className="flex gap-3">
              {product.brand && (
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-admin-text-muted" />
                  <Badge variant="secondary" className="bg-zeronix-blue/10 text-zeronix-blue border-0">
                    {product.brand.name}
                  </Badge>
                </div>
              )}
              {product.category && (
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-admin-text-muted" />
                  <Badge variant="secondary" className="bg-admin-surface-hover text-admin-text-secondary border-0">
                    {product.category.name}
                  </Badge>
                </div>
              )}
            </div>

            {/* Specs Table */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <div>
                <p className="text-xs text-admin-text-muted uppercase font-medium mb-2">Specifications</p>
                <div className="border border-admin-border rounded-lg overflow-hidden">
                  {Object.entries(product.specs).map(([key, value], i) => (
                    <div
                      key={key}
                      className={`flex ${i > 0 ? 'border-t border-admin-border' : ''}`}
                    >
                      <div className="w-1/3 px-4 py-2.5 bg-admin-bg text-xs font-medium text-admin-text-secondary uppercase">
                        {key}
                      </div>
                      <div className="flex-1 px-4 py-2.5 text-sm text-admin-text-primary font-mono">
                        {String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Suppliers Tab */}
      <Tabs defaultValue="suppliers" className="space-y-4">
        <TabsList className="bg-admin-surface border border-admin-border">
          <TabsTrigger value="suppliers" className="data-[state=active]:bg-zeronix-blue data-[state=active]:text-white text-admin-text-secondary">
            Linked Suppliers ({suppliers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers">
          {suppliers.length > 0 ? (
            <DataTable columns={supplierColumns} data={suppliers} />
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-admin-border rounded-xl bg-admin-surface">
              <Package size={40} className="text-admin-text-muted mb-3" />
              <h3 className="text-lg font-semibold text-admin-text-primary mb-1">No Suppliers Linked</h3>
              <p className="text-admin-text-secondary">No current listings found for this product.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
