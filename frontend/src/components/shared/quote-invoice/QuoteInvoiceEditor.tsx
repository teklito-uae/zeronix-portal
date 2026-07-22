import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { getBasePath } from '@/hooks/useBasePath';
import { useBreadcrumb } from '@/hooks/useBreadcrumb';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DownloadButton } from '@/components/shared/DownloadButton';
import { CustomerPanel } from './CustomerPanel';
import { ItemsTable } from './ItemsTable';
import { AddFromLibraryDialog } from './AddFromLibraryDialog';
import { NotesEditor } from './NotesEditor';
import { SummaryPanel } from './SummaryPanel';
import { ActivityTimeline } from './ActivityTimeline';
import { AttachmentsPanel } from './AttachmentsPanel';
import { normalizeQIAItems, type QIALineItem } from './types';
import api from '@/lib/axios';
import { TRANSACTION_CONFIGS, type TransactionType, type TransactionConversionConfig } from '@/lib/transactionTypes';
import { computeDocTotals } from '@/lib/lineItemMath';
import type { Product } from '@/types';
import {
  ArrowLeft,
  Loader2,
  Lock,
  Calendar,
  CheckCircle2,
  Eye,
  Send,
  MoreHorizontal,
  Copy,
  Trash2,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

interface QuoteInvoiceEditorProps {
  type: TransactionType;
  id?: string;
  isNew: boolean;
}

const PAYMENT_TERMS_OPTIONS = [
  'Due on Receipt',
  'Net 7',
  'Net 15',
  'Net 30',
  'Net 45',
  'Net 60',
  '50% Advance, 50% on Delivery',
];

/**
 * Modern create/edit shell for Quotes and Invoices — a redesigned sibling of
 * TransactionEditor.tsx (which stays as-is for Sales Orders/Purchase Bills).
 * Mirrors TransactionEditor's data-fetching, save-mutation, and party/contact
 * logic, but on the newer `brand-*` visual language with a richer 3-column
 * layout (customer/details, items, summary/status/activity).
 */
export const QuoteInvoiceEditor = ({ type, id, isNew }: QuoteInvoiceEditorProps) => {
  const config = TRANSACTION_CONFIGS[type];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const admin = useAuthStore((s) => s.admin);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);

  const buildDefaultDoc = () => {
    const base: any = {
      status: config.defaultStatus,
      [config.party.idField]: undefined,
      date: new Date().toISOString().split('T')[0],
      notes: '',
      terms: '',
      discount_percent: 0,
      shipping_amount: 0,
      reference_id: '',
      tags: [],
      attachments: [],
    };
    if (config.party.contactIdField) base[config.party.contactIdField] = undefined;
    config.dateFields.forEach((f) => { base[f.key] = ''; });
    return base;
  };

  const [docData, setDocData] = useState<any>(buildDefaultDoc);
  const [items, setItems] = useState<QIALineItem[]>([]);

  const docLabel = isNew ? config.newTitle : (docData[config.numberField] || `#${id}`);
  const headerTitle = isNew ? `Create ${config.label}` : (docData[config.numberField] || `#${id}`);

  useBreadcrumb([
    { label: config.pluralLabel, href: `${getBasePath()}/${config.listRoute}` },
    { label: docLabel },
  ]);

  const { data: productsList = [] } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => (await api.get('/admin/products?per_page=100')).data.data as Product[],
  });

  // Preview of the number this doc will be assigned on save — only relevant
  // while creating; once saved, docData[config.numberField] is the real one.
  const { data: nextNumberPreview } = useQuery({
    queryKey: [config.apiBase, 'next-number'],
    queryFn: async () => (await api.get(`/admin/${config.apiBase}/next-number`)).data.number as string,
    enabled: isNew,
    staleTime: 30_000,
  });

  const updateDoc = (patch: any) => {
    setDocData((prev: any) => ({ ...prev, ...patch }));
    setIsDirty(true);
  };

  const updateItems = (newItems: QIALineItem[]) => {
    setItems(newItems);
    setIsDirty(true);
  };

  const fetchDocument = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/${config.apiBase}/${id}`);
      const data = response.data;
      setDocData(data);
      setItems(normalizeQIAItems(data.items || []));
      setIsDirty(false);
      setSavedAt(data.updated_at ? new Date(data.updated_at) : (data.created_at ? new Date(data.created_at) : null));
    } catch {
      toast.error(`Failed to load ${config.label.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isNew && id) fetchDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNew]);

  const totals = useMemo(() => computeDocTotals(items, {
    discountPercent: Number(docData.discount_percent) || 0,
    shippingAmount: Number(docData.shipping_amount) || 0,
  }), [items, docData.discount_percent, docData.shipping_amount]);

  const isLocked = config.isLocked ? config.isLocked(docData, admin?.role) : false;

  const persist = async (overrides: any = {}): Promise<any | null> => {
    if (!docData[config.party.idField]) {
      toast.error(`Please select a ${config.party.label.toLowerCase()} first.`);
      return null;
    }
    if (items.length === 0) {
      toast.error('Add at least one line item.');
      return null;
    }
    setSaving(true);
    try {
      const payload = { ...docData, ...overrides, items };
      const response = isNew
        ? await api.post(`/admin/${config.apiBase}`, payload)
        : await api.put(`/admin/${config.apiBase}/${id}`, payload);
      const saved = response.data;
      toast.success(isNew ? `${config.label} created successfully.` : `${docLabel} updated.`);
      setDocData(saved);
      setItems(normalizeQIAItems(saved.items || items));
      setIsDirty(false);
      setSavedAt(new Date());
      config.invalidateQueries.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      if (isNew && saved?.id) {
        navigate(`${getBasePath()}/${config.listRoute}/${saved.id}`, { replace: true });
      }
      return saved;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed. Please check the form.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    let doc = docData;
    if (isNew || isDirty || !docData.id) {
      const saved = await persist();
      if (!saved) return;
      doc = saved;
    }
    setSending(true);
    try {
      await api.post(`/admin/${config.apiBase}/${doc.id}/send-email`);
      toast.success(`${config.label} sent.`);
      config.invalidateQueries.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send email.');
    } finally {
      setSending(false);
    }
  };

  const handleDuplicate = async () => {
    if (!docData.id) return;
    setDuplicating(true);
    try {
      const res = await api.post(`/admin/${config.apiBase}/${docData.id}/duplicate`);
      toast.success(`${config.label} duplicated.`);
      config.invalidateQueries.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      navigate(`${getBasePath()}/${config.listRoute}/${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Duplicate failed.');
    } finally {
      setDuplicating(false);
    }
  };

  const handleDelete = async () => {
    if (!docData.id) return;
    if (!window.confirm(`Delete this ${config.label.toLowerCase()}?`)) return;
    try {
      await api.delete(`/admin/${config.apiBase}/${docData.id}`);
      toast.success(`${config.label} deleted.`);
      config.invalidateQueries.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      navigate(`${getBasePath()}/${config.listRoute}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    }
  };

  const handlePreviewPdf = async () => {
    if (!docData.id) return;
    // Mirrors DownloadButton's mode="view" logic (authenticated blob fetch)
    // rather than a raw window.open, since the /view endpoint requires the
    // bearer token that only the `api` axios instance attaches.
    const newWindow = window.open('', '_blank');
    try {
      const response = await api.get(`/admin/${config.apiBase}/${docData.id}/view`, {
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

  const handleConvert = async (conversion: TransactionConversionConfig) => {
    if (!docData.id) return;
    try {
      const payload = conversion.buildPayload ? conversion.buildPayload(docData, items) : undefined;
      const res = await api.post(conversion.endpoint(docData.id), payload);
      toast.success(`${conversion.label} succeeded.`);
      config.invalidateQueries.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      navigate(`${getBasePath()}${conversion.resultRoute(res.data)}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Conversion failed.');
    }
  };

  const handleQuickStatus = (status: string) => {
    persist({ status });
  };

  const goToList = () => navigate(`${getBasePath()}/${config.listRoute}`);

  const handleBackClick = () => {
    if (isDirty) setLeaveConfirmOpen(true);
    else goToList();
  };

  const handleDiscardAndLeave = () => {
    setLeaveConfirmOpen(false);
    goToList();
  };

  const handleSaveDraftAndLeave = async () => {
    const saved = await persist({ status: config.statusOptions.includes('draft') ? 'draft' : config.defaultStatus });
    setLeaveConfirmOpen(false);
    if (saved) goToList();
  };

  if (loading && !isNew && !docData.id) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-brand-accent" size={32} />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle">Loading…</p>
      </div>
    );
  }

  const eligibleConversions = (config.conversions || []).filter((c) => !isNew && !!docData.id && c.isEligible(docData));
  const canPreview = !!docData.id;
  const quickStatusLabel = type === 'quote' ? 'Mark as Sent' : 'Mark as Posted';
  const quickStatusValue = type === 'quote' ? 'sent' : 'posted';
  const sendLabel = type === 'quote' ? 'Send Quote' : 'Send Invoice';
  const attachments = docData.attachments || [];

  const ActionRow = ({ icon: Icon, label, onClick, disabled }: { icon: any; label: string; onClick: () => void; disabled?: boolean }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12px] font-medium text-brand-primary hover:bg-brand-bg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Icon size={15} className="text-brand-subtle flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      <ChevronRight size={13} className="text-brand-subtle flex-shrink-0" />
    </button>
  );

  return (
    <div className="flex flex-col h-full min-h-0 bg-brand-bg animate-in fade-in duration-200 pb-24 xl:pb-0">
      {/* Sticky local page header */}
      <div className="sticky top-0 z-10 bg-brand-white/95 backdrop-blur border-b border-brand-border px-4 md:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="outline"
            size="icon"
            onClick={handleBackClick}
            className="rounded-full border-brand-border h-9 w-9 flex-shrink-0"
          >
            <ArrowLeft size={16} />
          </Button>
          <div className="min-w-0">
            <p className="text-[11px] text-brand-subtle leading-none">{config.pluralLabel} /</p>
            <p className="text-[15px] font-bold text-brand-primary truncate leading-tight mt-0.5">{headerTitle}</p>
          </div>
          <div className="ml-2 hidden sm:block">
            {isDirty ? (
              <span className="text-[11px] text-brand-subtle">Unsaved changes</span>
            ) : savedAt ? (
              <span className="flex items-center gap-1 text-[11px] text-brand-success font-medium">
                <CheckCircle2 size={12} /> Saved {formatDistanceToNow(savedAt, { addSuffix: true })}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canPreview ? (
            <DownloadButton id={docData.id} type={type as 'quote' | 'invoice'} mode="view" variant="outline" label="Preview" />
          ) : (
            <Button variant="outline" size="sm" disabled className="h-8 px-3 rounded-lg text-[12px] font-medium border-brand-border">
              <Eye size={13} className="mr-1.5" /> Preview
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={saving || isLocked}
            onClick={() => persist({ status: config.statusOptions.includes('draft') ? 'draft' : config.defaultStatus })}
            className="h-8 px-3 rounded-lg text-[12px] font-medium border-brand-border"
          >
            {saving ? <Loader2 size={13} className="animate-spin mr-1.5" /> : null} Save Draft
          </Button>
          <Button
            size="sm"
            disabled={sending || isLocked}
            onClick={handleSend}
            className="h-8 px-3.5 rounded-lg text-[12px] font-semibold bg-brand-accent hover:bg-brand-accent-hover text-white"
          >
            {sending ? <Loader2 size={13} className="animate-spin mr-1.5" /> : <Send size={13} className="mr-1.5" />}
            {sendLabel}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-brand-muted hover:text-brand-primary">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-brand-white border-brand-border rounded-lg w-48">
              <DropdownMenuItem
                onClick={handleDuplicate}
                disabled={!docData.id || duplicating}
                className="cursor-pointer text-[12px]"
              >
                <Copy size={13} className="mr-2" /> Duplicate
              </DropdownMenuItem>
              {eligibleConversions.map((conversion) => (
                <DropdownMenuItem
                  key={conversion.label}
                  onClick={() => handleConvert(conversion)}
                  className="cursor-pointer text-[12px]"
                >
                  <conversion.icon size={13} className="mr-2" /> {conversion.label}
                </DropdownMenuItem>
              ))}
              {!isNew && (
                <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-[12px] text-brand-danger focus:text-brand-danger">
                  <Trash2 size={13} className="mr-2" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 3-column body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] xl:grid-cols-[320px_1fr_320px] gap-5 max-w-[1400px] mx-auto">
          {/* Left column */}
          <div className="space-y-5">
            <CustomerPanel type={type} docData={docData} onUpdate={updateDoc} disabled={isLocked} />

            <div className="bg-brand-white border border-brand-border rounded-lg p-4 space-y-4">
              <p className="text-[13px] font-semibold text-brand-primary">{config.label} Information</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle">Number</label>
                  <div className="relative">
                    <Input
                      readOnly
                      value={!isNew ? (docData[config.numberField] || '') : (nextNumberPreview || '')}
                      placeholder="Auto-generated on save"
                      className="h-9 bg-brand-bg border-brand-border rounded-lg text-[13px] pr-8 text-brand-muted"
                    />
                    <Lock size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-subtle" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle flex items-center gap-1.5">
                    <Calendar size={11} /> Issue Date
                  </label>
                  <Input
                    type="date"
                    value={docData.date ? docData.date.split('T')[0] : ''}
                    onChange={(e) => updateDoc({ date: e.target.value })}
                    disabled={isLocked}
                    className="h-9 bg-brand-bg border-brand-border rounded-lg text-[13px]"
                  />
                </div>
                {config.dateFields[0] && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle flex items-center gap-1.5">
                      <Calendar size={11} /> {config.dateFields[0].label}
                    </label>
                    <Input
                      type="date"
                      value={docData[config.dateFields[0].key] ? docData[config.dateFields[0].key].split('T')[0] : ''}
                      onChange={(e) => updateDoc({ [config.dateFields[0].key]: e.target.value })}
                      disabled={isLocked}
                      className="h-9 bg-brand-bg border-brand-border rounded-lg text-[13px]"
                    />
                  </div>
                )}
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle">Reference / Subject</label>
                  <Input
                    value={docData.reference_id || ''}
                    onChange={(e) => updateDoc({ reference_id: e.target.value })}
                    disabled={isLocked}
                    placeholder="e.g. Project name, PO number…"
                    className="h-9 bg-brand-bg border-brand-border rounded-lg text-[13px]"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle">Payment Terms</label>
                  <Select
                    value={docData.payment_terms || ''}
                    onValueChange={(v) => updateDoc({ payment_terms: v })}
                    disabled={isLocked}
                  >
                    <SelectTrigger className="h-9 bg-brand-bg border-brand-border rounded-lg text-[13px]">
                      <SelectValue placeholder="Select payment terms…" />
                    </SelectTrigger>
                    <SelectContent className="bg-brand-white border-brand-border rounded-lg">
                      {PAYMENT_TERMS_OPTIONS.map((term) => (
                        <SelectItem key={term} value={term} className="text-[12px]">{term}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {type === 'quote' && (
                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle flex items-center gap-1.5">
                      <Calendar size={11} /> Delivery Date
                    </label>
                    <Input
                      type="date"
                      value={docData.delivery_date ? docData.delivery_date.split('T')[0] : ''}
                      onChange={(e) => updateDoc({ delivery_date: e.target.value })}
                      disabled={isLocked}
                      className="h-9 bg-brand-bg border-brand-border rounded-lg text-[13px]"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Middle column */}
          <div className="space-y-5 min-w-0">
            <ItemsTable
              items={items}
              onChange={updateItems}
              products={productsList}
              disabled={isLocked}
              onOpenLibrary={() => setLibraryOpen(true)}
            />
            <AddFromLibraryDialog
              open={libraryOpen}
              onOpenChange={setLibraryOpen}
              products={productsList}
              onAdd={(rows) => updateItems([...items, ...rows])}
            />

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle ml-1">Notes to Customer</label>
              <NotesEditor value={docData.notes || ''} onChange={(html) => updateDoc({ notes: html })} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle ml-1">Terms & Conditions</label>
              <Textarea
                value={docData.terms || ''}
                onChange={(e) => updateDoc({ terms: e.target.value })}
                disabled={isLocked}
                className="bg-brand-white border-brand-border text-[13px] rounded-lg resize-none min-h-[110px] p-3"
                placeholder={'1. This quote is valid until the expiry date.\n2. 30% advance payment required.\n3. Prices are subject to change without notice.'}
              />
            </div>

            <AttachmentsPanel type={type} docId={docData.id} isNew={isNew} attachments={attachments} apiBase={config.apiBase} />
          </div>

          {/* Right column — xl and up only */}
          <div className="hidden xl:block space-y-5">
            <SummaryPanel
              type={type}
              totals={totals}
              discountPercent={Number(docData.discount_percent) || 0}
              shippingAmount={Number(docData.shipping_amount) || 0}
              onDiscountPercentChange={(v) => updateDoc({ discount_percent: v })}
              onShippingAmountChange={(v) => updateDoc({ shipping_amount: v })}
              disabled={isLocked}
            />

            <div className="bg-brand-white border border-brand-border rounded-lg p-4 space-y-3">
              <p className="text-[13px] font-semibold text-brand-primary">{config.label} Status</p>
              <Select value={String(docData.status || '')} onValueChange={(v) => updateDoc({ status: v })} disabled={isLocked}>
                <SelectTrigger className="h-9 bg-brand-bg border-brand-border rounded-lg text-[12px]">
                  <SelectValue placeholder="Select status…" />
                </SelectTrigger>
                <SelectContent className="bg-brand-white border-brand-border rounded-lg">
                  {config.statusOptions.map((s) => (
                    <SelectItem key={s} value={s} className="text-[12px]">{s.replace(/_/g, ' ').toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {docData.status === 'draft' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickStatus(quickStatusValue)}
                  disabled={saving}
                  className="w-full rounded-lg h-8 text-[12px] border-brand-border"
                >
                  {quickStatusLabel}
                </Button>
              )}
            </div>

            <div className="bg-brand-white border border-brand-border rounded-lg p-2 space-y-0.5">
              <p className="text-[13px] font-semibold text-brand-primary px-3 pt-2 pb-1">Actions</p>
              <ActionRow icon={Eye} label="Preview PDF" disabled={!canPreview} onClick={handlePreviewPdf} />
              <ActionRow icon={Send} label={sendLabel} onClick={handleSend} disabled={sending || isLocked} />
              <ActionRow icon={Copy} label="Duplicate" onClick={handleDuplicate} disabled={!docData.id || duplicating} />
              {eligibleConversions[0] && (
                <ActionRow
                  icon={eligibleConversions[0].icon}
                  label={eligibleConversions[0].label}
                  onClick={() => handleConvert(eligibleConversions[0])}
                />
              )}
            </div>

            {!isNew && <ActivityTimeline activities={docData.activities} />}
          </div>
        </div>
      </div>

      {/* Mobile/tablet fallback summary bar — shown whenever the right column (xl:) is hidden */}
      <div className="xl:hidden fixed bottom-0 inset-x-0 z-20 bg-brand-white border-t border-brand-border shadow-[0_-2px_8px_rgba(0,0,0,0.06)] px-4 py-2.5">
        <div className="flex items-center gap-4 overflow-x-auto text-[11px] text-brand-muted no-scrollbar">
          <span className="flex-shrink-0"><FileText size={12} className="inline mr-1" />Sub: <span className="font-mono text-brand-primary">{totals.subtotal.toFixed(2)}</span></span>
          <span className="flex-shrink-0">Disc: <span className="font-mono text-brand-primary">{totals.discountAmount.toFixed(2)}</span></span>
          <span className="flex-shrink-0">Tax: <span className="font-mono text-brand-primary">{totals.vat.toFixed(2)}</span></span>
          <span className="flex-shrink-0">Ship: <span className="font-mono text-brand-primary">{totals.shippingAmount.toFixed(2)}</span></span>
          <span className="flex-shrink-0 font-semibold text-brand-primary">Total: <span className="font-mono text-brand-accent">{totals.total.toFixed(2)}</span></span>
          <Button
            size="sm"
            disabled={saving || isLocked}
            onClick={() => persist({ status: config.statusOptions.includes('draft') ? 'draft' : config.defaultStatus })}
            className="ml-auto flex-shrink-0 h-8 px-3 rounded-lg text-[12px] font-semibold"
          >
            Save Draft
          </Button>
        </div>
      </div>

      <AlertDialog open={leaveConfirmOpen} onOpenChange={setLeaveConfirmOpen}>
        <AlertDialogContent className="bg-brand-white border-brand-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              This {config.label.toLowerCase()} hasn't been saved yet. Save it as a draft, or discard your changes and go back?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-brand-border">Keep Editing</AlertDialogCancel>
            <Button variant="outline" onClick={handleDiscardAndLeave} className="border-brand-border">
              Discard
            </Button>
            <AlertDialogAction onClick={handleSaveDraftAndLeave} disabled={saving} className="bg-brand-accent hover:bg-brand-accent-hover">
              {saving ? <Loader2 size={13} className="animate-spin mr-1.5" /> : null} Save as Draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
