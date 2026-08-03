import { useEffect, useMemo, useState } from 'react';
import { MessageSquareText, Plus, Search, Store, Tag } from 'lucide-react';
import { SEO } from '@/components/shared/SEO';
import { PageTabs, type PageTab } from '@/components/shared/PageTabs';
import { Pagination } from '@/components/shared/Pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import { useSbCategories, useSbProducts, useSbProductSearch, useSbVendors } from '@/hooks/useSupplierBroadcast';
import { ProductFilters } from '@/components/supplierBroadcast/ProductFilters';
import { ProductList } from '@/components/supplierBroadcast/ProductList';
import { PasteImportDrawer } from '@/components/supplierBroadcast/PasteImportDrawer';
import { VendorManager } from '@/components/supplierBroadcast/VendorManager';
import { CategoryManager } from '@/components/supplierBroadcast/CategoryManager';
import { BroadcastHistoryList } from '@/components/supplierBroadcast/BroadcastHistoryList';

type ViewTab = 'products' | 'history';

const VIEW_TABS: PageTab[] = [
  { id: 'products', label: 'Products' },
  { id: 'history', label: 'Broadcast History' },
];

export default function SupplierBroadcastPage() {
  const admin = useAuthStore((s) => s.admin);
  const permissions = admin?.permissions || [];
  const isFullAccess = admin?.role === 'admin' || admin?.role === 'super_admin';
  const can = (perm: string) => isFullAccess || permissions.includes(perm);

  const canImport = can('supplier-broadcast.import');
  const canManageVendors = can('supplier-broadcast.manage-vendors');
  const canEdit = can('supplier-broadcast.edit');
  const canDelete = can('supplier-broadcast.delete');

  const [viewTab, setViewTab] = useState<ViewTab>('products');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const [importOpen, setImportOpen] = useState(false);
  const [vendorManagerOpen, setVendorManagerOpen] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);

  // Debounce the search box (~300ms) before it drives the query, matching
  // the pattern in components/deals/DealFilters.tsx.
  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, vendorId, categoryId]);

  const { data: vendors = [] } = useSbVendors();
  const { data: categories = [] } = useSbCategories();

  const listParams = { vendor_id: vendorId, category_id: categoryId, page, per_page: perPage };
  const isSearching = search.trim().length > 0;
  const productsQuery = useSbProducts(listParams, { enabled: !isSearching });
  const searchQuery = useSbProductSearch(search, listParams);

  const activeQuery = isSearching ? searchQuery : productsQuery;
  const paginator = activeQuery.data;
  const products = useMemo(() => paginator?.data ?? [], [paginator]);

  const handleClearFilters = () => {
    setVendorId(null);
    setCategoryId(null);
  };

  return (
    <div className="bg-brand-white flex flex-col h-full overflow-hidden animate-in fade-in duration-200">
      <SEO title="Supplier Broadcast" />

      <div className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-5 py-3 md:py-4 gap-3 md:gap-0 border-b border-brand-border bg-brand-white flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <h1 className="text-[16px] md:text-[18px] font-bold text-brand-primary flex items-center gap-2">
            <MessageSquareText size={18} className="text-brand-subtle" />
            Supplier Broadcast
          </h1>
          <PageTabs tabs={VIEW_TABS} value={viewTab} onChange={(id) => setViewTab(id as ViewTab)} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canManageVendors && (
            <>
              <Button variant="outline" size="sm" onClick={() => setCategoryManagerOpen(true)} className="h-[34px] text-[12px] rounded-lg font-medium gap-1.5">
                <Tag size={14} /> <span className="hidden sm:inline">Categories</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setVendorManagerOpen(true)} className="h-[34px] text-[12px] rounded-lg font-medium gap-1.5">
                <Store size={14} /> <span className="hidden sm:inline">Vendors</span>
              </Button>
            </>
          )}
          {canImport && (
            <Button onClick={() => setImportOpen(true)} className="text-[13px] font-medium px-4 h-[34px] rounded-lg shadow-sm">
              <Plus size={15} className="mr-1.5" /> <span className="hidden sm:inline">Import Broadcast</span>
            </Button>
          )}
        </div>
      </div>

      {viewTab === 'products' && (
        <div className="flex flex-wrap items-center gap-2 px-4 md:px-5 py-2.5 border-b border-brand-border bg-brand-white flex-shrink-0">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-subtle" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="h-[34px] pl-8 text-[12px] rounded-lg"
            />
          </div>
          <ProductFilters
            vendors={vendors}
            categories={categories}
            vendorId={vendorId}
            categoryId={categoryId}
            onVendorChange={setVendorId}
            onCategoryChange={setCategoryId}
            onClear={handleClearFilters}
          />
        </div>
      )}

      <div className="flex-1 overflow-auto bg-brand-white px-3 pt-3">
        {viewTab === 'products' ? (
          <div className="h-full flex flex-col pb-3 gap-3">
            <div className="flex-1 min-h-0">
              <ProductList
                products={products}
                isLoading={activeQuery.isLoading}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            </div>
            {paginator && (
              <Pagination
                page={paginator.current_page}
                perPage={paginator.per_page}
                total={paginator.total}
                lastPage={paginator.last_page}
                onPageChange={setPage}
                onPerPageChange={(next) => { setPerPage(next); setPage(1); }}
              />
            )}
          </div>
        ) : (
          <div className="pb-3">
            <BroadcastHistoryList canDelete={canDelete} />
          </div>
        )}
      </div>

      <PasteImportDrawer open={importOpen} onOpenChange={setImportOpen} />
      <VendorManager open={vendorManagerOpen} onOpenChange={setVendorManagerOpen} canEdit={canManageVendors} canDelete={canManageVendors} />
      <CategoryManager open={categoryManagerOpen} onOpenChange={setCategoryManagerOpen} canEdit={canManageVendors} canDelete={canManageVendors} />
    </div>
  );
}
