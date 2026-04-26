import { useParams } from 'react-router-dom';
import { useBreadcrumb } from '@/hooks/useBreadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/DataTable';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { ColumnDef } from '@tanstack/react-table';
import type { SupplierProduct } from '@/types';
import { Tag, Layers, Package, Loader2, User, Boxes } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Product Detail View
 * Refactored for high-fidelity inventory management.
 */
export const ProductDetail = () => {
  const { id } = useParams();
  
  const { data: productData, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => (await api.get(`/admin/products/${id}`)).data
  });

  const product = productData?.product;
  const suppliers = productData?.suppliers || [];

  useBreadcrumb([
    { label: 'Inventory', href: '/admin/products' },
    { label: product?.name || 'Loading…' },
  ]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-zeronix-blue" />
        <p className="text-xs font-semibold uppercase tracking-wider text-admin-text-muted">Loading Product Data...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-admin-surface border border-dashed border-admin-border rounded-2xl">
        <Package size={40} className="text-admin-text-muted opacity-20 mb-2" />
        <p className="text-sm font-bold text-admin-text-muted">SKU NOT FOUND IN REGISTRY</p>
      </div>
    );
  }

  const supplierColumns: ColumnDef<SupplierProduct>[] = [
    {
      accessorKey: 'supplier',
      header: 'Partner Source',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-admin-text-primary tracking-tight">
            {row.original.supplier?.name}
          </span>
          <span className="text-[10px] text-admin-text-muted flex items-center gap-1 font-semibold uppercase tracking-wider opacity-60">
            <User size={10} /> {row.original.supplier?.contact_person || 'SYSTEM AGENT'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Procurement Rate',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-mono text-sm font-medium text-zeronix-blue bg-zeronix-blue/5 px-2 py-0.5 rounded border border-zeronix-blue/10 inline-block w-fit">
            {Number(row.original.price).toLocaleString()} {row.original.currency}
          </span>
          <p className="text-[9px] font-semibold text-admin-text-muted mt-0.5 uppercase tracking-wider">Base Cost</p>
        </div>
      ),
    },
    {
      accessorKey: 'availability',
      header: 'Fulfillment Status',
      cell: ({ row }) => (
        <Badge
          className={cn(
            "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border",
            row.original.availability
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
              : 'bg-red-500/10 text-red-600 border-red-500/20'
          )}
        >
          {row.original.availability ? 'IN STOCK' : 'OUT OF STOCK'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-zeronix-blue/10 rounded-xl text-zeronix-blue shadow-sm">
            <Boxes size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-admin-text-primary tracking-tight">{product.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-semibold text-admin-text-muted uppercase tracking-wider bg-admin-bg px-2 py-0.5 rounded border border-admin-border">
                SKU: {product.model_code || 'GENERIC'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Information Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Specs & Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-admin-surface border border-admin-border rounded-2xl p-6 shadow-sm overflow-hidden">
             <div className="flex flex-col md:flex-row gap-8">
                {/* Media Container */}
                <div className="w-full md:w-56 shrink-0 space-y-4">
                   <div className="aspect-square bg-admin-bg rounded-2xl border border-admin-border flex items-center justify-center group overflow-hidden relative shadow-inner">
                      <div className="absolute inset-0 bg-gradient-to-tr from-zeronix-blue/5 to-transparent pointer-events-none" />
                      <Package size={64} className="text-admin-text-muted/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500" />
                   </div>
                   <div className="flex gap-2 justify-center">
                      <div className="w-12 h-12 rounded-lg bg-admin-bg border border-admin-border opacity-50" />
                      <div className="w-12 h-12 rounded-lg bg-admin-bg border border-admin-border opacity-50" />
                      <div className="w-12 h-12 rounded-lg bg-admin-bg border border-admin-border opacity-50" />
                   </div>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-6">
                   <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-admin-text-muted uppercase tracking-wider">Description</p>
                      <p className="text-sm text-admin-text-secondary leading-relaxed font-medium">
                        {product.description || "No description provided."}
                      </p>
                   </div>

                   <div className="flex flex-wrap gap-3">
                      {product.brand && (
                        <div className="flex items-center gap-2 bg-admin-bg px-3 py-1.5 rounded-lg border border-admin-border">
                          <Tag size={12} className="text-zeronix-blue" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-admin-text-primary">{product.brand.name}</span>
                        </div>
                      )}
                      {product.category && (
                        <div className="flex items-center gap-2 bg-admin-bg px-3 py-1.5 rounded-lg border border-admin-border">
                          <Layers size={12} className="text-purple-500" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-admin-text-primary">{product.category.name}</span>
                        </div>
                      )}
                   </div>

                   {/* Specs Grid */}
                   {product.specs && Object.keys(product.specs).length > 0 && (
                      <div className="space-y-3 pt-2">
                         <p className="text-[10px] font-semibold text-admin-text-muted uppercase tracking-wider">Specifications</p>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.entries(product.specs).map(([key, value]) => (
                               <div key={key} className="flex flex-col gap-0.5 p-3 bg-admin-bg rounded-lg border border-admin-border">
                                  <span className="text-[9px] font-semibold text-admin-text-muted uppercase tracking-wider">{key}</span>
                                  <span className="text-xs font-semibold text-admin-text-primary truncate">{String(value)}</span>
                               </div>
                            ))}
                         </div>
                      </div>
                   )}
                </div>
             </div>
          </div>
        </div>

        {/* Right Col: Supply Chain Source */}
        <div className="lg:col-span-1">
          <Tabs defaultValue="suppliers" className="h-full flex flex-col">
            <TabsList className="bg-admin-surface border border-admin-border rounded-lg p-1 h-10 w-full shadow-sm mb-4">
              <TabsTrigger 
                value="suppliers" 
                className="flex-1 rounded-md text-[11px] font-semibold uppercase tracking-wider data-[state=active]:bg-zeronix-blue data-[state=active]:text-white transition-all"
              >
                Procurement ({suppliers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="suppliers" className="flex-1 mt-0">
              <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shadow-sm h-full">
                 {suppliers.length > 0 ? (
                    <div className="overflow-x-auto">
                      <DataTable 
                        columns={supplierColumns} 
                        data={suppliers} 
                        pageSize={10}
                      />
                    </div>
                 ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] p-8 text-center">
                       <div className="h-16 w-16 bg-admin-bg rounded-full flex items-center justify-center mb-4 border border-admin-border">
                          <Package size={32} className="text-admin-text-muted/20" />
                       </div>
                       <h3 className="text-sm font-bold text-admin-text-primary uppercase tracking-wider mb-1">NO CHANNELS DETECTED</h3>
                       <p className="text-xs text-admin-text-muted leading-relaxed max-w-[200px] mx-auto">
                          This product is currently disconnected from the global supplier network.
                       </p>
                    </div>
                 )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
