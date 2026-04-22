import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/shared/StatCard';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { mockSuppliers, mockBrands, mockSupplierProducts } from '@/lib/mockData';
import type { ColumnDef } from '@tanstack/react-table';
import type { SupplierProduct } from '@/types';
import { ArrowLeft, Mail, Phone, Globe, MapPin, User, Tag, Package, Megaphone } from 'lucide-react';

export const SupplierProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const supplier = mockSuppliers.find((s) => s.id === Number(id));

  if (!supplier) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-admin-text-muted">Supplier not found.</p>
      </div>
    );
  }

  const supplierProducts = mockSupplierProducts.filter((sp) => sp.supplier_id === supplier.id);

  const productColumns: ColumnDef<SupplierProduct>[] = [
    {
      accessorKey: 'product_id',
      header: 'Product',
      cell: ({ row }) => (
        <span className="font-medium text-admin-text-primary">
          {row.original.product?.name || `Product #${row.original.product_id}`}
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
          onClick={() => navigate('/admin/suppliers')}
          className="text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-surface-hover"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-admin-text-primary">{supplier.name}</h1>
          {supplier.contact_person && (
            <p className="text-sm text-admin-text-secondary flex items-center gap-1 mt-0.5">
              <User size={14} /> {supplier.contact_person}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard title="Brands" value={supplier.brands_count || 0} icon={<Tag size={20} />} />
        <StatCard title="Products" value={supplier.products_count || 0} icon={<Package size={20} />} />
        <StatCard title="Avg. Lead Time" value="5 days" icon={<Megaphone size={20} />} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="bg-admin-surface border border-admin-border">
          <TabsTrigger value="profile" className="data-[state=active]:bg-zeronix-blue data-[state=active]:text-white text-admin-text-secondary">
            Profile
          </TabsTrigger>
          <TabsTrigger value="brands" className="data-[state=active]:bg-zeronix-blue data-[state=active]:text-white text-admin-text-secondary">
            Brands
          </TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:bg-zeronix-blue data-[state=active]:text-white text-admin-text-secondary">
            Products & Pricing
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="data-[state=active]:bg-zeronix-blue data-[state=active]:text-white text-admin-text-secondary">
            Broadcast Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="bg-admin-surface border border-admin-border rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-admin-text-primary">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-admin-bg">
                <div className="p-2 rounded-lg bg-zeronix-blue/10">
                  <Mail size={18} className="text-zeronix-blue" />
                </div>
                <div>
                  <p className="text-xs text-admin-text-muted uppercase font-medium">Email</p>
                  <p className="text-sm text-admin-text-primary">{supplier.email}</p>
                </div>
              </div>
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

        <TabsContent value="brands">
          <div className="bg-admin-surface border border-admin-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-admin-text-primary mb-4">Associated Brands</h3>
            <div className="flex flex-wrap gap-2">
              {mockBrands.slice(0, supplier.brands_count || 3).map((brand) => (
                <Badge
                  key={brand.id}
                  variant="secondary"
                  className="bg-zeronix-blue/10 text-zeronix-blue border-0 px-3 py-1 text-sm"
                >
                  {brand.name}
                </Badge>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <DataTable columns={productColumns} data={supplierProducts} searchColumn="product_id" searchPlaceholder="Search products..." />
        </TabsContent>

        <TabsContent value="broadcast">
          <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-admin-border rounded-xl bg-admin-surface">
            <Megaphone size={40} className="text-admin-text-muted mb-3" />
            <h3 className="text-lg font-semibold text-admin-text-primary mb-1">Broadcast Log Coming Soon</h3>
            <p className="text-admin-text-secondary">Supplier broadcast history will appear here.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
