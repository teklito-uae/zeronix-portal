import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Shield, Mail, Loader2, Plus, Search, MoreHorizontal, Pencil } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { User } from '@/types';

const AVAILABLE_MODULES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'customers', label: 'Customers' },
  { id: 'enquiries', label: 'Enquiries' },
  { id: 'quotes', label: 'Quotes' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'products', label: 'Products' },
  { id: 'suppliers', label: 'Suppliers' },
];

export const Users = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'salesman',
    designation: '',
    is_active: true,
    permissions: [] as string[],
  });

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), per_page: '15' });
      if (search) params.set('search', search);
      const res = await api.get(`/admin/users?${params}`);
      return res.data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editId) {
        return api.put(`/admin/users/${editId}`, data);
      }
      return api.post('/admin/users', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDialogOpen(false);
      resetForm();
      toast.success(editId ? 'User updated' : 'User created');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save user');
    }
  });

  const resetForm = () => {
    setEditId(null);
    setForm({
      name: '', email: '', password: '', role: 'salesman', designation: '', is_active: true, permissions: []
    });
  };

  const openAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (user: User) => {
    setEditId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: '', // Leave blank unless changing
      role: user.role || 'salesman',
      designation: user.designation || '',
      is_active: user.is_active ?? true,
      permissions: user.permissions || [],
    });
    setDialogOpen(true);
  };

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  const togglePermission = (moduleId: string) => {
    setForm(prev => {
      const current = prev.permissions || [];
      if (current.includes(moduleId)) {
        return { ...prev, permissions: current.filter(p => p !== moduleId) };
      }
      return { ...prev, permissions: [...current, moduleId] };
    });
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'User',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-admin-text-primary flex items-center gap-2">
            {row.original.name}
            {row.original.role === 'admin' && <Shield size={12} className="text-zeronix-blue" />}
          </p>
          <p className="text-xs text-admin-text-muted flex items-center gap-1 mt-0.5">
            <Mail size={10} /> {row.original.email}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'designation',
      header: 'Designation',
      cell: ({ row }) => <span className="text-sm text-admin-text-secondary">{row.original.designation || '—'}</span>,
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
          row.original.role === 'admin' ? 'bg-zeronix-blue/10 text-zeronix-blue' : 'bg-admin-surface-hover text-admin-text-secondary border border-admin-border'
        }`}>
          {row.original.role}
        </span>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
          row.original.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
        }`}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-admin-text-muted hover:text-admin-text-primary" onClick={(e: any) => e.stopPropagation()}>
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-admin-surface border-admin-border">
            <DropdownMenuItem onClick={(e: any) => { e.stopPropagation(); openEdit(row.original); }} className="text-admin-text-secondary hover:bg-admin-surface-hover cursor-pointer">
              <Pencil size={14} className="mr-2" /> Edit User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Search & Action Bar - Matching Products UI */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" />
            <Input
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="pl-9 h-[38px] bg-admin-surface border-admin-border text-admin-text-primary"
            />
          </div>
          <Button onClick={handleSearch} className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover h-[38px]">Search</Button>
          <Button onClick={openAdd} className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover h-[38px] font-medium">
            <Plus size={16} className="mr-1" /> Add User
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-zeronix-blue" size={32} />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={usersData?.data || []}
            hidePagination={true}
          />
          {usersData && usersData.total > 0 && (
            <div className="flex items-center justify-between py-2 mt-2">
              <p className="text-sm text-admin-text-muted">{usersData.total} users total</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="bg-admin-surface border-admin-border text-admin-text-secondary">Previous</Button>
                <span className="text-sm text-admin-text-muted px-2">Page {page} of {usersData.last_page}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= usersData.last_page} className="bg-admin-surface border-admin-border text-admin-text-secondary">Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-admin-surface border-admin-border sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-admin-text-primary">{editId ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription className="text-admin-text-secondary">
              Configure team member details and module access.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-admin-text-secondary text-sm">Full Name *</Label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-9 bg-admin-bg border-admin-border text-admin-text-primary" />
              </div>
              <div className="space-y-2">
                <Label className="text-admin-text-secondary text-sm">Email Address *</Label>
                <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="h-9 bg-admin-bg border-admin-border text-admin-text-primary" />
              </div>
              <div className="space-y-2">
                <Label className="text-admin-text-secondary text-sm">Password {editId && '(leave blank to keep current)'}</Label>
                <Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="h-9 bg-admin-bg border-admin-border text-admin-text-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-admin-text-secondary text-sm">Role *</Label>
                  <Select value={form.role} onValueChange={v => setForm({...form, role: v})}>
                    <SelectTrigger className="h-9 bg-admin-bg border-admin-border text-admin-text-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-admin-surface border-admin-border">
                      <SelectItem value="admin">Super Admin</SelectItem>
                      <SelectItem value="salesman">Salesman</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-admin-text-secondary text-sm">Designation</Label>
                  <Input value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} className="h-9 bg-admin-bg border-admin-border text-admin-text-primary" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded border border-admin-border bg-admin-bg">
                <div>
                  <Label className="text-sm font-medium text-admin-text-primary">Account Active</Label>
                  <p className="text-xs text-admin-text-muted">Allow user to login</p>
                </div>
                <Switch checked={form.is_active} onCheckedChange={v => setForm({...form, is_active: v})} />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-admin-text-primary text-sm font-medium">Module Permissions</Label>
                <p className="text-xs text-admin-text-muted mb-3">Select which areas this user can access.</p>
                
                {form.role === 'admin' ? (
                  <div className="p-4 bg-zeronix-blue/10 border border-zeronix-blue/20 rounded-lg text-sm text-zeronix-blue flex flex-col items-center justify-center text-center h-48">
                    <Shield size={32} className="mb-2" />
                    <p className="font-semibold">Full Access Granted</p>
                    <p className="text-xs mt-1">Super Admins automatically have access to all modules.</p>
                  </div>
                ) : (
                  <div className="space-y-1 bg-admin-bg p-3 rounded border border-admin-border max-h-[300px] overflow-y-auto">
                    {AVAILABLE_MODULES.map(module => {
                      const isChecked = form.permissions?.includes(module.id) ?? false;
                      return (
                        <div 
                          key={module.id} 
                          className="flex items-center justify-between py-2.5 px-2 border-b border-admin-border last:border-0 hover:bg-admin-surface/50 transition-colors rounded-sm"
                        >
                          <Label 
                            htmlFor={`perm-${module.id}`} 
                            className="text-sm font-medium text-admin-text-secondary cursor-pointer flex-1"
                          >
                            {module.label}
                          </Label>
                          <Switch 
                            id={`perm-${module.id}`}
                            checked={isChecked} 
                            onCheckedChange={() => togglePermission(module.id)} 
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-admin-text-secondary">Cancel</Button>
            <Button 
              onClick={() => saveMutation.mutate(form)} 
              disabled={saveMutation.isPending || !form.name || !form.email || (!editId && !form.password)}
              className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover"
            >
              {saveMutation.isPending ? <Loader2 className="animate-spin" /> : 'Save User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
