import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { Expense } from '@/types';
import { Wallet, Calendar, StickyNote, Receipt } from 'lucide-react';
import { Spinner } from '@/components/shared/Spinner';
import { ResourceListingPage } from '@/components/shared/ResourceListingPage';
import { useResourceMutation } from '@/hooks/useApi';
import { ActionGroup } from '@/components/shared/ActionGroup';

const EXPENSE_CATEGORIES = ['Rent', 'Utilities', 'Salaries', 'Marketing', 'Logistics', 'Office Supplies', 'Other'];

export const Expenses = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState({
    category: 'Other',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    paid_via: 'cash',
    notes: '',
  });

  const { create, update, remove } = useResourceMutation('expenses');

  const openAdd = () => {
    setEditingExpense(null);
    setForm({ category: 'Other', amount: 0, date: new Date().toISOString().split('T')[0], paid_via: 'cash', notes: '' });
    setDialogOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setForm({
      category: expense.category,
      amount: Number(expense.amount),
      date: expense.date.split('T')[0],
      paid_via: expense.paid_via || 'cash',
      notes: expense.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingExpense) {
      await update.mutateAsync({ id: editingExpense.id, data: form });
    } else {
      await create.mutateAsync(form);
    }
    setDialogOpen(false);
  };

  const columns: ColumnDef<Expense>[] = [
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-brand-accent/5 border border-brand-accent/10 flex items-center justify-center text-brand-accent">
            <Wallet size={16} />
          </div>
          <Badge variant="secondary" className="bg-brand-surface text-brand-secondary border border-brand-border/50 text-[11px] font-medium px-2 py-0.5">
            {row.original.category}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <p className="font-mono text-[14px] font-semibold text-brand-primary">
          {Number(row.original.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[11px] text-brand-subtle">AED</span>
        </p>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => (
        <p className="text-[12px] text-brand-subtle flex items-center gap-1.5 font-medium">
          <Calendar size={12} className="opacity-50" /> {new Date(row.original.date).toLocaleDateString()}
        </p>
      ),
    },
    {
      accessorKey: 'paid_via',
      header: 'Paid Via',
      cell: ({ row }) => (
        <span className="text-[12px] font-medium text-brand-secondary capitalize flex items-center gap-1.5">
          <Receipt size={12} className="opacity-40" /> {row.original.paid_via || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'notes',
      header: 'Notes',
      cell: ({ row }) => (
        <p className="text-[12px] text-brand-subtle truncate max-w-[200px] flex items-center gap-1.5">
          {row.original.notes ? <><StickyNote size={12} className="opacity-40 shrink-0" /> {row.original.notes}</> : '—'}
        </p>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <ActionGroup
          onEdit={() => openEdit(row.original)}
          onDelete={() => remove.mutate(row.original.id)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <ResourceListingPage<Expense>
        resource="expenses"
        title="Expenses"
        icon={<Wallet size={20} />}
        columns={columns}
        createLabel="Add Expense"
        createPath="#"
        onCreateClick={openAdd}
        searchPlaceholder="Search by category..."
        filters={[
          {
            name: 'category',
            label: 'Category',
            placeholder: 'Filter by category',
            options: EXPENSE_CATEGORIES.map((c) => ({ label: c, value: c })),
          },
          {
            name: 'paid_via',
            label: 'Paid Via',
            placeholder: 'Filter by payment',
            options: [
              { label: 'Cash', value: 'cash' },
              { label: 'Bank', value: 'bank' },
              { label: 'Card', value: 'card' },
            ],
          },
        ]}
      />

      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-brand-white border-brand-border/50 p-0 flex flex-col gap-0">
          <div className="bg-brand-surface p-6 border-b border-brand-border/50 flex-shrink-0">
            <SheetHeader className="space-y-0 text-left">
              <SheetTitle className="text-[16px] font-semibold text-brand-primary flex items-center gap-3 pr-6">
                <div className="h-10 w-10 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                  <Wallet size={20} />
                </div>
                {editingExpense ? 'Update Expense' : 'Record New Expense'}
              </SheetTitle>
              <SheetDescription className="text-[13px] font-medium text-brand-subtle mt-0.5">
                Track business overhead for accurate profit &amp; loss reporting.
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-brand-secondary ml-1">Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-[36px] bg-brand-white border-brand-border/50 text-[13px] rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="text-[13px]">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-brand-secondary ml-1">Amount (AED) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  className="h-[36px] bg-brand-white border-brand-border/50 text-[13px] font-mono rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-brand-secondary ml-1">Date *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="h-[36px] bg-brand-white border-brand-border/50 text-[13px] rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-brand-secondary ml-1">Paid Via</Label>
                <Select value={form.paid_via} onValueChange={(v) => setForm({ ...form, paid_via: v })}>
                  <SelectTrigger className="h-[36px] bg-brand-white border-brand-border/50 text-[13px] rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash" className="text-[13px]">Cash</SelectItem>
                    <SelectItem value="bank" className="text-[13px]">Bank</SelectItem>
                    <SelectItem value="card" className="text-[13px]">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="bg-brand-white border-brand-border/50 text-[13px] text-brand-primary rounded-xl resize-none min-h-[80px] p-4"
                placeholder="Optional details..."
                rows={3}
              />
            </div>
          </div>

          <div className="p-6 pt-2 flex-shrink-0">
            <SheetFooter className="gap-2 sm:justify-end">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-lg text-[13px] font-medium">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!form.category || form.amount <= 0 || create.isPending || update.isPending}
                className="flex-1 bg-brand-primary text-brand-white hover:opacity-90 h-[36px] rounded-lg font-medium text-[13px] shadow-sm transition-all"
              >
                {(create.isPending || update.isPending) ? <Spinner size={16} className="mr-2" /> : null}
                {editingExpense ? 'Update Expense' : 'Record Expense'}
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
