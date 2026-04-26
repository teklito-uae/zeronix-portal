import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { type Supplier } from '@/types';
import { Plus, Loader2, Search } from 'lucide-react';

export const Suppliers = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    website: '',
    address: '',
  });

  // Fetch Suppliers
  const { data: suppliersData, isLoading } = useQuery({
    queryKey: ['suppliers', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), per_page: '15' });
      if (search) params.set('search', search);
      const res = await api.get(`/admin/suppliers?${params}`);
      return res.data;
    }
  });

  const suppliers = suppliersData?.data || [];

  // Create/Update Mutation
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingSupplier) {
        return api.put(`/admin/suppliers/${editingSupplier.id}`, data);
      }
      return api.post('/admin/suppliers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setDialogOpen(false);
      toast.success(editingSupplier ? 'Supplier updated' : 'Supplier added');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  });

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
    mutation.mutate(form);
  };

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  const columns: ColumnDef<Supplier>[] = [
    {
      accessorKey: 'name',
      header: 'Supplier Name',
      cell: ({ row }: any) => (
        <span className="font-semibold text-admin-text-primary group-hover:text-zeronix-blue transition-colors">
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: 'contact_person',
      header: 'Contact Person',
      cell: ({ row }: any) => (
        <span className="text-admin-text-secondary">{row.original.contact_person || '—'}</span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }: any) => (
        <span className="text-admin-text-secondary">{row.original.email}</span>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }: any) => (
        <span className="text-admin-text-secondary">{row.original.phone || '—'}</span>
      ),
    },
    {
      id: 'counts',
      header: 'Stats',
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-zeronix-blue/10 text-zeronix-blue border-0 text-[10px] px-1.5 h-5">
            {row.original.brands_count || 0} Brands
          </Badge>
          <Badge variant="secondary" className="bg-zeronix-green-dim text-zeronix-green border-0 text-[10px] px-1.5 h-5">
            {row.original.products_count || 0} Products
          </Badge>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e: any) => {
            e.stopPropagation();
            openEdit(row.original);
          }}
          className="h-8 px-2 text-xs text-admin-text-muted hover:text-admin-text-primary"
        >
          Edit
        </Button>
      ),
    },
  ];

  if (isLoading && page === 1) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-zeronix-blue mb-4" />
        <p className="text-admin-text-muted animate-pulse">Loading suppliers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Action Bar - Matching Products style */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" />
            <Input
              placeholder="Search by name, email or phone..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="pl-9 h-[38px] bg-admin-surface border-admin-border text-admin-text-primary"
            />
          </div>
          <Button onClick={handleSearch} className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover h-[38px]">Search</Button>
          <Button onClick={openAdd} className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover h-[38px] font-medium">
            <Plus size={16} className="mr-1" /> Add Supplier
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={suppliers}
        onRowClick={(row: any) => navigate(`/admin/suppliers/${row.id}`)}
        hidePagination={true}
      />

      {/* Pagination */}
      {suppliersData && suppliersData.total > 0 && (
        <div className="flex items-center justify-between py-2">
          <p className="text-sm text-admin-text-muted">{suppliersData.total} suppliers total</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="bg-admin-surface border-admin-border text-admin-text-secondary">Previous</Button>
            <span className="text-sm text-admin-text-muted px-2">Page {page} of {suppliersData.last_page}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= suppliersData.last_page} className="bg-admin-surface border-admin-border text-admin-text-secondary">Next</Button>
          </div>
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
              disabled={!form.name || !form.email || mutation.isPending}
              className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover min-w-[100px]"
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingSupplier ? 'Save Changes' : 'Add Supplier')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
