import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { timeAgo } from '@/lib/utils';
import type { Customer } from '@/types';
import { Plus, Mail, Phone, Building2, MoreHorizontal, Pencil, Trash2, Loader2, Search } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export const Customers = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', address: '', trn: '', is_portal_active: true });

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), per_page: '15' });
      if (search) params.set('search', search);
      const res = await api.get(`/admin/customers?${params}`);
      return res.data;
    }
  });

  const customers = customersData?.data || [];

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      return editingCustomer
        ? api.put(`/admin/customers/${editingCustomer.id}`, data)
        : api.post('/admin/customers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDialogOpen(false);
      toast.success(editingCustomer ? 'Customer updated' : 'Customer added');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error saving customer'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDeleteOpen(false);
      toast.success('Customer deleted');
    },
  });

  const openAdd = () => {
    setEditingCustomer(null);
    setForm({ name: '', company: '', email: '', phone: '', address: '', trn: '', is_portal_active: true });
    setDialogOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name,
      company: customer.company || '',
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      trn: customer.trn || '',
      is_portal_active: customer.is_portal_active ?? true,
    });
    setDialogOpen(true);
  };

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: 'customer_code', header: 'ID',
      cell: ({ row }: any) => (
        <span className="font-mono text-xs text-zeronix-blue font-medium">{row.original.customer_code || '—'}</span>
      ),
    },
    {
      accessorKey: 'name', header: 'Customer',
      cell: ({ row }: any) => (
        <div>
          <p className="font-medium text-admin-text-primary">{row.original.name}</p>
          {row.original.company && (
            <p className="text-xs text-admin-text-muted flex items-center gap-1 mt-0.5">
              <Building2 size={11} /> {row.original.company}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'email', header: 'Email',
      cell: ({ row }: any) => (
        <span className="flex items-center gap-1.5 text-admin-text-secondary text-sm">
          <Mail size={14} className="text-admin-text-muted" /> {row.original.email}
        </span>
      ),
    },
    {
      accessorKey: 'phone', header: 'Phone',
      cell: ({ row }: any) => (
        <span className="flex items-center gap-1.5 text-admin-text-secondary text-sm">
          <Phone size={14} className="text-admin-text-muted" /> {row.original.phone || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'is_portal_active', header: 'Portal',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          {row.original.is_portal_active ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              ACTIVE
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-500 border border-slate-500/20">
              DISABLED
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'quotes_count', header: 'Quotes',
      cell: ({ row }: any) => <span className="text-admin-text-secondary">{row.original.quotes_count || 0}</span>,
    },
    {
      accessorKey: 'created_at', header: 'Added',
      cell: ({ row }: any) => (
        <span className="text-xs text-admin-text-muted">{row.original.created_at ? timeAgo(row.original.created_at) : '—'}</span>
      ),
    },
    {
      id: 'actions', header: '', enableSorting: false,
      cell: ({ row }: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-admin-text-muted hover:text-admin-text-primary" onClick={(e: any) => e.stopPropagation()}>
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-admin-surface border-admin-border">
            <DropdownMenuItem onClick={(e: any) => { e.stopPropagation(); openEdit(row.original); }} className="text-admin-text-secondary hover:bg-admin-surface-hover cursor-pointer">
              <Pencil size={14} className="mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e: any) => { e.stopPropagation(); setDeletingId(row.original.id); setDeleteOpen(true); }} className="text-danger hover:bg-admin-surface-hover cursor-pointer">
              <Trash2 size={14} className="mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading && page === 1) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-zeronix-blue mb-4" />
        <p className="text-admin-text-muted">Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar - Standardized Layout */}
      <div className="flex items-center gap-2 pt-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" />
          <Input
            placeholder="Search by name, company, email, phone, TRN..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="pl-9 h-[38px] bg-admin-surface border-admin-border text-admin-text-primary"
          />
        </div>
        <Button onClick={handleSearch} className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover h-[38px]">Search</Button>
        <Button onClick={openAdd} className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover h-[38px] font-medium">
          <Plus size={16} className="mr-1" /> Add Customer
        </Button>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={customers} onRowClick={(row: any) => navigate(`/admin/customers/${row.id}`)} hidePagination={true} />

      {/* Pagination */}
      <div className="flex items-center justify-between py-2">
        <p className="text-sm text-admin-text-muted">{customersData?.total || 0} customers total</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="bg-admin-surface border-admin-border text-admin-text-secondary">Previous</Button>
          <span className="text-sm text-admin-text-muted px-2">Page {page} of {customersData?.last_page || 1}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= (customersData?.last_page || 1)} className="bg-admin-surface border-admin-border text-admin-text-secondary">Next</Button>
        </div>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-admin-surface border-admin-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-admin-text-primary">{editingCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
            <DialogDescription className="text-admin-text-secondary">{editingCustomer ? 'Update customer details.' : 'Enter customer information.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-admin-text-secondary text-sm">Name *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary" placeholder="Contact name" />
              </div>
              <div className="space-y-2">
                <Label className="text-admin-text-secondary text-sm">Company</Label>
                <Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary" placeholder="Company name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-admin-text-secondary text-sm">Email *</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary" placeholder="email@company.com" />
              </div>
              <div className="space-y-2">
                <Label className="text-admin-text-secondary text-sm">Phone</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary" placeholder="+971 50 000 0000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-admin-text-secondary text-sm">TRN / VAT Number</Label>
                <Input value={form.trn} onChange={e => setForm({ ...form, trn: e.target.value })} className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary font-mono" placeholder="100XXXXXXXXX" />
              </div>
              <div className="space-y-2">
                <Label className="text-admin-text-secondary text-sm">Portal Access</Label>
                <div className="flex items-center gap-3 h-[38px] px-3 bg-admin-bg border border-admin-border rounded-md">
                  <Switch 
                    checked={form.is_portal_active} 
                    onCheckedChange={checked => setForm({ ...form, is_portal_active: checked })} 
                  />
                  <span className="text-xs text-admin-text-muted font-medium">
                    {form.is_portal_active ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-admin-text-secondary text-sm">Address</Label>
              <Textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="bg-admin-bg border-admin-border text-admin-text-primary resize-none" placeholder="Full address..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-admin-text-secondary">Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.name || !form.email || saveMutation.isPending} className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover min-w-[100px]">
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingCustomer ? 'Save Changes' : 'Add Customer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Customer" description="Are you sure? This will remove this customer and all their history." confirmLabel="Delete" onConfirm={() => deletingId && deleteMutation.mutate(deletingId)} variant="destructive" />
    </div>
  );
};
