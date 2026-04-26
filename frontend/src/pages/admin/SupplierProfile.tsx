import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBreadcrumb } from '@/hooks/useBreadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import type { SupplierProduct } from '@/types';
import { Mail, Phone, Globe, MapPin, User, Loader2, Pencil, History } from 'lucide-react';

export const SupplierProfile = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SupplierProduct | null>(null);
  const [newPrice, setNewPrice] = useState('');

  const { data: supplierData, isLoading } = useQuery({
    queryKey: ['supplier', id, page],
    queryFn: async () => {
      const res = await api.get(`/admin/suppliers/${id}?page=${page}`);
      return res.data;
    }
  });

  const updatePriceMutation = useMutation({
    mutationFn: async ({ itemId, price }: { itemId: number; price: number }) => {
      return api.put(`/admin/supplier-products/${itemId}`, { price });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', id] });
      setEditDialogOpen(false);
      toast.success('Price updated successfully');
    },
    onError: () => {
      toast.error('Failed to update price');
    }
  });

  const supplier = supplierData?.supplier;
  const productsResult = supplierData?.products;
  const products = productsResult?.data || [];

  // Must be called before any early return (Rules of Hooks)
  useBreadcrumb([
    { label: 'Suppliers', href: '/admin/suppliers' },
    { label: supplier?.name || 'Loading…' },
  ]);

  if (isLoading && page === 1) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-zeronix-blue mb-3" />
        <p className="text-sm text-admin-text-muted">Loading supplier profile...</p>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-admin-text-muted">Supplier not found.</p>
      </div>
    );
  }

  const openEdit = (item: SupplierProduct) => {
    setEditingItem(item);
    setNewPrice(String(item.price));
    setEditDialogOpen(true);
  };

  const handleUpdatePrice = () => {
    if (editingItem && newPrice) {
      updatePriceMutation.mutate({ itemId: editingItem.id, price: parseFloat(newPrice) });
    }
  };

  const productColumns: ColumnDef<SupplierProduct>[] = [
    {
      accessorKey: 'name',
      header: 'Product',
      cell: ({ row }: any) => (
        <div className="flex flex-col max-w-[400px]">
          <span className="font-medium text-admin-text-primary truncate">
            {row.original.name}
          </span>
          <span className="text-[10px] text-admin-text-muted font-mono uppercase">
            {row.original.model_code || 'No Model Code'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }: any) => (
        <span className="text-sm text-admin-text-secondary">
          {row.original.category?.name || '—'}
        </span>
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
              ? 'bg-zeronix-green-dim text-zeronix-green border-0 text-[10px] px-2 h-5'
              : 'bg-danger/10 text-danger border-0 text-[10px] px-2 h-5'
          }
        >
          {row.original.availability ? 'In Stock' : 'Out of Stock'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openEdit(row.original)}
          className="h-8 px-2 text-xs text-admin-text-muted hover:text-zeronix-blue"
        >
          <Pencil size={12} className="mr-1" /> Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header info bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge className="bg-zeronix-blue/10 text-zeronix-blue border-0 text-xs px-2">
          {supplier.products_count || 0} Products
        </Badge>
        <span className="font-mono text-xs text-admin-text-muted">{supplier.supplier_code || 'PENDING'}</span>
        {supplier.contact_person && (
          <p className="text-sm text-admin-text-secondary flex items-center gap-1">
            <User size={13} className="text-admin-text-muted" /> {supplier.contact_person}
          </p>
        )}
        <p className="text-sm text-admin-text-secondary flex items-center gap-1">
          <Mail size={13} className="text-admin-text-muted" /> {supplier.email}
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="bg-admin-surface border border-admin-border">
          <TabsTrigger value="products" className="data-[state=active]:bg-zeronix-blue data-[state=active]:text-white text-admin-text-secondary">
            Products & Pricing
          </TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-zeronix-blue data-[state=active]:text-white text-admin-text-secondary">
            Supplier Profile
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="data-[state=active]:bg-zeronix-blue data-[state=active]:text-white text-admin-text-secondary">
            Synchronization Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <DataTable 
            columns={productColumns} 
            data={products} 
            searchColumn="name" 
            searchPlaceholder="Search synced products..."
          />
          
          {/* Simple Pagination Controls */}
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="bg-admin-surface border-admin-border text-admin-text-secondary"
            >
              Previous
            </Button>
            <div className="text-sm text-admin-text-muted">
              Page {page} of {productsResult?.last_page || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= (productsResult?.last_page || 1)}
              className="bg-admin-surface border-admin-border text-admin-text-secondary"
            >
              Next
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <div className="bg-admin-surface border border-admin-border rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-admin-text-primary">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-admin-bg">
                <div className="p-2 rounded-lg bg-zeronix-blue/10">
                  <Phone size={18} className="text-zeronix-blue" />
                </div>
                <div>
                  <p className="text-xs text-admin-text-muted uppercase font-medium">Phone</p>
                  <p className="text-sm text-admin-text-primary">{supplier.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-admin-bg">
                <div className="p-2 rounded-lg bg-zeronix-blue/10">
                  <Globe size={18} className="text-zeronix-blue" />
                </div>
                <div>
                  <p className="text-xs text-admin-text-muted uppercase font-medium">Website</p>
                  <p className="text-sm text-admin-text-primary">{supplier.website || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-admin-bg">
                <div className="p-2 rounded-lg bg-zeronix-blue/10">
                  <MapPin size={18} className="text-zeronix-blue" />
                </div>
                <div>
                  <p className="text-xs text-admin-text-muted uppercase font-medium">Address</p>
                  <p className="text-sm text-admin-text-primary">{supplier.address || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="broadcast">
          <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden">
            <div className="p-6 border-b border-admin-border bg-admin-bg/50">
              <div className="flex items-center gap-3">
                <History className="text-zeronix-blue" size={20} />
                <div>
                  <h3 className="text-lg font-semibold text-admin-text-primary">Synchronization Log</h3>
                  <p className="text-sm text-admin-text-secondary">History of data updates from this supplier.</p>
                </div>
              </div>
            </div>
            <div className="p-6 text-center py-12">
               <p className="text-admin-text-secondary">No recent sync activity logged.</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Price Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-admin-surface border-admin-border">
          <DialogHeader>
            <DialogTitle className="text-admin-text-primary">Edit Listing</DialogTitle>
            <DialogDescription className="text-admin-text-secondary">
              Update pricing for: {editingItem?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-admin-text-primary">Price ({editingItem?.currency})</Label>
              <Input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="bg-admin-bg border-admin-border text-admin-text-primary"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditDialogOpen(false)} className="text-admin-text-secondary">
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePrice}
              disabled={updatePriceMutation.isPending}
              className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover"
            >
              {updatePriceMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
