import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
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

import {
  Shield, Mail, Phone, UserCog, CheckCircle2, Lock, Download,
  LayoutDashboard, Users as UsersIcon, MessageSquareText, FileText,
  Receipt, Package, Truck, Clock, Activity, Banknote
} from 'lucide-react';
import { Spinner } from '@/components/shared/Spinner';
import type { User } from '@/types';
import { ResourceListingPage } from '@/components/shared/ResourceListingPage';
import { ActionGroup } from '@/components/shared/ActionGroup';
import { useResourceMutation } from '@/hooks/useApi';
import { PhoneFlag } from '@/components/shared/PhoneFlag';
import Avatar from 'boring-avatars';
import { useThemeStore } from '@/store/useThemeStore';

const AVAILABLE_MODULES = [
  { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard, desc: 'High-level analytics' },
  { id: 'customers', label: 'Customer Relations', icon: UsersIcon, desc: 'Manage client profiles' },
  { id: 'enquiries', label: 'Enquiry Hub', icon: MessageSquareText, desc: 'Process leads & messages' },
  { id: 'quotes', label: 'Quotation Engine', icon: FileText, desc: 'Draft and send quotes' },
  { id: 'invoices', label: 'Billing & Invoices', icon: Receipt, desc: 'Manage financial billing' },
  { id: 'receipts', label: 'Payment Receipts', icon: Banknote, desc: 'Track incoming payments' },
  { id: 'products', label: 'Inventory Management', icon: Package, desc: 'Manage product catalog' },
  { id: 'suppliers', label: 'Supplier Network', icon: Truck, desc: 'Manage vendor relationships' },
  { id: 'attendance', label: 'Attendance', icon: Clock, desc: 'Timesheets & clock-in' },
  { id: 'activities', label: 'Activities Log', icon: Activity, desc: 'System audit trails' },
  { id: 'users', label: 'Team Management', icon: UsersIcon, desc: 'Manage staff accounts' },
];

/**
 * User Management Module
 * Refactored to use the standardized State-Driven architecture.
 */
export const Users = () => {
  const { theme } = useThemeStore();
  const avatarColors = theme === 'dark' 
    ? ['#ff4d6d', '#ff758f', '#ffbe0b', '#fdfcdc', '#48cae4']
    : ['#cc063e', '#e83535', '#fd9407', '#e2d9c2', '#10898b'];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'salesman',
    designation: '',
    is_active: true,
    permissions: [] as string[],
    shift_start: '09:00',
    shift_end: '18:00',
  });

  // CRUD State Hooks
  const { create, update } = useResourceMutation('users');

  // Handlers
  const resetForm = () => {
    setEditId(null);
    setForm({
      name: '', email: '', phone: '', password: '', role: 'salesman', designation: '', is_active: true, permissions: [],
      shift_start: '09:00', shift_end: '18:00'
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
      phone: user.phone || '',
      password: '',
      role: user.role || 'salesman',
      designation: user.designation || '',
      is_active: user.is_active ?? true,
      permissions: user.permissions || [],
      shift_start: user.shift_start ? user.shift_start.slice(0, 5) : '09:00',
      shift_end: user.shift_end ? user.shift_end.slice(0, 5) : '18:00',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (editId) {
      await update.mutateAsync({ id: editId, data: form });
    } else {
      await create.mutateAsync(form);
    }
    setDialogOpen(false);
  };

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
      header: 'Team Member',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar
            size={36}
            name={row.original.name || 'Staff'}
            variant="beam"
            colors={avatarColors}
          />
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-brand-primary flex items-center gap-2">
              {row.original.name}
              {row.original.role === 'admin' && <Shield size={12} className="text-brand-accent" />}
            </p>
            <p className="text-[12px] text-brand-subtle flex items-center gap-1.5 mt-0.5">
              <Mail size={12} className="opacity-40" /> {row.original.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'designation',
      header: 'Designation',
      cell: ({ row }) => <span className="text-[13px] font-medium text-brand-secondary">{row.original.designation || 'Staff Member'}</span>,
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => <PhoneFlag phone={row.original.phone} />,
    },
    {
      accessorKey: 'role',
      header: 'Access Level',
      cell: ({ row }) => (
        <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${row.original.role === 'admin'
            ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20'
            : 'bg-brand-surface text-brand-secondary border border-brand-border/50'
          }`}>
          {row.original.role === 'admin' ? 'Super Admin' : 'Sales Agent'}
        </span>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Security',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          {row.original.is_active ? (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-brand-success-bg text-brand-success">
              <CheckCircle2 size={12} /> Active
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-brand-danger-bg text-brand-danger">
              <Lock size={12} /> Restricted
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <ActionGroup
          onEdit={() => openEdit(row.original)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <ResourceListingPage<User>
        resource="users"
        title="Access Management"
        icon={<UserCog size={20} />}
        columns={columns}
        createLabel="Add New User"
        createPath="#"
        onCreateClick={openAdd}
        searchPlaceholder="Search members by name or email..."
        extraActions={
          <Button variant="outline" className="h-9 px-4 rounded-lg border-brand-border bg-brand-white hover:bg-brand-surface font-medium text-brand-primary text-[13px]">
            <Download size={14} className="mr-2 opacity-50" />
            Export
          </Button>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-brand-white border-brand-border/50 sm:max-w-3xl rounded-xl shadow-xl p-0 overflow-hidden">
          <div className="bg-brand-surface p-6 border-b border-brand-border/50">
            <DialogHeader>
              <DialogTitle className="text-[16px] font-semibold text-brand-primary flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                  <Shield size={24} />
                </div>
                {editId ? 'Modify Access Control' : 'Grant New Access'}
              </DialogTitle>
              <DialogDescription className="text-[13px] font-medium text-brand-subtle mt-0.5">
                Configure user roles, authentication, and module permissions.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Identity Column */}
            <div className="p-6 space-y-5 border-r border-brand-border/50">
              <h4 className="text-[12px] font-semibold text-brand-secondary">Identity & Auth</h4>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-brand-secondary ml-1">Full Name *</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-[36px] bg-brand-white border-brand-border/50 text-[13px] text-brand-primary rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-brand-secondary ml-1">Email Address *</Label>
                  <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="h-[36px] bg-brand-white border-brand-border/50 text-[13px] text-brand-primary rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-brand-secondary ml-1">Credentials {editId && '(keep blank to retain)'}</Label>
                  <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="h-[36px] bg-brand-white border-brand-border/50 text-[13px] text-brand-primary rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-medium text-brand-secondary ml-1">Access Role</Label>
                    <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                      <SelectTrigger className="h-[36px] bg-brand-white border-brand-border/50 text-[13px] text-brand-primary rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-brand-white border-brand-border/50 rounded-lg">
                        <SelectItem value="admin">Super Admin</SelectItem>
                        <SelectItem value="salesman">Sales Agent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-medium text-brand-secondary ml-1">Designation</Label>
                    <Input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} className="h-[36px] bg-brand-white border-brand-border/50 text-[13px] text-brand-primary rounded-lg" placeholder="e.g. Sales Manager" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-brand-secondary ml-1">Phone Number</Label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-subtle" />
                    <Input
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="h-[36px] pl-9 bg-brand-white border-brand-border/50 text-[13px] text-brand-primary rounded-lg"
                      placeholder="+971 -- --- ----"
                    />
                  </div>
                </div>

                {form.role === 'salesman' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[12px] font-medium text-brand-secondary ml-1">Duty Shift Start</Label>
                      <Input
                        type="time"
                        value={form.shift_start}
                        onChange={e => setForm({ ...form, shift_start: e.target.value })}
                        className="h-[36px] bg-brand-white border-brand-border/50 text-[13px] text-brand-primary rounded-lg"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[12px] font-medium text-brand-secondary ml-1">Duty Shift End</Label>
                      <Input
                        type="time"
                        value={form.shift_end}
                        onChange={e => setForm({ ...form, shift_end: e.target.value })}
                        className="h-[36px] bg-brand-white border-brand-border/50 text-[13px] text-brand-primary rounded-lg"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 rounded-xl border border-brand-border/50 bg-brand-surface mt-4">
                  <div className="min-w-0">
                    <Label className="text-[13px] font-medium text-brand-primary">Status: {form.is_active ? 'Active' : 'Restricted'}</Label>
                    <p className="text-[12px] text-brand-subtle font-medium mt-0.5">Control login accessibility</p>
                  </div>
                  <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                </div>
              </div>
            </div>

            {/* Permissions Column */}
            <div className="p-6 space-y-5 bg-brand-surface/50">
              <h4 className="text-[12px] font-semibold text-brand-secondary">Module Access</h4>

              {form.role === 'admin' ? (
                <div className="p-8 bg-brand-accent/5 border border-brand-accent/10 rounded-xl text-center h-[350px] flex flex-col items-center justify-center space-y-4">
                  <div className="h-16 w-16 rounded-2xl bg-brand-accent/10 flex items-center justify-center text-brand-accent shadow-sm">
                    <Shield size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-brand-primary">Full Privileges</p>
                    <p className="text-[13px] font-medium text-brand-subtle max-w-[200px] mx-auto">
                      Super Admins bypass module restrictions and have full system control.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                  {AVAILABLE_MODULES.map(module => {
                    const isChecked = form.permissions?.includes(module.id) ?? false;
                    const Icon = module.icon;
                    return (
                      <div
                        key={module.id}
                        onClick={() => togglePermission(module.id)}
                        className={`flex items-start gap-3 p-3 border rounded-xl transition-all cursor-pointer ${
                          isChecked 
                            ? "bg-brand-white border-brand-accent shadow-sm ring-1 ring-brand-accent/20" 
                            : "bg-brand-surface border-brand-border/50 hover:border-brand-border opacity-80 hover:opacity-100"
                        }`}
                      >
                        <div className={`mt-0.5 flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                          isChecked ? "bg-brand-accent/10 text-brand-accent" : "bg-brand-bg text-brand-subtle"
                        }`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className={`text-[13px] font-bold truncate ${isChecked ? "text-brand-primary" : "text-brand-secondary"}`}>
                            {module.label}
                          </h5>
                          <p className="text-[11px] font-medium text-brand-subtle leading-tight mt-0.5">
                            {module.desc}
                          </p>
                        </div>
                        <Switch
                          id={`perm-${module.id}`}
                          checked={isChecked}
                          onCheckedChange={() => togglePermission(module.id)}
                          className="mt-1 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()} // Prevent double trigger
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 pt-2">
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-lg text-[13px] font-medium">Cancel</Button>
              <Button
                onClick={handleSave}
                disabled={create.isPending || update.isPending || !form.name || !form.email || (!editId && !form.password)}
                className="flex-1 bg-brand-primary text-brand-white hover:opacity-90 h-[36px] rounded-lg font-medium text-[13px] shadow-sm transition-all"
              >
                {(create.isPending || update.isPending) ? <Spinner size={16} className="mr-2" /> : null}
                {editId ? 'Update Access' : 'Create User'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
