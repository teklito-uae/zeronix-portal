import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { getBasePath } from '@/hooks/useBasePath';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import { SEO } from '@/components/shared/SEO';
import { Spinner } from '@/components/shared/Spinner';
import { ResourceListingPage } from '@/components/shared/ResourceListingPage';
import { ActionGroup } from '@/components/shared/ActionGroup';
import { CurrencyAmount } from '@/components/shared/CurrencyAmount';
import { SupplierPaymentModal } from '@/components/shared/SupplierPaymentModal';
import { useResourceMutation } from '@/hooks/useApi';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import type { SupplierPaymentReceipt } from '@/types';
import { Expenses } from './Expenses';
import { Banknote, Wallet, Calendar, StickyNote, Hash, Receipt as ReceiptIcon } from 'lucide-react';

/**
 * "Payments Made" — a hub sibling of Expenses.tsx, split across two tabs:
 * Supplier Payments (all SupplierPaymentReceipt rows, whether or not they're
 * linked to a Purchase Bill) and Expenses (the existing standalone page,
 * reused as-is). Creating a supplier payment here opens the same
 * SupplierPaymentModal used from a bill's detail view, just in its
 * standalone (no bound bill) mode.
 */
export const PaymentsMade = () => {
  const navigate = useNavigate();
  const currency = useCurrencyStore((s) => s.currency);

  const [activeTab, setActiveTab] = useState('supplier-payments');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<SupplierPaymentReceipt | null>(null);
  const [form, setForm] = useState({
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank' as 'cash' | 'bank',
    reference_id: '',
    notes: '',
  });

  const { update, remove } = useResourceMutation('supplier-payment-receipts');

  const openEdit = (receipt: SupplierPaymentReceipt) => {
    setEditingReceipt(receipt);
    setForm({
      amount: Number(receipt.amount),
      payment_date: receipt.payment_date.split('T')[0],
      payment_method: receipt.payment_method,
      reference_id: receipt.reference_id || '',
      notes: receipt.notes || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingReceipt) return;
    await update.mutateAsync({ id: editingReceipt.id, data: form });
    setEditingReceipt(null);
  };

  const columns: ColumnDef<SupplierPaymentReceipt>[] = [
    {
      accessorKey: 'receipt_number',
      header: 'Receipt #',
      cell: ({ row }) => (
        <span className="font-mono text-[12px] font-medium text-brand-accent">{row.original.receipt_number}</span>
      ),
    },
    {
      id: 'supplier',
      header: 'Supplier',
      cell: ({ row }) => (
        <span className="text-[13px] font-medium text-brand-primary">{row.original.supplier?.name || '—'}</span>
      ),
    },
    {
      id: 'purchase_bill',
      header: 'Purchase Bill',
      cell: ({ row }) => {
        const bill = row.original.purchaseBill;
        return row.original.purchase_bill_id && bill ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`${getBasePath()}/purchases/${row.original.purchase_bill_id}`);
            }}
            className="font-mono text-[12px] font-medium text-brand-accent hover:underline"
          >
            {bill.bill_number}
          </button>
        ) : (
          <Badge variant="secondary" className="bg-brand-surface text-brand-subtle border border-brand-border/50 text-[11px] font-medium px-2 py-0.5">
            Advance / Unlinked
          </Badge>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <p className="font-mono text-[13px] font-semibold text-brand-primary">
          <CurrencyAmount amount={row.original.amount} currency={currency} />
        </p>
      ),
    },
    {
      accessorKey: 'payment_date',
      header: 'Date',
      cell: ({ row }) => (
        <p className="text-[12px] text-brand-subtle flex items-center gap-1.5 font-medium">
          <Calendar size={12} className="opacity-50" /> {new Date(row.original.payment_date).toLocaleDateString()}
        </p>
      ),
    },
    {
      accessorKey: 'payment_method',
      header: 'Method',
      cell: ({ row }) => (
        <span className="text-[12px] font-medium text-brand-secondary capitalize">{row.original.payment_method}</span>
      ),
    },
    {
      accessorKey: 'reference_id',
      header: 'Reference',
      cell: ({ row }) => (
        <span className="text-[12px] text-brand-subtle flex items-center gap-1.5">
          <Hash size={11} className="opacity-40" /> {row.original.reference_id || '—'}
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
    <div className="bg-brand-white flex flex-col h-full overflow-hidden animate-in fade-in duration-200">
      <SEO title="Payments Made" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
        <div className="px-5 pt-4 border-b border-brand-border/50 flex-shrink-0">
          <TabsList className="bg-brand-bg/50 border border-brand-border h-auto p-1 rounded-xl inline-flex gap-1">
            <TabsTrigger
              value="supplier-payments"
              className="data-[state=active]:bg-brand-white data-[state=active]:shadow-sm rounded-lg text-[12px] font-medium text-brand-subtle data-[state=active]:text-brand-primary flex items-center gap-2 px-4 py-2"
            >
              <Banknote size={14} /> Supplier Payments
            </TabsTrigger>
            <TabsTrigger
              value="expenses"
              className="data-[state=active]:bg-brand-white data-[state=active]:shadow-sm rounded-lg text-[12px] font-medium text-brand-subtle data-[state=active]:text-brand-primary flex items-center gap-2 px-4 py-2"
            >
              <Wallet size={14} /> Expenses
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="supplier-payments" className="flex-1 min-h-0 flex flex-col outline-none mt-0">
          <ResourceListingPage<SupplierPaymentReceipt>
            resource="supplier-payment-receipts"
            title="Supplier Payments"
            icon={<Banknote size={20} />}
            columns={columns}
            createLabel="Record Payment"
            createPath="#"
            onCreateClick={() => setIsCreateOpen(true)}
            searchPlaceholder="Search by receipt # or supplier..."
          />
        </TabsContent>

        <TabsContent value="expenses" className="flex-1 min-h-0 outline-none mt-0 overflow-y-auto p-5">
          <Expenses />
        </TabsContent>
      </Tabs>

      <SupplierPaymentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        purchaseBill={null}
      />

      <Sheet open={!!editingReceipt} onOpenChange={(open) => !open && setEditingReceipt(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-brand-white border-brand-border/50 p-0 flex flex-col gap-0">
          <div className="bg-brand-surface p-6 border-b border-brand-border/50 flex-shrink-0">
            <SheetHeader className="space-y-0 text-left">
              <SheetTitle className="text-[16px] font-semibold text-brand-primary flex items-center gap-3 pr-6">
                <div className="h-10 w-10 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                  <ReceiptIcon size={20} />
                </div>
                Update Payment
              </SheetTitle>
              <SheetDescription className="text-[13px] font-medium text-brand-subtle mt-0.5">
                Adjust the amount, date, method, reference, or notes for this recorded payment.
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-brand-secondary ml-1">Amount ({currency}) *</Label>
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
                  value={form.payment_date}
                  onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                  className="h-[36px] bg-brand-white border-brand-border/50 text-[13px] rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-brand-secondary ml-1">Method</Label>
                <Select value={form.payment_method} onValueChange={(v: any) => setForm({ ...form, payment_method: v })}>
                  <SelectTrigger className="h-[36px] bg-brand-white border-brand-border/50 text-[13px] rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank" className="text-[13px]">Bank Transfer</SelectItem>
                    <SelectItem value="cash" className="text-[13px]">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-brand-secondary ml-1">Reference</Label>
                <Input
                  value={form.reference_id}
                  onChange={(e) => setForm({ ...form, reference_id: e.target.value })}
                  placeholder="Cheque # or reference"
                  className="h-[36px] bg-brand-white border-brand-border/50 text-[13px] rounded-lg"
                />
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
              <Button variant="ghost" onClick={() => setEditingReceipt(null)} className="rounded-lg text-[13px] font-medium">
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={form.amount <= 0 || update.isPending}
                className="flex-1 bg-brand-primary text-brand-white hover:opacity-90 h-[36px] rounded-lg font-medium text-[13px] shadow-sm transition-all"
              >
                {update.isPending ? <Spinner size={16} className="mr-2" /> : null}
                Update Payment
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
