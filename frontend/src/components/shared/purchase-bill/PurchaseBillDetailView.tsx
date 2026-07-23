import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getBasePath } from '@/hooks/useBasePath';
import { useResourceDetail, useResourceMutation } from '@/hooks/useApi';
import { useTopbarActions } from '@/hooks/useTopbarActions';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DownloadButton } from '@/components/shared/DownloadButton';
import { Avatar } from '@/components/shared/Avatar';
import { SharedStatusSelect } from '@/components/shared/SharedStatusSelect';
import { TagsManager } from '@/components/shared/TagsManager';
import { PhoneFlag } from '@/components/shared/PhoneFlag';
import { ActivityTimeline } from '@/components/shared/quote-invoice/ActivityTimeline';
import { SupplierPaymentModal } from '@/components/shared/SupplierPaymentModal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { TRANSACTION_CONFIGS } from '@/lib/transactionTypes';
import { computeDocTotals, normalizeLineItems } from '@/lib/lineItemMath';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { CurrencyAmount } from '@/components/shared/CurrencyAmount';
import api from '@/lib/axios';
import type { PurchaseBill, QuoteAttachment } from '@/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Loader2,
  Receipt,
  Pencil,
  MoreHorizontal,
  Trash2,
  Calendar,
  Package,
  Paperclip,
  Download,
  X,
  Copy,
  Plus,
  List,
  Info,
  FileText,
  MessageSquare,
  History,
  Eye,
  Mail,
  Building2,
  Hash,
} from 'lucide-react';
import { toast } from 'sonner';

interface PurchaseBillDetailViewProps {
  id: string | number;
  onDeleted?: () => void;
}

const config = TRANSACTION_CONFIGS['purchase-bill'];

const detailTabs = [
  { id: 'items', label: 'Items', icon: List },
  { id: 'details', label: 'Details', icon: Info },
  { id: 'terms', label: 'Terms', icon: FileText },
  { id: 'notes', label: 'Notes', icon: MessageSquare },
  { id: 'history', label: 'History', icon: History },
];

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : '—');

const storageBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');

/**
 * Split-view detail pane for Purchase Bills — a sibling of QuoteDetailView.tsx
 * built for the purchasing side: supplier info instead of customer/deal,
 * no conversion workflow, and a "Record Payment" action (SupplierPaymentModal)
 * in place of "Send".
 */
export const PurchaseBillDetailView = ({ id, onDeleted }: PurchaseBillDetailViewProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currency = useCurrencyStore((s) => s.currency);

  const [activeTab, setActiveTab] = useState('items');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const { data, isLoading } = useResourceDetail<PurchaseBill>(config.apiBase, id);
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

  const canPreview = !!data?.id;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [config.apiBase, id] });
    queryClient.invalidateQueries({ queryKey: [config.apiBase] });
  };

  const quickUpdate = useMutation({
    mutationFn: (payload: Partial<Pick<PurchaseBill, 'status' | 'tags'>>) =>
      api.patch(`/admin/purchase-bills/${id}/quick-update`, payload),
    onSuccess: (_, variables) => {
      invalidate();
      if (variables.status) {
        toast.success('Status updated successfully.');
      } else if (variables.tags) {
        toast.success('Tags updated successfully.');
      } else {
        toast.success('Updated successfully.');
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Update failed.'),
  });

  const duplicateMutation = useMutation({
    mutationFn: async () => (await api.post(`/admin/purchase-bills/${id}/duplicate`)).data,
    onSuccess: (result: any) => {
      toast.success('Purchase bill duplicated.');
      queryClient.invalidateQueries({ queryKey: [config.apiBase] });
      navigate(`${getBasePath()}/purchases/${result.id}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Duplicate failed.'),
  });

  const uploadAttachment = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return (await api.post(`/admin/purchase-bills/${id}/attachments`, formData)).data;
    },
    onSuccess: () => {
      toast.success('Attachment uploaded.');
      invalidate();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Upload failed.'),
  });

  const deleteAttachment = useMutation({
    mutationFn: async (index: number) => (await api.delete(`/admin/purchase-bills/${id}/attachments/${index}`)).data,
    onSuccess: () => {
      toast.success('Attachment removed.');
      invalidate();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to remove attachment.'),
  });

  const handleDelete = () => {
    if (!window.confirm('Delete this purchase bill?')) return;
    remove.mutate(id, { onSuccess: () => onDeleted?.() });
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAttachment.mutate(file);
    e.target.value = '';
  };

  const handleAddTag = (newTag: string) => {
    const existing = data?.tags || [];
    if (!existing.includes(newTag)) {
      quickUpdate.mutate({ tags: [...existing, newTag] });
    }
  };

  const handleRemoveTag = (tag: string) => {
    const existing = data?.tags || [];
    quickUpdate.mutate({ tags: existing.filter((t: string) => t !== tag) });
  };

  const handlePreviewPdf = async () => {
    if (!data?.id) return;
    const newWindow = window.open('', '_blank');
    try {
      const response = await api.get(`/admin/${config.apiBase}/${data.id}/view`, {
        responseType: 'blob',
        headers: { Accept: 'application/pdf' },
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      if (newWindow) newWindow.location.href = url;
      else window.open(url, '_blank');
    } catch {
      if (newWindow) newWindow.close();
      toast.error('Failed to load PDF preview.');
    }
  };

  useTopbarActions(
    data ? (
      <div className="flex items-center gap-2.5 animate-in fade-in duration-200">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviewPdf}
          disabled={!canPreview}
          className="rounded-lg h-8 px-4 font-medium text-[12px] border-brand-border"
        >
          <Eye size={14} className="mr-2" /> Preview
        </Button>
        <DownloadButton id={id} type="purchase-bill" mode="view" variant="outline" label="Download PDF" />
        {data.status !== 'paid' && data.status !== 'cancelled' && (
          <Button
            onClick={() => setIsPaymentModalOpen(true)}
            size="sm"
            className="bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg h-8 px-4 font-semibold text-[12px] shadow-sm"
          >
            <Receipt size={14} className="mr-2" /> Record Payment
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`${getBasePath()}/purchases/${id}`)}
          className="rounded-lg h-8 px-4 font-medium text-[12px] border-brand-border"
        >
          <Pencil size={14} className="mr-2" /> Edit
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 text-brand-muted hover:text-brand-primary rounded-lg border border-brand-border">
              <MoreHorizontal size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 bg-brand-white border-brand-border rounded-lg shadow-lg p-1">
            <DropdownMenuItem onClick={() => duplicateMutation.mutate()} disabled={duplicateMutation.isPending} className="rounded-md cursor-pointer text-[12px] focus:bg-brand-bg">
              <Copy size={14} className="mr-2" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-brand-danger focus:text-brand-danger focus:bg-brand-danger/10 rounded-md cursor-pointer text-[12px]">
              <Trash2 size={14} className="mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ) : null
  );

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
        <p className="text-sm text-brand-subtle">Purchase bill not found.</p>
      </div>
    );
  }

  const attachments = data.attachments || [];
  const tags = data.tags || [];

  return (
    <div className="flex flex-col md:flex-row h-full min-h-0 bg-brand-page-bg animate-in fade-in duration-200">
      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col relative overflow-hidden bg-brand-white">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 custom-scrollbar">
          {/* Header */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-brand-primary tracking-tight">
                BILL {data.bill_number || `#${id}`}
              </h1>
              <StatusBadge status={data.status} />
            </div>
            {data.balance > 0 && (
              <p className="text-[12px] font-medium text-brand-subtle">
                Balance due: <span className="font-mono font-bold text-brand-danger"><CurrencyAmount amount={data.balance} currency={currency} /></span>
              </p>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-brand-bg/50 border border-brand-border h-auto p-1 rounded-xl w-full justify-start overflow-x-auto no-scrollbar gap-1 flex-nowrap">
              {detailTabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="data-[state=active]:bg-brand-white data-[state=active]:shadow-sm rounded-lg text-[12px] font-medium text-brand-subtle data-[state=active]:text-brand-primary flex items-center gap-2 px-4 py-2"
                >
                  <tab.icon size={14} />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="items" className="space-y-5 mt-5 outline-none">
              {/* Items table */}
              <div className="bg-brand-white border border-brand-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-brand-border hover:bg-transparent">
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle w-10">#</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle">Item</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle text-right">Qty</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle text-right">Cost</TableHead>
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
                                <div className="w-10 h-10 rounded-md bg-brand-bg flex items-center justify-center flex-shrink-0">
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
                          <TableCell className="text-[12px] text-brand-subtle text-right">{item.quantity}</TableCell>
                          <TableCell className="text-[12px] text-brand-subtle text-right">
                            {Number(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-[12px] text-brand-subtle text-right">
                            {Number(item.tax_percent ?? 0)}%
                          </TableCell>
                          <TableCell className="text-[12px] text-brand-primary font-medium text-right">
                            {Number(item.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="details" className="mt-5 outline-none">
              <div className="bg-brand-white border border-brand-border rounded-lg p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1">Bill Number</p>
                  <p className="text-[13px] font-medium text-brand-primary">{data.bill_number || `#${id}`}</p>
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
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1">Amount Paid</p>
                  <p className="text-[13px] font-medium text-brand-primary"><CurrencyAmount amount={data.amount_paid} currency={currency} /></p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1">Balance</p>
                  <p className="text-[13px] font-medium text-brand-primary"><CurrencyAmount amount={data.balance} currency={currency} /></p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="terms" className="mt-5 outline-none">
              <div className="bg-brand-white border border-brand-border rounded-lg p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1">Supplier Reference</p>
                  <p className="text-[13px] font-medium text-brand-primary">{data.reference_id || '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1">Terms & Conditions</p>
                  {data.terms ? (
                    <p className="text-[13px] font-medium text-brand-primary whitespace-pre-line">{data.terms}</p>
                  ) : (
                    <p className="text-[12px] text-brand-subtle italic">No terms recorded for this bill.</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="mt-5 outline-none">
              <div className="bg-brand-white border border-brand-border rounded-lg p-5">
                {data.notes ? (
                  <p className="text-[12px] text-brand-primary whitespace-pre-line">{data.notes}</p>
                ) : (
                  <p className="text-[12px] text-brand-subtle italic">No notes added.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-5 outline-none">
              <div className="bg-brand-white border border-brand-border rounded-lg">
                <ActivityTimeline activities={data.activities} />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sticky Footer spanning Main Column */}
        {activeTab === 'items' && (
          <div className="sticky bottom-0 z-30 bg-brand-white/95 backdrop-blur-sm border-t border-brand-border px-6 py-4 flex flex-col md:flex-row md:items-center justify-end gap-4 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
            <div className="flex flex-wrap items-center justify-end text-[12px] md:text-[13px] font-medium text-brand-subtle">
              <span className="uppercase tracking-wider">Subtotal:</span>
              <span className="text-brand-primary font-bold ml-1.5 mr-3">{totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>

              {totals.discountAmount > 0 && (
                <>
                  <span className="text-brand-border mx-1">|</span>
                  <span className="uppercase tracking-wider ml-2">Discount:</span>
                  <span className="text-brand-primary font-bold ml-1.5 mr-3">-{totals.discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </>
              )}

              <span className="text-brand-border mx-1">|</span>
              <span className="uppercase tracking-wider ml-2">VAT:</span>
              <span className="text-brand-primary font-bold ml-1.5 mr-3">{totals.vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>

              {totals.shippingAmount > 0 && (
                <>
                  <span className="text-brand-border mx-1">|</span>
                  <span className="uppercase tracking-wider ml-2">Shipping:</span>
                  <span className="text-brand-primary font-bold ml-1.5 mr-3">{totals.shippingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </>
              )}

              <span className="text-brand-border mx-1 hidden sm:inline">|</span>
              <span className="uppercase tracking-wider text-brand-primary ml-2">Total:</span>
              <span className="text-[15px] md:text-[16px] text-brand-primary font-bold ml-2"><CurrencyAmount amount={totals.total} currency={currency} /></span>
            </div>
          </div>
        )}
      </div>

      {/* Right rail matching PurchaseBillEditor.tsx */}
      <div className="w-full xl:w-[280px] flex-col flex-shrink-0 border-l border-brand-border overflow-y-auto no-scrollbar bg-brand-white">

        {/* Supplier */}
        {data.supplier && (
          <div className="p-4 md:p-5 border-b border-brand-border space-y-4">
            <p className="text-[14px] font-semibold text-brand-primary">Supplier</p>
            <div className="flex items-start gap-3.5">
              <Avatar name={data.supplier.name} className="w-11 h-11 text-[13px] rounded-xl shadow-sm border border-brand-border/50" />
              <div className="min-w-0 pt-0.5">
                <p className="text-[14px] font-bold text-brand-primary truncate">{data.supplier.name}</p>
                {data.supplier.supplier_code && (
                  <p className="text-[12px] font-medium text-brand-subtle truncate flex items-center gap-1.5 mt-0.5">
                    <Hash size={12} className="text-brand-accent/70" /> {data.supplier.supplier_code}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2 mt-2">
              {data.supplier.email && (
                <div className="flex items-center gap-2.5 text-[12px]">
                  <div className="w-6 h-6 rounded-md bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
                    <Mail size={12} className="text-brand-accent" />
                  </div>
                  <a href={`mailto:${data.supplier.email}`} className="text-brand-primary hover:text-brand-accent hover:underline truncate transition-colors font-medium">
                    {data.supplier.email}
                  </a>
                </div>
              )}
              {data.supplier.phone && (
                <div className="flex items-center gap-2.5 text-[12px]">
                  <div className="w-6 h-6 rounded-md bg-brand-surface-hover border border-brand-border/50 flex items-center justify-center flex-shrink-0">
                    <PhoneFlag phone={data.supplier.phone} size="sm" showNumber={false} />
                  </div>
                  <span className="text-brand-primary font-medium">{data.supplier.phone}</span>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-lg h-8 text-[12px] border-brand-border"
              onClick={() => navigate(`${getBasePath()}/suppliers/${data.supplier_id}`)}
            >
              <Building2 size={13} className="mr-1.5" /> View Supplier
            </Button>
          </div>
        )}

        {/* Status, Tags */}
        <div className="p-4 md:p-5 border-b border-brand-border space-y-4">
          <p className="text-[14px] font-semibold text-brand-primary">Status & Workflow</p>
          <SharedStatusSelect
            value={data.status}
            onChange={(value) => quickUpdate.mutate({ status: value as PurchaseBill['status'] })}
            options={config.statusOptions}
          />

          <div className="pt-3 space-y-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle mb-2.5">Tags</p>
              <TagsManager
                selectedTags={tags}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
              />
            </div>
          </div>
        </div>

        {/* Attachments */}
        <div className="border-b border-brand-border flex flex-col min-h-[200px] p-4 md:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-semibold text-brand-primary">Attachments</p>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-brand-subtle hover:text-brand-primary rounded-lg"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadAttachment.isPending}
            >
              {uploadAttachment.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
            </Button>
          </div>

          {attachments.length === 0 ? (
            <p className="text-[12px] text-brand-subtle italic">No attachments yet.</p>
          ) : (
            <ul className="space-y-2">
              {attachments.map((att: QuoteAttachment, idx: number) => (
                <li
                  key={`${att.path}-${idx}`}
                  className="flex items-center justify-between gap-2 bg-brand-bg rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip size={13} className="text-brand-subtle flex-shrink-0" />
                    <span className="text-[12px] text-brand-primary truncate">{att.name}</span>
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
                      className="text-brand-subtle hover:text-brand-danger p-1"
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

      <SupplierPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        purchaseBill={data}
      />
    </div>
  );
};
