import { PackageSearch } from 'lucide-react';
import { PageLoader } from '@/components/shared/PageLoader';
import { ProductRow } from './ProductRow';
import type { SbProduct } from '@/types';

interface ProductListProps {
  products: SbProduct[];
  isLoading: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export const ProductList = ({ products, isLoading, canEdit, canDelete }: ProductListProps) => {
  if (isLoading) {
    return <PageLoader label="Loading products" />;
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-brand-surface border border-dashed border-brand-border rounded-xl">
        <div className="h-16 w-16 bg-brand-bg rounded-full flex items-center justify-center mb-4 text-brand-subtle opacity-50">
          <PackageSearch size={32} />
        </div>
        <h3 className="text-[15px] font-bold text-brand-primary mb-1.5">No products found</h3>
        <p className="text-[12px] text-brand-subtle max-w-xs">
          Import a broadcast or adjust your filters to see products here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-brand-white border border-brand-border rounded-xl overflow-hidden">
      {products.map((product) => (
        <ProductRow key={product.id} product={product} canEdit={canEdit} canDelete={canDelete} />
      ))}
    </div>
  );
};
