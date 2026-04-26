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

import { Shield, Mail, Loader2, UserCog, CheckCircle2, Lock } from 'lucide-react';
import type { User } from '@/types';
import { ResourceListingPage } from '@/components/shared/ResourceListingPage';
import { ActionGroup } from '@/components/shared/ActionGroup';
import { useResourceMutation } from '@/hooks/useApi';

const AVAILABLE_MODULES = [
  { id: 'dashboard', label: 'Dashboard Overview' },
  { id: 'customers', label: 'Customer Relations' },
  { id: 'enquiries', label: 'Enquiry Hub' },
  { id: 'quotes', label: 'Quotation Engine' },
  { id: 'invoices', label: 'Billing & Invoices' },
  { id: 'products', label: 'Inventory Management' },
  { id: 'suppliers', label: 'Supplier Network' },
];

/**
 * User Management Module
 * Refactored to use the standardized State-Driven architecture.
 */
export const Users = () => {
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

  // CRUD State Hooks
  const { create, update } = useResourceMutation('users');

  // Handlers
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
      password: '', 
      role: user.role || 'salesman',
      designation: user.designation || '',
      is_active: user.is_active ?? true,
      permissions: user.permissions || [],
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
          <div className="h-9 w-9 rounded-full bg-admin-bg border border-admin-border flex items-center justify-center text-admin-text-secondary text-xs font-black">
            {row.original.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-admin-text-primary flex items-center gap-2">
              {row.original.name}
              {row.original.role === 'admin' && <Shield size={12} className="text-zeronix-blue" />}
            </p>
            <p className="text-[10px] text-admin-text-muted font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5">
              <Mail size={10} className="opacity-50" /> {row.original.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'designation',
      header: 'Designation',
      cell: ({ row }) => <span className="text-xs font-bold text-admin-text-secondary uppercase">{row.original.designation || 'STAF MEMBER'}</span>,
    },
    {
      accessorKey: 'role',
      header: 'Access Level',
      cell: ({ row }) => (
        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${
          row.original.role === 'admin' 
            ? 'bg-zeronix-blue/10 text-zeronix-blue border-zeronix-blue/20' 
            : 'bg-admin-bg text-admin-text-muted border-admin-border'
        }`}>
          {row.original.role}
        </span>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Security',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          {row.original.is_active ? (
             <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase">
                <CheckCircle2 size={12} /> Authorized
             </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-black text-red-500 uppercase opacity-50">
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
        subtitle="Control administrative privileges and team member security."
        icon={<UserCog size={20} />}
        columns={columns}
        createLabel="Onboard User"
        createPath="#"
        onCreateClick={openAdd}
        searchPlaceholder="Search members by name or email..."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-admin-surface border-admin-border sm:max-w-3xl rounded-3xl shadow-2xl p-0 overflow-hidden">
          <div className="bg-admin-bg/30 p-6 border-b border-admin-border">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-admin-text-primary flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-zeronix-blue/10 flex items-center justify-center text-zeronix-blue">
                   <Shield size={24} />
                </div>
                {editId ? 'Modify Access Control' : 'Grant New Access'}
              </DialogTitle>
              <DialogDescription className="text-xs font-bold text-admin-text-muted uppercase tracking-widest mt-1 ml-1">
                Configure user roles, authentication, and module permissions.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Identity Column */}
            <div className="p-6 space-y-5 border-r border-admin-border">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-admin-text-muted ml-1">Identity & Auth</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-admin-text-muted ml-1">Full Name *</Label>
                  <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-admin-text-muted ml-1">Email Address *</Label>
                  <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-admin-text-muted ml-1">Credentials {editId && '(keep blank to retain current)'}</Label>
                  <Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-admin-text-muted ml-1">Access Role</Label>
                    <Select value={form.role} onValueChange={v => setForm({...form, role: v})}>
                      <SelectTrigger className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-admin-surface border-admin-border rounded-xl">
                        <SelectItem value="admin" className="font-bold">Super Admin</SelectItem>
                        <SelectItem value="salesman" className="font-bold">Sales Agent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-admin-text-muted ml-1">Designation</Label>
                    <Input value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} className="h-11 bg-admin-bg border-admin-border text-admin-text-primary rounded-xl" placeholder="e.g. Sales Manager" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl border border-admin-border bg-admin-bg mt-4">
                  <div className="min-w-0">
                    <Label className="text-xs font-black text-admin-text-primary uppercase tracking-tighter">Status: {form.is_active ? 'ENABLED' : 'LOCKED'}</Label>
                    <p className="text-[10px] text-admin-text-muted font-medium mt-0.5">Control login accessibility</p>
                  </div>
                  <Switch checked={form.is_active} onCheckedChange={v => setForm({...form, is_active: v})} />
                </div>
              </div>
            </div>

            {/* Permissions Column */}
            <div className="p-6 space-y-5 bg-admin-bg/10">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-admin-text-muted ml-1">Module Granular Access</h4>
              
              {form.role === 'admin' ? (
                <div className="p-8 bg-zeronix-blue/5 border border-zeronix-blue/10 rounded-3xl text-center h-[350px] flex flex-col items-center justify-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-zeronix-blue/10 flex items-center justify-center text-zeronix-blue shadow-inner">
                    <Shield size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-admin-text-primary uppercase tracking-tight">ELEVATED PRIVILEGES</p>
                    <p className="text-xs font-medium text-admin-text-muted max-w-[200px] mx-auto">
                      Super Admins bypass module restrictions and have full system control.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
                  {AVAILABLE_MODULES.map(module => {
                    const isChecked = form.permissions?.includes(module.id) ?? false;
                    return (
                      <div 
                        key={module.id} 
                        className={`flex items-center justify-between p-4 border border-admin-border rounded-2xl transition-all ${
                          isChecked ? "bg-white border-zeronix-blue/30 shadow-sm" : "bg-admin-bg/50 grayscale opacity-60"
                        }`}
                      >
                        <Label 
                          htmlFor={`perm-${module.id}`} 
                          className="text-xs font-black text-admin-text-primary cursor-pointer flex-1"
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

          <div className="p-6 border-t border-admin-border">
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl font-bold">CANCEL</Button>
              <Button 
                onClick={handleSave} 
                disabled={create.isPending || update.isPending || !form.name || !form.email || (!editId && !form.password)}
                className="flex-1 bg-zeronix-blue text-white hover:bg-zeronix-blue-hover h-12 rounded-xl font-black shadow-lg shadow-zeronix-blue/20"
              >
                {(create.isPending || update.isPending) ? <Loader2 className="animate-spin" /> : 'SAVE USER PRIVILEGES'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
