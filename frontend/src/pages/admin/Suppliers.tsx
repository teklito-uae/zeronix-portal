import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { mockSuppliers } from '@/lib/mockData';
import type { Supplier } from '@/types';
import { Plus, Mail, Phone, Globe, MapPin, User, Package, Search } from 'lucide-react';

export const Suppliers = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    website: '',
    address: '',
  });

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingSupplier(null);
    setForm({ name: '', contact_person: '', email: '', phone: '', website: '', address: '' });
    setDialogOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      email: supplier.email,
      phone: supplier.phone || '',
      website: supplier.website || '',
      address: supplier.address || '',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingSupplier) {
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === editingSupplier.id ? { ...s, ...form } : s
        )
      );
    } else {
      const newSupplier: Supplier = {
        id: Math.max(...suppliers.map((s) => s.id)) + 1,
        ...form,
        created_at: new Date().toISOString(),
        brands_count: 0,
        products_count: 0,
      };
      setSuppliers((prev) => [newSupplier, ...prev]);
    }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Manage your supplier network."
        action={
          <Button
            onClick={openAdd}
            className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover h-[38px] rounded-lg text-sm font-medium"
          >
            <Plus size={16} className="mr-1" /> Add Supplier
          </Button>
        }
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" />
        <Input
          placeholder="Search suppliers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-[38px] bg-admin-surface border-admin-border text-admin-text-primary placeholder:text-admin-text-muted focus:border-zeronix-blue"
        />
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSuppliers.map((supplier) => (
          <div
            key={supplier.id}
            onClick={() => navigate(`/admin/suppliers/${supplier.id}`)}
            className="bg-admin-surface border border-admin-border rounded-xl p-5 hover:shadow-md hover:border-zeronix-blue/30 transition-all duration-150 cursor-pointer group"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-admin-text-primary group-hover:text-zeronix-blue transition-colors">
                  {supplier.name}
                </h3>
                {supplier.contact_person && (
                  <p className="text-xs text-admin-text-muted flex items-center gap-1 mt-1">
                    <User size={12} /> {supplier.contact_person}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(supplier);
                }}
                className="h-7 text-xs text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-surface-hover"
              >
                Edit
              </Button>
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-admin-text-secondary">
                <Mail size={14} className="text-admin-text-muted flex-shrink-0" />
                <span className="truncate">{supplier.email}</span>
              </p>
              {supplier.phone && (
                <p className="flex items-center gap-2 text-admin-text-secondary">
                  <Phone size={14} className="text-admin-text-muted flex-shrink-0" />
                  {supplier.phone}
                </p>
              )}
              {supplier.website && (
                <p className="flex items-center gap-2 text-admin-text-secondary">
                  <Globe size={14} className="text-admin-text-muted flex-shrink-0" />
                  <span className="truncate">{supplier.website}</span>
                </p>
              )}
              {supplier.address && (
                <p className="flex items-center gap-2 text-admin-text-secondary">
                  <MapPin size={14} className="text-admin-text-muted flex-shrink-0" />
                  {supplier.address}
                </p>
              )}
            </div>

            {/* Footer Badges */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-admin-border">
              <Badge variant="secondary" className="bg-zeronix-blue/10 text-zeronix-blue border-0 text-xs">
                {supplier.brands_count || 0} Brands
              </Badge>
              <Badge variant="secondary" className="bg-zeronix-green-dim text-zeronix-green border-0 text-xs">
                <Package size={12} className="mr-1" />
                {supplier.products_count || 0} Products
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-admin-border rounded-xl bg-admin-surface">
          <h3 className="text-lg font-semibold text-admin-text-primary mb-1">No Suppliers Found</h3>
          <p className="text-admin-text-secondary">Try adjusting your search or add a new supplier.</p>
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-admin-surface border-admin-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-admin-text-primary">
              {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
            </DialogTitle>
            <DialogDescription className="text-admin-text-secondary">
              {editingSupplier ? 'Update supplier details.' : 'Enter supplier information.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-admin-text-secondary text-sm">Company Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary focus:border-zeronix-blue"
                  placeholder="Company name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-admin-text-secondary text-sm">Contact Person</Label>
                <Input
                  value={form.contact_person}
                  onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                  className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary focus:border-zeronix-blue"
                  placeholder="Contact name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-admin-text-secondary text-sm">Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary focus:border-zeronix-blue"
                  placeholder="email@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-admin-text-secondary text-sm">Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary focus:border-zeronix-blue"
                  placeholder="+971 4 000 0000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-admin-text-secondary text-sm">Website</Label>
              <Input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary focus:border-zeronix-blue"
                placeholder="https://company.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-admin-text-secondary text-sm">Address</Label>
              <Textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="bg-admin-bg border-admin-border text-admin-text-primary focus:border-zeronix-blue resize-none"
                placeholder="Full address"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-admin-text-secondary hover:bg-admin-surface-hover">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.name || !form.email}
              className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover"
            >
              {editingSupplier ? 'Save Changes' : 'Add Supplier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
