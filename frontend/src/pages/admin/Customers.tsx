import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mockCustomers } from '@/lib/mockData';
import type { Customer } from '@/types';
import { Plus, Mail, Phone, Building2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

export const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '' });

  const openAdd = () => {
    setEditingCustomer(null);
    setForm({ name: '', company: '', email: '', phone: '' });
    setDialogOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name,
      company: customer.company || '',
      email: customer.email,
      phone: customer.phone || '',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingCustomer) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === editingCustomer.id
            ? { ...c, ...form }
            : c
        )
      );
    } else {
      const newCustomer: Customer = {
        id: Math.max(...customers.map((c) => c.id)) + 1,
        ...form,
        created_at: new Date().toISOString(),
        enquiries_count: 0,
        quotes_count: 0,
        invoices_count: 0,
      };
      setCustomers((prev) => [newCustomer, ...prev]);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingId) {
      setCustomers((prev) => prev.filter((c) => c.id !== deletingId));
      setDeleteOpen(false);
      setDeletingId(null);
    }
  };

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-admin-text-primary">{row.original.name}</p>
          {row.original.company && (
            <p className="text-xs text-admin-text-muted flex items-center gap-1 mt-0.5">
              <Building2 size={12} />
              {row.original.company}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="flex items-center gap-1.5 text-admin-text-secondary">
          <Mail size={14} className="text-admin-text-muted" />
          {row.original.email}
        </span>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <span className="flex items-center gap-1.5 text-admin-text-secondary">
          <Phone size={14} className="text-admin-text-muted" />
          {row.original.phone || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'enquiries_count',
      header: 'Enquiries',
      cell: ({ row }) => (
        <span className="text-admin-text-secondary">{row.original.enquiries_count}</span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-admin-text-muted text-xs">
          {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-surface-hover"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-admin-surface border-admin-border">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                openEdit(row.original);
              }}
              className="text-admin-text-secondary hover:bg-admin-surface-hover cursor-pointer"
            >
              <Pencil size={14} className="mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setDeletingId(row.original.id);
                setDeleteOpen(true);
              }}
              className="text-danger hover:bg-admin-surface-hover cursor-pointer"
            >
              <Trash2 size={14} className="mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={customers}
        searchColumn="name"
        searchPlaceholder="Search customers..."
        onRowClick={(row) => navigate(`/admin/customers/${row.id}`)}
        headerAction={
          <Button
            onClick={openAdd}
            className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover h-[38px] rounded-lg text-sm font-medium w-full sm:w-auto"
          >
            <Plus size={16} className="mr-1" /> Add Customer
          </Button>
        }
      />

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-admin-surface border-admin-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-admin-text-primary">
              {editingCustomer ? 'Edit Customer' : 'Add Customer'}
            </DialogTitle>
            <DialogDescription className="text-admin-text-secondary">
              {editingCustomer ? 'Update customer details.' : 'Enter customer information.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-admin-text-secondary text-sm">Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary focus:border-zeronix-blue"
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-admin-text-secondary text-sm">Company</Label>
              <Input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary focus:border-zeronix-blue"
                placeholder="Company name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-admin-text-secondary text-sm">Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary focus:border-zeronix-blue"
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-admin-text-secondary text-sm">Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary focus:border-zeronix-blue"
                placeholder="+971 50 000 0000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              className="text-admin-text-secondary hover:bg-admin-surface-hover"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.name || !form.email}
              className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover"
            >
              {editingCustomer ? 'Save Changes' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Customer"
        description="Are you sure you want to delete this customer? All associated data will be lost."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
};
