import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/DataTable';
import { mockProducts, mockSupplierProducts } from '@/lib/mockData';
import type { ColumnDef } from '@tanstack/react-table';
import type { SupplierProduct } from '@/types';
import { ArrowLeft, Tag, Layers, Package } from 'lucide-react';

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = mockProducts.find((p) => p.id === Number(id));

  if (!product) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-admin-text-muted">Product not found.</p>
      </div>
    );
  }

  const productSuppliers = mockSupplierProducts.filter((sp) => sp.product_id === product.id);

  const supplierColumns: ColumnDef<SupplierProduct>[] = [
    {
      accessorKey: 'supplier',
      header: 'Supplier',
      cell: ({ row }) => (
        <span className="font-medium text-admin-text-primary">
          {row.original.supplier?.name || `Supplier #${row.original.supplier_id}`}
        </span>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-admin-text-primary">
          {row.original.price?.toLocaleString()} {row.original.currency}
        </span>
      ),
    },
    {
      accessorKey: 'availability',
      header: 'Availability',
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={
            row.original.availability
              ? 'bg-[#10B9811F] text-[#10B981] border-0'
              : 'bg-[#EF44441F] text-[#EF4444] border-0'
          }
        >
          {row.original.availability ? 'In Stock' : 'Out of Stock'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/products')}
          className="text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-surface-hover"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-admin-text-primary">{product.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            {product.part_number && (
              <span className="font-mono text-xs text-zeronix-blue bg-zeronix-blue/10 px-2 py-0.5 rounded">
                {product.part_number}
              </span>
            )}
            {product.model_number && (
              <span className="font-mono text-xs text-admin-text-muted">
                {product.model_number}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Product Info Card */}
      <div className="bg-admin-surface border border-admin-border rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Image Placeholder */}
          <div className="flex items-center justify-center bg-admin-bg rounded-lg border border-admin-border aspect-square">
            <Package size={48} className="text-admin-text-muted" />
          </div>

          {/* Details */}
          <div className="md:col-span-2 space-y-4">
            {product.description && (
              <div>
                <p className="text-xs text-admin-text-muted uppercase font-medium mb-1">Description</p>
                <p className="text-sm text-admin-text-secondary">{product.description}</p>
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
                        {value}
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
            Suppliers ({productSuppliers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers">
          {productSuppliers.length > 0 ? (
            <DataTable columns={supplierColumns} data={productSuppliers} />
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-admin-border rounded-xl bg-admin-surface">
              <Package size={40} className="text-admin-text-muted mb-3" />
              <h3 className="text-lg font-semibold text-admin-text-primary mb-1">No Suppliers</h3>
              <p className="text-admin-text-secondary">No suppliers have been linked to this product yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
