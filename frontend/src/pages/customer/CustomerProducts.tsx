import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockProducts, mockCategories, mockBrands } from '@/lib/mockData';
import type { Product } from '@/types';
import { DataTable } from '@/components/shared/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

export const CustomerProducts = () => {
  const navigate = useNavigate();
  const { company } = useParams();
  const addItem = useCartStore((state) => state.addItem);
  const [data] = useState<Product[]>(mockProducts);

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'part_number',
      header: 'Part Number',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-zeronix-blue font-medium">
          {row.getValue('part_number')}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Product Name',
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate font-medium text-admin-text-primary">
          {row.getValue('name')}
        </div>
      ),
    },
    {
      accessorKey: 'brand_id',
      header: 'Brand',
      cell: ({ row }) => {
        const brandId = row.getValue('brand_id');
        const brand = mockBrands.find((b) => b.id === brandId);
        return (
          <span className="bg-zeronix-blue/10 text-zeronix-blue px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider">
            {brand?.name || 'Unknown'}
          </span>
        );
      },
    },
    {
      accessorKey: 'category_id',
      header: 'Category',
      cell: ({ row }) => {
        const catId = row.getValue('category_id');
        const category = mockCategories.find((c) => c.id === catId);
        return (
          <span className="text-sm text-admin-text-secondary">
            {category?.name || 'Unknown'}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Action',
      cell: ({ row }) => {
        const product = row.original;
        return (
          <Button
            variant="outline"
            size="sm"
            className="text-zeronix-blue border-zeronix-blue hover:bg-zeronix-blue hover:text-white h-8"
            onClick={() => addItem(product)}
          >
            <ShoppingCart size={14} className="mr-2" />
            Add to Enquiry
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-admin-surface border border-admin-border rounded-xl shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          searchColumn="name"
          searchPlaceholder="Search products by name or part number..."
          renderRowDetails={(product) => (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-semibold text-admin-text-primary mb-2 uppercase tracking-wider">Product Description</h4>
                <p className="text-sm text-admin-text-secondary leading-relaxed">
                  {product.description || "No description available for this product."}
                </p>
                <div className="mt-4 flex gap-4">
                  <div>
                    <p className="text-[10px] text-admin-text-muted uppercase font-bold tracking-tighter">Brand</p>
                    <p className="text-sm font-medium text-admin-text-primary">{product.brand?.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-admin-text-muted uppercase font-bold tracking-tighter">Category</p>
                    <p className="text-sm font-medium text-admin-text-primary">{product.category?.name}</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-admin-text-primary mb-2 uppercase tracking-wider">Technical Specifications</h4>
                {product.specs ? (
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                    {Object.entries(product.specs).map(([key, value]) => (
                      <div key={key} className="flex flex-col border-b border-admin-border/50 pb-1">
                        <span className="text-[11px] text-admin-text-muted font-medium">{key}</span>
                        <span className="text-sm text-admin-text-primary">{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-admin-text-secondary italic">No technical specifications listed.</p>
                )}
              </div>
            </div>
          )}
          headerAction={
            <Button 
              onClick={() => navigate(`/portal/${company}/request-form`)} 
              size="sm" 
              className="bg-zeronix-blue hover:bg-zeronix-blue-hover text-white h-9 w-full sm:w-auto"
            >
              <ShoppingCart size={16} className="mr-2" /> View Request
            </Button>
          }
        />
      </div>
    </div>
  );
};
