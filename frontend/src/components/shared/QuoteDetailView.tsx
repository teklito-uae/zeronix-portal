import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getBasePath } from '@/hooks/useBasePath';
import { useResourceDetail, useResourceMutation } from '@/hooks/useApi';
import { useTopbarActions } from '@/hooks/useTopbarActions';
import { StatusBadge } from './StatusBadge';
import { DownloadButton } from './DownloadButton';
import { Avatar } from './Avatar';
import { SharedStatusSelect } from './SharedStatusSelect';
import { SharedTagBadge } from './SharedTagBadge';
import { TagsManager } from './TagsManager';
import { PhoneFlag } from './PhoneFlag';
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
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { CurrencyAmount } from '@/components/shared/CurrencyAmount';
import api from '@/lib/axios';
import type { Quote, QuoteAttachment, ActivityLogEntry } from '@/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  List,
  Info,
  FileText,
  MessageSquare,
  History,
  Eye,
  ChevronRight,
  Phone,
  Mail,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';

interface QuoteDetailViewProps {
  id: string | number;
  onSend?: () => void;
  isSendPending?: boolean;
  onDeleted?: () => void;
}

const config = TRANSACTION_CONFIGS.quote;

const detailTabs = [
  { id: 'items', label: 'Items', icon: List },
  { id: 'details', label: 'Details', icon: Info },
  { id: 'terms', label: 'Terms', icon: FileText },
  { id: 'notes', label: 'Notes', icon: MessageSquare },
  { id: 'history', label: 'History', icon: History },
];

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : '—');

const formatFileSize = (bytes?: number) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const storageBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');

export const QuoteDetailView = ({ id, onSend, isSendPending, onDeleted }: QuoteDetailViewProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currency = useCurrencyStore((s) => s.currency);

  const [activeTab, setActiveTab] = useState('items');
  const [tagInput, setTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useResourceDetail<Quote>(config.apiBase, id);
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
  const canPreview = !!data?.id;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [config.apiBase, id] });
    queryClient.invalidateQueries({ queryKey: [config.apiBase] });
  };

  const quickUpdate = useMutation({
    mutationFn: (
      payload: Partial<
        Pick<Quote, 'status' | 'tags' | 'valid_until' | 'due_date' | 'deal_id' | 'payment_terms' | 'delivery_date'>
      >
    ) => api.patch(`/admin/quotes/${id}/quick-update`, payload),
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
    mutationFn: async () => (await api.post(`/admin/quotes/${id}/duplicate`)).data,
    onSuccess: (result: any) => {
      toast.success('Quote duplicated.');
      queryClient.invalidateQueries({ queryKey: [config.apiBase] });
      navigate(`${getBasePath()}/quotes/${result.id}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Duplicate failed.'),
  });

  const uploadAttachment = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return (await api.post(`/admin/quotes/${id}/attachments`, formData)).data;
    },
    onSuccess: () => {
      toast.success('Attachment uploaded.');
      invalidate();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Upload failed.'),
  });

  const deleteAttachment = useMutation({
    mutationFn: async (index: number) => (await api.delete(`/admin/quotes/${id}/attachments/${index}`)).data,
    onSuccess: () => {
      toast.success('Attachment removed.');
      invalidate();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to remove attachment.'),
  });

  const { data: dealOptions } = useQuery({
    queryKey: ['deals-for-quote', data?.customer_id],
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
    if (!window.confirm('Delete this quote?')) return;
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
        <DownloadButton id={id} type="quote" mode="view" variant="outline" label="Download PDF" />
        {eligibleConversions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                className="bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg h-8 px-4 font-semibold text-[12px] uppercase tracking-wider shadow-sm"
              >
                Convert <ChevronDown size={14} className="ml-1.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-brand-white border-brand-border rounded-lg shadow-lg p-1">
              {eligibleConversions.map((conversion) => (
                <DropdownMenuItem
                  key={conversion.label}
                  onClick={() => handleConvert(conversion)}
                  className="rounded-md cursor-pointer text-[12px] font-medium"
                >
                  <conversion.icon size={14} className="mr-2 text-brand-subtle" /> {conversion.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {onSend && !['accepted', 'declined', 'invoiced'].includes(data.status) && (
          <Button
            onClick={onSend}
            disabled={isSendPending}
            size="sm"
            variant="outline"
            className="rounded-lg h-8 px-4 font-medium text-[12px] border-brand-border"
          >
            {isSendPending ? <Loader2 className="animate-spin mr-2" size={14} /> : <Send size={14} className="mr-2" data-icon="inline-start" />}
            Send
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`${getBasePath()}/quotes/${id}`)}
          className="rounded-lg h-8 px-4 font-medium text-[12px] border-brand-border"
        >
          <Pencil size={14} className="mr-2" data-icon="inline-start" /> Edit
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
        <p className="text-sm text-brand-subtle">Quote not found.</p>
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
                QUOTE {data.quote_number || `#${id}`}
              </h1>
              <StatusBadge status={data.status} />
            </div>
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
                            {(Number(item.quantity) * Number(item.unit_price)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Message to customer */}
              <div className="flex flex-col md:flex-row gap-5">
                <div className="flex-1 bg-brand-white border border-brand-border rounded-lg p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-2">
                    Message to Customer
                  </p>
                  {data.notes ? (
                    <p className="text-[12px] text-brand-primary whitespace-pre-line">{data.notes}</p>
                  ) : (
                    <p className="text-[12px] text-brand-subtle italic">No message added for this quote.</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="mt-5 outline-none">
              <div className="bg-brand-white border border-brand-border rounded-lg p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1">Quote Number</p>
                  <p className="text-[13px] font-medium text-brand-primary">{data.quote_number || `#${id}`}</p>
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
                    <Calendar size={11} /> Valid Until
                  </p>
                  <p className="text-[13px] font-medium text-brand-primary">{formatDate(data.valid_until)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1 flex items-center gap-1.5">
                    <Calendar size={11} /> Follow-up Due
                  </p>
                  <p className="text-[13px] font-medium text-brand-primary">{formatDate(data.due_date)}</p>
                </div>
                {data.closing_ratio !== undefined && data.closing_ratio !== null && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1">Closing Ratio</p>
                    <p className="text-[13px] font-medium text-brand-primary">{data.closing_ratio}%</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="terms" className="mt-5 outline-none">
              <div className="bg-brand-white border border-brand-border rounded-lg p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1">Payment Terms</p>
                  <p className="text-[13px] font-medium text-brand-primary">{data.payment_terms || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1">Valid Until</p>
                  <p className="text-[13px] font-medium text-brand-primary">{formatDate(data.valid_until)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1">Delivery Date</p>
                  <p className="text-[13px] font-medium text-brand-primary">{formatDate(data.delivery_date)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1">Reference</p>
                  <p className="text-[13px] font-medium text-brand-primary">{data.reference_id || '—'}</p>
                </div>
                {!data.reference_id && !data.valid_until && !data.payment_terms && !data.delivery_date && (
                  <p className="col-span-full text-[12px] text-brand-subtle italic">No additional terms recorded for this quote.</p>
                )}
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
              <div className="bg-brand-white border border-brand-border rounded-lg p-5">
                {!data.activities || data.activities.length === 0 ? (
                  <p className="text-[12px] text-brand-subtle italic">No activity recorded yet.</p>
                ) : (
                  <ul className="space-y-0">
                    {data.activities.map((activity: ActivityLogEntry, idx: number) => (
                      <li key={activity.id} className="flex gap-3 pb-4 last:pb-0">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-brand-accent mt-1.5" />
                          {idx < (data.activities?.length || 0) - 1 && (
                            <div className="w-px flex-1 bg-brand-border mt-1" />
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

      {/* Right rail matching QuoteInvoiceEditor.tsx */}
      <div className="w-full xl:w-[280px] flex-col flex-shrink-0 border-l border-brand-border overflow-y-auto no-scrollbar bg-brand-white">
        
        {/* Customer & Related */}
        {data.customer && (
          <div className="p-4 md:p-5 border-b border-brand-border space-y-4">
            <p className="text-[14px] font-semibold text-brand-primary">Customer & Deal</p>
            <div className="flex items-start gap-3.5">
              <Avatar name={data.customer.company || data.customer.name} className="w-11 h-11 text-[13px] rounded-xl shadow-sm border border-brand-border/50" />
              <div className="min-w-0 pt-0.5">
                <p className="text-[14px] font-bold text-brand-primary truncate">{data.customer.name}</p>
                {data.customer.company && (
                  <p className="text-[12px] font-medium text-brand-subtle truncate flex items-center gap-1.5 mt-0.5">
                    <Building2 size={12} className="text-brand-accent/70" /> {data.customer.company}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2 mt-2">
              {data.customer.email && (
                <div className="flex items-center gap-2.5 text-[12px]">
                  <div className="w-6 h-6 rounded-md bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
                    <Mail size={12} className="text-brand-accent" />
                  </div>
                  <a href={`mailto:${data.customer.email}`} className="text-brand-primary hover:text-brand-accent hover:underline truncate transition-colors font-medium">
                    {data.customer.email}
                  </a>
                </div>
              )}
              {data.customer.phone && (
                <div className="flex items-center gap-2.5 text-[12px]">
                  <div className="w-6 h-6 rounded-md bg-brand-surface-hover border border-brand-border/50 flex items-center justify-center flex-shrink-0">
                    <PhoneFlag phone={data.customer.phone} size="sm" showNumber={false} />
                  </div>
                  <span className="text-brand-primary font-medium">{data.customer.phone}</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle mb-2">Linked Deal</p>
              {data.deal ? (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-medium text-brand-primary truncate">{data.deal.title}</p>
                  <button
                    type="button"
                    onClick={() => quickUpdate.mutate({ deal_id: null })}
                    className="text-brand-subtle hover:text-brand-danger flex-shrink-0"
                    title="Unlink deal"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : dealOptions?.data?.length ? (
                <select
                  defaultValue=""
                  onChange={(e) => e.target.value && quickUpdate.mutate({ deal_id: Number(e.target.value) })}
                  className="w-full h-8 rounded-lg border border-brand-border bg-brand-white px-2 text-[12px] text-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-border"
                >
                  <option value="" disabled>Link a deal…</option>
                  {dealOptions.data.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>
              ) : (
                <p className="text-[12px] text-brand-subtle">—</p>
              )}
            </div>
          </div>
        )}

        {/* Status, Owner, Tags & Properties */}
        <div className="p-4 md:p-5 border-b border-brand-border space-y-4">
          <p className="text-[14px] font-semibold text-brand-primary">Status & Workflow</p>
          <SharedStatusSelect 
            value={data.status} 
            onChange={(value) => quickUpdate.mutate({ status: value as Quote['status'] })}
            options={config.statusOptions}
          />

          {data.status === 'draft' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => quickUpdate.mutate({ status: 'sent' })}
              className="w-full rounded-lg h-8 text-[12px] border-brand-border"
            >
              Mark as Sent
            </Button>
          )}

          <div className="pt-3 space-y-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle mb-2.5">Tags</p>
              <TagsManager
                selectedTags={tags}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
              />
            </div>
            {/* Properties */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle mb-1">Payment Terms</p>
              <p className="text-[13px] font-medium text-brand-primary leading-relaxed">{data.payment_terms || '—'}</p>
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
    </div>
  );
};
