import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { getBasePath } from '@/hooks/useBasePath';
import { cn } from '@/lib/utils';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/shared/SEO';
import { Spinner } from '@/components/shared/Spinner';
import { PageLoader } from '@/components/shared/PageLoader';
import { Pagination } from '@/components/shared/Pagination';
import { Avatar } from '@/components/shared/Avatar';
import { DownloadButton } from '@/components/shared/DownloadButton';
import { ReceiptDocumentCard } from '@/components/shared/ReceiptDocumentCard';
import { LinkedDocumentSummaryCard } from '@/components/shared/LinkedDocumentSummaryCard';
import { SupplierPaymentModal } from '@/components/shared/SupplierPaymentModal';
import { useResourceList, useResourceDetail, useResourceMutation } from '@/hooks/useApi';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import type { SupplierPaymentReceipt } from '@/types';
import { Expenses } from './Expenses';
import {
  Banknote,
  Wallet,
  Search,
  Plus,
  Loader2,
  Pencil,
  MoreHorizontal,
  Trash2,
  Send,
} from 'lucide-react';

/**
 * "Payments Made" — a hub sibling of Expenses.tsx, split across two tabs:
 * Supplier Payments (all SupplierPaymentReceipt rows, whether or not they're
 * linked to a Purchase Bill) and Expenses (the existing standalone page,
 * reused as-is). Supplier Payments mirrors the Payment Receipts split view:
 * a compact list on the left, and a right pane with a designed receipt card
 * (View PDF / Download for the actual generated PDF), selected via
 * ?id=<receipt_number>.
 */
export const PaymentsMade = () => {
  const [activeTab, setActiveTab] = useState('supplier-payments');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<SupplierPaymentReceipt | null>(null);
  const currency = useCurrencyStore((s) => s.currency);
  const [form, setForm] = useState({
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank' as 'cash' | 'bank',
    reference_id: '',
    notes: '',
  });

  const { update } = useResourceMutation('supplier-payment-receipts');

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
          <SupplierPaymentsSplitView onCreate={() => setIsCreateOpen(true)} onEdit={openEdit} />
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
                  <Banknote size={20} />
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

interface SupplierPaymentsSplitViewProps {
  onCreate: () => void;
  onEdit: (receipt: SupplierPaymentReceipt) => void;
}

/**
 * List + detail layout for supplier payments, mirroring
 * PaymentReceiptsSplitView.tsx: a compact scrollable left list, and a right
 * detail pane with an embedded PDF preview. Selection is stored as
 * ?id=<receipt_number> (human-readable), resolved server-side via
 * SupplierPaymentReceipt::resolveRouteBinding.
 */
const SupplierPaymentsSplitView = ({ onCreate, onEdit }: SupplierPaymentsSplitViewProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedNumber = searchParams.get('id');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: resourceData, isLoading } = useResourceList<SupplierPaymentReceipt>('supplier-payment-receipts', {
    search: search || undefined,
    page,
    per_page: perPage,
  });

  const receipts: SupplierPaymentReceipt[] = resourceData?.data || [];
  const total = resourceData?.total || 0;
  const lastPage = resourceData?.last_page || 1;

  useEffect(() => {
    if (!selectedNumber && receipts.length > 0) {
      setSearchParams({ id: receipts[0].receipt_number }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipts, selectedNumber]);

  return (
    <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[360px_1fr]">
      {/* Left column: compact list */}
      <div className="flex flex-col min-h-0 border-r border-brand-border/50 bg-brand-white">
        <div className="px-4 py-3 flex items-center gap-2 border-b border-brand-border/50 flex-shrink-0">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-subtle" size={13} />
            <Input
              placeholder="Search by receipt # or supplier..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8 h-[34px] text-[12px] bg-brand-white border-brand-border rounded-lg shadow-sm w-full"
            />
          </div>
          <Button
            size="icon"
            onClick={onCreate}
            className="h-[34px] w-[34px] rounded-lg shadow-sm flex-shrink-0"
            title="Record Payment"
          >
            <Plus size={17} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <PageLoader label="Loading payments..." iconSize={28} className="h-full min-h-[200px] gap-3" />
          ) : receipts.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[200px] px-4">
              <p className="text-[12px] text-brand-subtle text-center">No supplier payments found.</p>
            </div>
          ) : (
            <ul>
              {receipts.map((r) => {
                const isSelected = r.receipt_number === selectedNumber;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setSearchParams({ id: r.receipt_number })}
                      className={cn(
                        'w-full text-left px-4 py-3 border-b border-brand-border/50 transition-colors hover:bg-brand-bg',
                        isSelected && 'bg-brand-accent/5 border-l-2 border-l-brand-accent'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <Avatar name={r.supplier?.name} className="w-8 h-8 text-[10px] mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-brand-primary truncate">
                              {r.supplier?.name || '—'}
                            </p>
                            {r.purchase_bill ? (
                              <p className="text-[11px] text-brand-subtle truncate mt-0.5">
                                {r.purchase_bill.bill_number}
                              </p>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="mt-0.5 bg-brand-surface text-brand-subtle border border-brand-border/50 text-[10px] font-medium px-1.5 py-0"
                              >
                                Advance / Unlinked
                              </Badge>
                            )}
                            <p className="text-[11px] text-brand-subtle mt-1">
                              <span className="font-mono text-brand-accent">{r.receipt_number}</span>
                              {' · '}
                              {r.payment_date ? new Date(r.payment_date).toLocaleDateString() : '—'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <p className="font-mono text-[13px] font-semibold text-brand-primary">
                            {Number(r.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                          <span className="text-[10px] font-medium text-brand-subtle capitalize">{r.payment_method}</span>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {!isLoading && receipts.length > 0 && (
          <div className="px-4 py-2.5 border-t border-brand-border/50 flex-shrink-0">
            <Pagination
              page={page}
              perPage={perPage}
              total={total}
              lastPage={lastPage}
              onPageChange={setPage}
              onPerPageChange={(next) => { setPerPage(next); setPage(1); }}
            />
          </div>
        )}
      </div>

      {/* Right column: detail */}
      <div className="hidden md:block min-h-0 overflow-y-auto bg-brand-white">
        {selectedNumber ? (
          <SupplierReceiptDetailPane
            id={selectedNumber}
            onEdit={onEdit}
            onDeleted={() => setSearchParams({}, { replace: true })}
          />
        ) : (
          <div className="h-full flex items-center justify-center min-h-[300px]">
            <p className="text-[13px] text-brand-subtle">Select a payment to view details.</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface SupplierReceiptDetailPaneProps {
  id: string;
  onEdit: (receipt: SupplierPaymentReceipt) => void;
  onDeleted: () => void;
}

const SupplierReceiptDetailPane = ({ id, onEdit, onDeleted }: SupplierReceiptDetailPaneProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currency = useCurrencyStore((s) => s.currency);
  const { data, isLoading } = useResourceDetail<SupplierPaymentReceipt>('supplier-payment-receipts', id);
  const { remove } = useResourceMutation('supplier-payment-receipts');

  const sendEmailMutation = useMutation({
    mutationFn: async (receiptId: number | string) =>
      (await api.post(`/admin/supplier-payment-receipts/${receiptId}/send-email`)).data,
    onSuccess: () => {
      toast.success('Payment receipt email sent');
      queryClient.invalidateQueries({ queryKey: ['supplier-payment-receipts'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to send email'),
  });

  const handleDelete = () => {
    if (!data || !window.confirm('Delete this payment receipt?')) return;
    remove.mutate(data.id, { onSuccess: onDeleted });
  };

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-brand-accent" size={32} />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle">Loading…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-96 flex items-center justify-center">
        <p className="text-sm text-brand-subtle">Payment receipt not found.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-brand-primary tracking-tight">
          PAYMENT RECEIPT {data.receipt_number}
        </h1>
        <div className="flex flex-wrap items-center gap-2.5">
          <DownloadButton id={data.id} type="supplier-payment-receipt" mode="view" variant="outline" label="View PDF" />
          <DownloadButton id={data.id} type="supplier-payment-receipt" mode="download" variant="outline" label="Download" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendEmailMutation.mutate(data.id)}
            disabled={sendEmailMutation.isPending}
            className="rounded-xl h-9 px-4 font-medium text-sm border-brand-border"
          >
            {sendEmailMutation.isPending ? (
              <Loader2 size={15} className="mr-2 animate-spin" />
            ) : (
              <Send size={15} className="mr-2" />
            )}
            Send
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(data)}
            className="rounded-xl h-9 px-4 font-medium text-sm border-brand-border"
          >
            <Pencil size={15} className="mr-2" /> Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 p-0 text-brand-subtle hover:text-brand-primary rounded-xl">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 bg-brand-white border-brand-border rounded-xl shadow-xl p-1">
              <DropdownMenuItem onClick={handleDelete} className="text-danger focus:text-danger rounded-lg cursor-pointer">
                <Trash2 size={14} className="mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-5">
        <ReceiptDocumentCard
          fullWidth
          kind="paid"
          receiptNumber={data.receipt_number || `#${id}`}
          amount={Number(data.amount || 0)}
          currency={currency}
          partyLabel="Supplier"
          partyName={data.supplier?.name}
          partyEmail={data.supplier?.email}
          partyPhone={data.supplier?.phone}
          paymentDate={data.payment_date}
          paymentMethod={data.payment_method}
          referenceId={data.reference_id}
          linkedDocument={
            data.purchase_bill
              ? {
                  label: 'Purchase Bill',
                  number: data.purchase_bill.bill_number,
                  onClick: () => navigate(`${getBasePath()}/purchases/${data.purchase_bill_id}`),
                }
              : null
          }
          notes={data.notes}
        />

        <LinkedDocumentSummaryCard
          label="Purchase Bill"
          number={data.purchase_bill?.bill_number}
          date={data.purchase_bill?.date}
          dueDate={data.purchase_bill?.due_date}
          total={Number(data.purchase_bill?.total || 0)}
          amountPaid={Number(data.purchase_bill?.amount_paid || 0)}
          balance={Number(data.purchase_bill?.balance || 0)}
          status={data.purchase_bill?.status}
          currency={currency}
          onClick={data.purchase_bill ? () => navigate(`${getBasePath()}/purchases/${data.purchase_bill_id}`) : undefined}
          emptyMessage="This payment isn't linked to a purchase bill — recorded as an advance."
        />
      </div>
    </div>
  );
};
