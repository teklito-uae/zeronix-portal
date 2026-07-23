import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getBasePath } from '@/hooks/useBasePath';
import { useResourceDetail, useResourceMutation } from '@/hooks/useApi';
import { StatusBadge } from './StatusBadge';
import { DownloadButton } from './DownloadButton';
import { Avatar } from './Avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { TRANSACTION_CONFIGS, type TransactionConversionConfig } from '@/lib/transactionTypes';
import { computeDocTotals, normalizeLineItems } from '@/lib/lineItemMath';
import api from '@/lib/axios';
import type { Invoice, QuoteAttachment, ActivityLogEntry } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { CurrencyAmount } from '@/components/shared/CurrencyAmount';
import {
  Loader2,
  Send,
  Pencil,
  MoreHorizontal,
  Trash2,
  Calendar,
  Package,
  Paperclip,
  Upload,
  Download,
  X,
  Copy,
  Clock,
  ChevronDown,
  Plus,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface InvoiceDetailViewProps {
  id: string | number;
  onSend?: () => void;
  isSendPending?: boolean;
  onDeleted?: () => void;
}

const config = TRANSACTION_CONFIGS.invoice;

const detailTabs = [
  { id: 'items', label: 'Items' },
  { id: 'details', label: 'Details' },
  { id: 'terms', label: 'Terms' },
  { id: 'notes', label: 'Notes' },
  { id: 'history', label: 'History' },
];

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : '—');

const formatFileSize = (bytes?: number) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const storageBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');

/**
 * Invoice-specific detail pane (right column of InvoicesSplitView). Sibling
 * to QuoteDetailView.tsx — same tabs/rail/attachments/activity pattern, but
 * swaps quote-only fields (valid_until, closing_ratio, delivery_date) for
 * invoice-only ones (due_date as the primary date, amount_paid/balance).
 */
export const InvoiceDetailView = ({ id, onSend, isSendPending, onDeleted }: InvoiceDetailViewProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const admin = useAuthStore((s) => s.admin);
  const currency = useCurrencyStore((s) => s.currency);

  const [activeTab, setActiveTab] = useState('items');
  const [tagInput, setTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useResourceDetail<Invoice>(config.apiBase, id);
  const { remove } = useResourceMutation(config.apiBase);

  const normalizedItems = useMemo(() => normalizeLineItems(data?.items || []), [data]);
  const totals = useMemo(
    () =>
      computeDocTotals(normalizedItems, {
        discountPercent: Number(data?.discount_percent) || 0,
        shippingAmount: Number(data?.shipping_amount) || 0,
      }),
    [normalizedItems, data?.discount_percent, data?.shipping_amount]
  );

  const eligibleConversions = data ? (config.conversions || []).filter((c) => c.isEligible(data)) : [];

  const isLocked = data && config.isLocked ? config.isLocked(data, admin?.role) : false;
  // Mirrors InvoicePolicy::delete — staff may only delete their own invoice
  // before it's been accepted; admins are unrestricted.
  const canDelete =
    !!data &&
    (admin?.role === 'admin' || (data.user_id === admin?.id && ['draft', 'sent'].includes(data.status)));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [config.apiBase, id] });
    queryClient.invalidateQueries({ queryKey: [config.apiBase] });
  };

  const quickUpdate = useMutation({
    mutationFn: (
      payload: Partial<Pick<Invoice, 'status' | 'tags' | 'due_date' | 'deal_id' | 'payment_terms'>>
    ) => api.patch(`/admin/invoices/${id}/quick-update`, payload),
    onSuccess: () => invalidate(),
    onError: (err: any) => toast.error(err.response?.data?.message || 'Update failed.'),
  });

  const duplicateMutation = useMutation({
    mutationFn: async () => (await api.post(`/admin/invoices/${id}/duplicate`)).data,
    onSuccess: (result: any) => {
      toast.success('Invoice duplicated.');
      queryClient.invalidateQueries({ queryKey: [config.apiBase] });
      navigate(`${getBasePath()}/invoices/${result.id}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Duplicate failed.'),
  });

  const uploadAttachment = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return (await api.post(`/admin/invoices/${id}/attachments`, formData)).data;
    },
    onSuccess: () => {
      toast.success('Attachment uploaded.');
      invalidate();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Upload failed.'),
  });

  const deleteAttachment = useMutation({
    mutationFn: async (index: number) => (await api.delete(`/admin/invoices/${id}/attachments/${index}`)).data,
    onSuccess: () => {
      toast.success('Attachment removed.');
      invalidate();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to remove attachment.'),
  });

  const { data: dealOptions } = useQuery({
    queryKey: ['deals-for-invoice', data?.customer_id],
    queryFn: async () => (await api.get('/admin/deals', { params: { customer_id: data?.customer_id, per_page: 50 } })).data,
    enabled: !!data?.customer_id && !data?.deal_id,
  });

  const handleConvert = async (conversion: TransactionConversionConfig) => {
    if (!data?.id) return;
    try {
      const payload = conversion.buildPayload ? conversion.buildPayload(data, normalizedItems) : undefined;
      const res = await api.post(conversion.endpoint(data.id), payload);
      toast.success(`${conversion.label} succeeded.`);
      config.invalidateQueries.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      navigate(`${getBasePath()}${conversion.resultRoute(res.data)}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Conversion failed.');
    }
  };

  const handleDelete = () => {
    if (!window.confirm('Delete this invoice?')) return;
    remove.mutate(id, { onSuccess: () => onDeleted?.() });
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAttachment.mutate(file);
    e.target.value = '';
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setTagInput('');
      setIsAddingTag(false);
      return;
    }
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const value = tagInput.trim();
    if (!value) {
      setIsAddingTag(false);
      return;
    }
    const existing = data?.tags || [];
    if (!existing.includes(value)) {
      quickUpdate.mutate({ tags: [...existing, value] });
    }
    setTagInput('');
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tag: string) => {
    const existing = data?.tags || [];
    quickUpdate.mutate({ tags: existing.filter((t: string) => t !== tag) });
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
        <p className="text-sm text-brand-subtle">Invoice not found.</p>
      </div>
    );
  }

  const attachments = data.attachments || [];
  const tags = data.tags || [];

  return (
    <div className="flex h-full min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-brand-primary tracking-tight">
              INVOICE {data.invoice_number || `#${id}`}
            </h1>
            <StatusBadge status={data.status} />
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <DownloadButton id={id} type="invoice" mode="view" variant="outline" label="View PDF" />
            {eligibleConversions.length === 1 && (
              <Button
                onClick={() => handleConvert(eligibleConversions[0])}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 px-4 font-bold text-[11px] uppercase tracking-wider shadow-lg shadow-emerald-600/10"
              >
                {(() => {
                  const Icon = eligibleConversions[0].icon;
                  return <Icon size={15} className="mr-2" />;
                })()}
                {eligibleConversions[0].label}
              </Button>
            )}
            {eligibleConversions.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 px-4 font-bold text-[11px] uppercase tracking-wider shadow-lg shadow-emerald-600/10"
                  >
                    Convert <ChevronDown size={14} className="ml-1.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-brand-white border-brand-border rounded-xl shadow-xl p-1">
                  {eligibleConversions.map((conversion) => (
                    <DropdownMenuItem
                      key={conversion.label}
                      onClick={() => handleConvert(conversion)}
                      className="rounded-lg cursor-pointer text-[12px]"
                    >
                      <conversion.icon size={14} className="mr-2" /> {conversion.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {onSend && (
              <Button
                onClick={onSend}
                disabled={isSendPending}
                size="sm"
                variant="outline"
                className="rounded-xl h-9 px-4 font-medium text-sm border-brand-border"
              >
                {isSendPending ? <Loader2 className="animate-spin mr-2" size={15} /> : <Send size={15} className="mr-2" />}
                Send
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`${getBasePath()}/invoices/${id}`)}
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

        {/* Tabs */}
        <div className="border-b border-brand-border flex items-center gap-6 overflow-x-auto no-scrollbar">
          {detailTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'py-2.5 text-[13px] whitespace-nowrap transition-colors border-b-2',
                  isActive
                    ? 'font-semibold text-brand-primary border-brand-accent'
                    : 'font-medium text-brand-subtle hover:text-brand-primary border-transparent'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'items' && (
          <div className="space-y-5">
            {/* Items table */}
            <div className="bg-brand-bg border border-brand-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-brand-border hover:bg-transparent">
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle w-10">#</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle">Item</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle text-right">Qty</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle text-right">Price</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle text-right">Tax</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {normalizedItems.length === 0 && (
                    <TableRow className="border-brand-border">
                      <TableCell colSpan={6} className="text-center text-[12px] text-brand-subtle py-6">
                        No line items.
                      </TableCell>
                    </TableRow>
                  )}
                  {normalizedItems.map((item: any, idx: number) => {
                    const showSubtitle = item.product_name && item.product_name !== item.description;
                    return (
                      <TableRow key={item.id ?? idx} className="border-brand-border">
                        <TableCell className="text-[12px] text-brand-subtle">{idx + 1}</TableCell>
                        <TableCell className="text-[12px] text-brand-primary font-medium">
                          <div className="flex items-center gap-3">
                            {item.product?.image ? (
                              <img
                                src={item.product.image}
                                alt=""
                                className="w-10 h-10 rounded-md object-cover flex-shrink-0 border border-brand-border"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-md bg-brand-white-hover flex items-center justify-center flex-shrink-0">
                                <Package size={16} className="text-brand-subtle" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate">{item.description || item.product_name || '—'}</p>
                              {showSubtitle && (
                                <p className="text-[11px] text-brand-subtle truncate">{item.product_name}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-[12px] text-brand-secondary text-right">{item.quantity}</TableCell>
                        <TableCell className="text-[12px] text-brand-secondary text-right">
                          {Number(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-[12px] text-brand-secondary text-right">
                          {Number(item.tax_percent ?? 0)}%
                        </TableCell>
                        <TableCell className="text-[12px] text-brand-primary font-medium text-right">
                          {(Number(item.quantity) * Number(item.unit_price)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Message to customer + totals */}
            <div className="flex flex-col md:flex-row gap-5">
              <div className="flex-1 bg-brand-bg border border-brand-border rounded-lg p-5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-2">
                  Message to Customer
                </p>
                {data.notes ? (
                  <p className="text-[12px] text-brand-secondary whitespace-pre-line">{data.notes}</p>
                ) : (
                  <p className="text-[12px] text-brand-subtle italic">No message added for this invoice.</p>
                )}
              </div>
              <div className="w-full md:w-72 flex-shrink-0 bg-brand-bg border border-brand-border rounded-lg p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-wider text-brand-subtle">Subtotal</p>
                  <p className="text-[13px] font-medium text-brand-primary">
                    {totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {totals.discountAmount > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-wider text-brand-subtle">Discount</p>
                    <p className="text-[13px] font-medium text-brand-primary">
                      -{totals.discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-wider text-brand-subtle">VAT</p>
                  <p className="text-[13px] font-medium text-brand-primary">
                    {totals.vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {totals.shippingAmount > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-wider text-brand-subtle">Shipping</p>
                    <p className="text-[13px] font-medium text-brand-primary">
                      {totals.shippingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-brand-border">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-brand-subtle">Total</p>
                  <p className="text-lg font-bold text-brand-accent font-mono">
                    <CurrencyAmount amount={totals.total} currency={currency} />
                  </p>
                </div>
                {data.amount_paid > 0 && (
                  <>
                    <div className="flex items-center justify-between pt-2 border-t border-brand-border">
                      <p className="text-[11px] uppercase tracking-wider text-brand-subtle">Paid</p>
                      <p className="text-[13px] font-medium text-emerald-600">
                        {data.amount_paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] uppercase tracking-wider text-brand-subtle">Balance Due</p>
                      <p className="text-[13px] font-bold text-brand-primary">
                        {data.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Attachments */}
            <div className="bg-brand-bg border border-brand-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle">Attachments</p>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg h-8 px-3 text-xs font-medium border-brand-border"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadAttachment.isPending}
                >
                  {uploadAttachment.isPending ? (
                    <Loader2 size={13} className="animate-spin mr-1.5" />
                  ) : (
                    <Upload size={13} className="mr-1.5" />
                  )}
                  Upload
                </Button>
              </div>
              {attachments.length === 0 ? (
                <p className="text-[12px] text-brand-subtle italic">No attachments yet.</p>
              ) : (
                <ul className="space-y-2">
                  {attachments.map((att: QuoteAttachment, idx: number) => (
                    <li
                      key={`${att.path}-${idx}`}
                      className="flex items-center justify-between gap-2 bg-brand-white-hover rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip size={13} className="text-brand-subtle flex-shrink-0" />
                        <span className="text-[12px] text-brand-primary truncate">{att.name}</span>
                        {att.size !== undefined && (
                          <span className="text-[11px] text-brand-subtle flex-shrink-0">{formatFileSize(att.size)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <a
                          href={`${storageBaseUrl}/storage/${att.path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-subtle hover:text-brand-primary p-1"
                        >
                          <Download size={13} />
                        </a>
                        <button
                          type="button"
                          onClick={() => deleteAttachment.mutate(idx)}
                          className="text-brand-subtle hover:text-danger p-1"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="bg-brand-bg border border-brand-border rounded-lg p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1">Invoice Number</p>
              <p className="text-[13px] font-medium text-brand-primary">{data.invoice_number || `#${id}`}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1 flex items-center gap-1.5">
                <Calendar size={11} /> Date
              </p>
              <p className="text-[13px] font-medium text-brand-primary">{formatDate(data.date)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1">Status</p>
              <StatusBadge status={data.status} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1 flex items-center gap-1.5">
                <Calendar size={11} /> Due Date
              </p>
              <p className="text-[13px] font-medium text-brand-primary">{formatDate(data.due_date)}</p>
            </div>
            {data.amount_paid > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1">Amount Paid</p>
                <p className="text-[13px] font-medium text-brand-primary">
                  {data.amount_paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="bg-brand-bg border border-brand-border rounded-lg p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1">Payment Terms</p>
              <p className="text-[13px] font-medium text-brand-primary">{data.payment_terms || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1">Due Date</p>
              <p className="text-[13px] font-medium text-brand-primary">{formatDate(data.due_date)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1">Reference</p>
              <p className="text-[13px] font-medium text-brand-primary">{data.reference_id || '—'}</p>
            </div>
            {data.terms && (
              <p className="col-span-full text-[12px] text-brand-secondary whitespace-pre-line">{data.terms}</p>
            )}
            {!data.reference_id && !data.payment_terms && !data.terms && (
              <p className="col-span-full text-[12px] text-brand-subtle italic">No additional terms recorded for this invoice.</p>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="bg-brand-bg border border-brand-border rounded-lg p-5">
            {data.notes ? (
              <p className="text-[12px] text-brand-secondary whitespace-pre-line">{data.notes}</p>
            ) : (
              <p className="text-[12px] text-brand-subtle italic">No notes added.</p>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-brand-bg border border-brand-border rounded-lg p-5">
            {!data.activities || data.activities.length === 0 ? (
              <p className="text-[12px] text-brand-subtle italic">No activity recorded yet.</p>
            ) : (
              <ul className="space-y-0">
                {data.activities.map((activity: ActivityLogEntry, idx: number) => (
                  <li key={activity.id} className="flex gap-3 pb-4 last:pb-0">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-brand-accent mt-1.5" />
                      {idx < (data.activities?.length || 0) - 1 && (
                        <div className="w-px flex-1 bg-admin-border mt-1" />
                      )}
                    </div>
                    <div className="min-w-0 pb-1">
                      <p className="text-[12px] text-brand-primary">{activity.description}</p>
                      <p className="text-[11px] text-brand-subtle flex items-center gap-1 mt-0.5">
                        <Clock size={10} /> {activity.created_at ? new Date(activity.created_at).toLocaleString() : '—'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Right rail */}
      <div className="w-[300px] flex-shrink-0 border-l border-brand-border p-4 space-y-5 overflow-y-auto">
        <h2 className="text-[14px] font-bold text-brand-primary tracking-tight px-1">Details</h2>

        {/* Customer card */}
        {data.customer && (
          <div className="bg-brand-bg border border-brand-border rounded-lg p-5 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-2">Customer</p>
            <div className="flex items-start gap-3 mb-1">
              <Avatar name={data.customer.company || data.customer.name} className="w-10 h-10 text-[12px]" />
              <div className="min-w-0 pt-0.5">
                <p className="text-[13px] font-bold text-brand-primary truncate">{data.customer.name}</p>
                {data.customer.company && (
                  <p className="text-[12px] text-brand-secondary truncate">{data.customer.company}</p>
                )}
              </div>
            </div>
            {data.customer.email && (
              <a href={`mailto:${data.customer.email}`} className="text-[12px] text-brand-accent hover:underline block">
                {data.customer.email}
              </a>
            )}
            {data.customer.phone && <p className="text-[12px] text-brand-subtle">{data.customer.phone}</p>}
            {data.customer.address && (
              <p className="text-[12px] text-brand-subtle whitespace-pre-line">{data.customer.address}</p>
            )}
          </div>
        )}

        {/* Invoice info: owner, status, tags */}
        <div className="bg-brand-bg border border-brand-border rounded-lg p-5 space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle">Invoice Info</p>

          {/* Owner */}
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-brand-subtle">Sales Person</p>
            <div className="flex items-center gap-2">
              <Avatar name={data.user?.name} className="w-6 h-6 text-[10px]" />
              <p className="text-[12px] font-medium text-brand-primary">{data.user?.name || '—'}</p>
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-[11px] text-brand-subtle mb-1.5">Status</p>
            <Select value={data.status} onValueChange={(value) => quickUpdate.mutate({ status: value as Invoice['status'] })}>
              <SelectTrigger className="h-9 text-[12px] bg-brand-bg border-brand-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {config.statusOptions.map((option) => (
                  <SelectItem key={option} value={option} className="text-[12px]">
                    {option.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div>
            <p className="text-[11px] text-brand-subtle mb-1.5">Tags</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {tags.map((tag: string) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-white-hover px-2.5 py-1 text-[11px] text-brand-secondary"
                >
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-danger">
                    <X size={10} />
                  </button>
                </span>
              ))}
              {isAddingTag ? (
                <Input
                  ref={tagInputRef}
                  autoFocus
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  onBlur={() => {
                    if (!tagInput.trim()) setIsAddingTag(false);
                  }}
                  placeholder="Tag name…"
                  className="h-6 w-24 text-[11px] px-2 bg-brand-bg border-brand-border rounded-full"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingTag(true)}
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-dashed border-brand-border text-brand-subtle hover:text-brand-accent hover:border-brand-accent transition-colors"
                  title="Add tag"
                >
                  <Plus size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Invoice properties */}
        <div className="bg-brand-bg border border-brand-border rounded-lg p-5 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1">Invoice Properties</p>
          <div>
            <p className="text-[11px] text-brand-subtle mb-0.5">Currency</p>
            <p className="text-[12px] font-medium text-brand-primary">{currency}</p>
          </div>
          <div>
            <p className="text-[11px] text-brand-subtle mb-0.5">Payment Terms</p>
            <Input
              defaultValue={data.payment_terms || ''}
              placeholder="e.g. Net 30"
              onBlur={(e) => {
                if (e.target.value !== (data.payment_terms || '')) {
                  quickUpdate.mutate({ payment_terms: e.target.value });
                }
              }}
              className="h-8 text-[12px] bg-brand-bg border-brand-border"
            />
          </div>
          <div>
            <p className="text-[11px] text-brand-subtle mb-0.5">Due Date</p>
            <input
              type="date"
              defaultValue={data.due_date ? data.due_date.slice(0, 10) : ''}
              onChange={(e) => quickUpdate.mutate({ due_date: e.target.value })}
              className="w-full h-8 rounded-md border border-brand-border bg-brand-bg px-2 text-[12px] text-brand-primary"
            />
          </div>
        </div>

        {/* Related */}
        <div className="bg-brand-bg border border-brand-border rounded-lg p-5 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1">Related</p>
          {data.customerContact && (
            <div>
              <p className="text-[11px] text-brand-subtle mb-0.5">Contact</p>
              <p className="text-[12px] font-medium text-brand-primary">{data.customerContact.full_name}</p>
            </div>
          )}
          <div>
            <p className="text-[11px] text-brand-subtle mb-0.5">Deal</p>
            {data.deal ? (
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] font-medium text-brand-primary truncate">{data.deal.title}</p>
                <button
                  type="button"
                  onClick={() => quickUpdate.mutate({ deal_id: null })}
                  className="text-brand-subtle hover:text-danger flex-shrink-0"
                  title="Unlink deal"
                >
                  <X size={12} />
                </button>
              </div>
            ) : dealOptions?.data?.length ? (
              <select
                defaultValue=""
                onChange={(e) => e.target.value && quickUpdate.mutate({ deal_id: Number(e.target.value) })}
                className="w-full h-8 rounded-md border border-brand-border bg-brand-bg px-2 text-[12px] text-brand-primary"
              >
                <option value="" disabled>
                  Link a deal…
                </option>
                {dealOptions.data.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-[12px] text-brand-subtle">—</p>
            )}
          </div>
          {data.quote && (
            <div>
              <p className="text-[11px] text-brand-subtle mb-0.5">Quote</p>
              <p className="text-[12px] font-medium text-brand-primary">{data.quote.quote_number}</p>
            </div>
          )}
          {data.customer?.company && (
            <div>
              <p className="text-[11px] text-brand-subtle mb-0.5">Company</p>
              <p className="text-[12px] font-medium text-brand-primary">{data.customer.company}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-brand-bg border border-brand-border rounded-lg p-5 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1">Actions</p>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start rounded-lg h-9 px-3 text-[12px] font-medium border-brand-border"
            onClick={() => duplicateMutation.mutate()}
            disabled={duplicateMutation.isPending}
          >
            {duplicateMutation.isPending ? (
              <Loader2 size={14} className="animate-spin mr-2" />
            ) : (
              <Copy size={14} className="mr-2" />
            )}
            Duplicate Invoice
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start rounded-lg h-9 px-3 text-[12px] font-medium border-brand-border text-danger hover:text-danger"
            onClick={handleDelete}
          >
            <Trash2 size={14} className="mr-2" /> Delete Invoice
          </Button>
        </div>
      </div>
    </div>
  );
};
