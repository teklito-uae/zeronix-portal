import { getBasePath } from '@/hooks/useBasePath';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBreadcrumb } from '@/hooks/useBreadcrumb';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/axios';
import type { AxiosError } from 'axios';
import type { Customer, Invoice, PaymentReceipt } from '@/types';
import { ArrowLeft, Save, Loader2, Calendar, User, FileCheck2 } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentReceiptEditorProps {
  id?: string;
  isNew: boolean;
}

/**
 * Payment Receipt Editor — a simpler sibling of DeliveryEditor: no line
 * items, just a customer, an optional linked invoice, and payment details
 * (amount/date/method/reference/notes). Mirrors the fields already used by
 * PaymentReceiptModal.tsx / SupplierPaymentModal.tsx (standalone mode), but
 * as a full page so it can be reached directly via /payment-receipts/:id
 * and /payment-receipts/create, matching how every other transaction type
 * (Deliveries, Purchase Bills, Invoices...) gets its own routed detail page.
 */
export const PaymentReceiptEditor = ({ id, isNew }: PaymentReceiptEditorProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currency = useCurrencyStore((s) => s.currency);
  const [loading, setLoading] = useState(false);

  const [docData, setDocData] = useState<Partial<PaymentReceipt>>({
    customer_id: undefined,
    invoice_id: undefined,
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank',
    reference_id: '',
    notes: '',
  });

  const docLabel = isNew ? 'New Payment Receipt' : (docData.receipt_number || `#${id}`);

  useBreadcrumb([
    { label: 'Payment Receipts', href: `${getBasePath()}/payment-receipts` },
    { label: docLabel },
  ]);

  const { data: customersList = [] } = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: async () => (await api.get('/admin/customers?per_page=100')).data.data as Customer[],
  });

  // Invoices have no customer_id filter server-side, so fetch the capped list
  // once and narrow it to the selected customer client-side — same approach
  // SupplierPaymentModal uses for "Link to a Purchase Bill" (there the API
  // does support supplier_id, but the narrowing pattern is identical).
  const { data: allInvoices = [] } = useQuery({
    queryKey: ['invoices', 'all'],
    queryFn: async () => (await api.get('/admin/invoices?per_page=100')).data.data as Invoice[],
    enabled: !!docData.customer_id,
  });

  const linkableInvoices = allInvoices.filter(
    (inv) => inv.customer_id === docData.customer_id && Number(inv.balance) > 0
  );

  useEffect(() => {
    if (!isNew && id) fetchDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNew]);

  const fetchDocument = async () => {
    setLoading(true);
    try {
      const response = await api.get<PaymentReceipt>(`/admin/payment-receipts/${id}`);
      const data = response.data;
      setDocData({
        ...data,
        payment_date: data.payment_date ? data.payment_date.split('T')[0] : '',
      });
    } catch {
      toast.error('Failed to load payment receipt');
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceChange = (value: string) => {
    if (value === 'none') {
      setDocData((prev) => ({ ...prev, invoice_id: undefined }));
      return;
    }
    const invoiceId = Number(value);
    const invoice = linkableInvoices.find((inv) => inv.id === invoiceId);
    setDocData((prev) => ({
      ...prev,
      invoice_id: invoiceId,
      amount: invoice ? Number(invoice.balance) : prev.amount,
    }));
  };

  const handleSave = async () => {
    if (!docData.customer_id) return toast.error('Please select a customer first.');
    if (!docData.amount || Number(docData.amount) <= 0) return toast.error('Enter a valid amount.');
    setLoading(true);
    try {
      const payload = {
        customer_id: docData.customer_id,
        invoice_id: docData.invoice_id || null,
        amount: docData.amount,
        payment_date: docData.payment_date,
        payment_method: docData.payment_method,
        reference_id: docData.reference_id,
        notes: docData.notes,
      };
      if (isNew) {
        await api.post('/admin/payment-receipts', payload);
        toast.success('Payment Receipt created successfully.');
      } else {
        await api.put(`/admin/payment-receipts/${id}`, payload);
        toast.success(`${docLabel} updated.`);
      }
      queryClient.invalidateQueries({ queryKey: ['payment-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      navigate(`${getBasePath()}/payment-receipts`);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      toast.error(axiosErr.response?.data?.message || 'Save failed. Please check the form.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isNew && !docData.id) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-brand-accent" size={32} />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle">Loading…</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`${getBasePath()}/payment-receipts`)}
            className="rounded-xl border-brand-border h-10 w-10 hover:bg-brand-white-hover shadow-sm transition-all active:scale-95"
          >
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-xl font-bold text-brand-primary tracking-tight">
            {isNew ? 'New Payment Receipt' : `PAYMENT RECEIPT ${docData.receipt_number || '#' + id}`}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={handleSave}
            disabled={loading}
            size="sm"
            className="bg-brand-accent hover:bg-brand-accent-hover text-white rounded-md h-9 px-4 font-medium text-sm transition-all active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
            Save Payment Receipt
          </Button>
        </div>
      </div>

      <div className="bg-brand-bg border border-brand-border rounded-lg p-5 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle ml-1 flex items-center gap-1.5">
            <User size={12} className="text-brand-accent" /> Customer *
          </Label>
          <Select
            value={docData.customer_id ? String(docData.customer_id) : ''}
            onValueChange={(v) => setDocData((prev) => ({ ...prev, customer_id: Number(v), invoice_id: undefined }))}
          >
            <SelectTrigger className="h-11 bg-brand-white border-brand-border rounded-xl text-sm shadow-sm">
              <SelectValue placeholder="Select customer…" />
            </SelectTrigger>
            <SelectContent className="bg-brand-white border-brand-border rounded-xl shadow-2xl">
              {customersList.map((c) => (
                <SelectItem key={c.id} value={String(c.id)} className="rounded-lg m-1">{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle ml-1 flex items-center gap-1.5">
            <FileCheck2 size={12} className="text-brand-accent" /> Invoice
          </Label>
          <Select
            value={docData.invoice_id ? String(docData.invoice_id) : 'none'}
            onValueChange={handleInvoiceChange}
            disabled={!docData.customer_id}
          >
            <SelectTrigger className="h-11 bg-brand-white border-brand-border rounded-xl text-sm shadow-sm">
              <SelectValue placeholder="Select invoice…" />
            </SelectTrigger>
            <SelectContent className="bg-brand-white border-brand-border rounded-xl shadow-2xl">
              <SelectItem value="none" className="rounded-lg m-1">Account Payment (no invoice)</SelectItem>
              {linkableInvoices.map((inv) => (
                <SelectItem key={inv.id} value={String(inv.id)} className="rounded-lg m-1">
                  {inv.invoice_number} — {Number(inv.balance).toLocaleString()} {currency} due
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle ml-1">Amount ({currency}) *</Label>
          <Input
            type="number"
            step="0.01"
            value={docData.amount}
            onChange={(e) => setDocData({ ...docData, amount: Number(e.target.value) })}
            className="h-11 bg-brand-white border-brand-border rounded-xl text-sm shadow-sm font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle ml-1 flex items-center gap-1.5">
            <Calendar size={12} className="text-brand-accent" /> Payment Date *
          </Label>
          <Input
            type="date"
            value={docData.payment_date ? docData.payment_date.split('T')[0] : ''}
            onChange={(e) => setDocData({ ...docData, payment_date: e.target.value })}
            className="h-11 bg-brand-white border-brand-border rounded-xl text-sm shadow-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle ml-1">Payment Method *</Label>
          <Select
            value={docData.payment_method || 'bank'}
            onValueChange={(v: 'cash' | 'bank') => setDocData({ ...docData, payment_method: v })}
          >
            <SelectTrigger className="h-11 bg-brand-white border-brand-border rounded-xl text-sm shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-brand-white border-brand-border rounded-xl shadow-2xl">
              <SelectItem value="bank" className="rounded-lg m-1">Bank Transfer</SelectItem>
              <SelectItem value="cash" className="rounded-lg m-1">Cash</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle ml-1">Reference / Trans ID</Label>
          <Input
            value={docData.reference_id || ''}
            onChange={(e) => setDocData({ ...docData, reference_id: e.target.value })}
            placeholder="Cheque # or reference"
            className="h-11 bg-brand-white border-brand-border rounded-xl text-sm shadow-sm"
          />
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle ml-1">Notes</Label>
          <Textarea
            value={docData.notes || ''}
            onChange={(e) => setDocData({ ...docData, notes: e.target.value })}
            className="bg-brand-white border-brand-border rounded-xl text-sm resize-none min-h-[80px]"
            placeholder="Internal notes…"
          />
        </div>
      </div>
    </div>
  );
};
