import { getBasePath } from '@/hooks/useBasePath';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBreadcrumb } from '@/hooks/useBreadcrumb';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
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
import { StatusBadge } from './StatusBadge';
import { DownloadButton } from './DownloadButton';
import { PartySearch } from './PartySearch';
import { LineItemsEditor, type EditableLineItem } from './LineItemsEditor';
import api from '@/lib/axios';
import { TRANSACTION_CONFIGS, type TransactionType, type TransactionConversionConfig } from '@/lib/transactionTypes';
import { computeDocTotals, normalizeLineItems } from '@/lib/lineItemMath';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { CurrencyAmount } from '@/components/shared/CurrencyAmount';
import type { CustomerContact, Product } from '@/types';
import { ArrowLeft, Save, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface TransactionEditorProps {
  type: TransactionType;
  id?: string;
  isNew: boolean;
}

/**
 * Unified create/edit shell for Quotes, Invoices, Sales Orders, and Purchase
 * Bills — driven by TRANSACTION_CONFIGS so the four document types share one
 * modern, inline-editable interface instead of four near-duplicate forms.
 */
export const TransactionEditor = ({ type, id, isNew }: TransactionEditorProps) => {
  const config = TRANSACTION_CONFIGS[type];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const admin = useAuthStore((s) => s.admin);
  const currency = useCurrencyStore((s) => s.currency);
  const [loading, setLoading] = useState(false);

  const buildDefaultDoc = () => {
    const base: any = {
      status: config.defaultStatus,
      [config.party.idField]: undefined,
      date: new Date().toISOString().split('T')[0],
      notes: '',
    };
    if (config.party.contactIdField) base[config.party.contactIdField] = undefined;
    config.dateFields.forEach((f) => { base[f.key] = ''; });
    if (config.hasClosingRatio) base.closing_ratio = '';
    return base;
  };

  const [docData, setDocData] = useState<any>(buildDefaultDoc);
  const [items, setItems] = useState<EditableLineItem[]>([]);

  const docLabel = isNew ? config.newTitle : (docData[config.numberField] || `#${id}`);

  useBreadcrumb([
    { label: config.pluralLabel, href: `${getBasePath()}/${config.listRoute}` },
    { label: docLabel },
  ]);

  const { data: productsList = [] } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => (await api.get('/admin/products?per_page=100')).data.data as Product[],
  });

  const partyId = docData[config.party.idField];

  const { data: contactsList = [] } = useQuery({
    queryKey: ['customers', partyId, 'contacts'],
    queryFn: async () => (await api.get(`/admin/customers/${partyId}/contacts?active=1`)).data as CustomerContact[],
    enabled: config.party.hasContacts && !!partyId,
  });

  useEffect(() => {
    if (!config.party.hasContacts || !config.party.contactIdField) return;
    const contactField = config.party.contactIdField;
    if (!docData[contactField] && contactsList.length > 0) {
      const primary = contactsList.find((c) => c.is_primary) || contactsList[0];
      setDocData((prev: any) => ({ ...prev, [contactField]: primary.id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactsList]);

  useEffect(() => {
    if (!isNew && id) fetchDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNew]);

  const fetchDocument = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/${config.apiBase}/${id}`);
      const data = response.data;
      setDocData(data);
      setItems(normalizeLineItems(data.items || []));
    } catch {
      toast.error(`Failed to load ${config.label.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => computeDocTotals(items), [items]);

  const isLocked = config.isLocked ? config.isLocked(docData, admin?.role) : false;

  const handleSaveDoc = async () => {
    if (!docData[config.party.idField]) return toast.error(`Please select a ${config.party.label.toLowerCase()} first.`);
    if (items.length === 0) return toast.error('Add at least one line item.');
    setLoading(true);
    try {
      const payload = { ...docData, items };
      if (isNew) {
        await api.post(`/admin/${config.apiBase}`, payload);
        toast.success(`${config.label} created successfully.`);
      } else {
        await api.put(`/admin/${config.apiBase}/${id}`, payload);
        toast.success(`${docLabel} updated.`);
      }
      config.invalidateQueries.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      navigate(`${getBasePath()}/${config.listRoute}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed. Please check the form.');
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async (conversion: TransactionConversionConfig) => {
    if (!docData.id) return;
    setLoading(true);
    try {
      const payload = conversion.buildPayload ? conversion.buildPayload(docData, items) : undefined;
      const res = await api.post(conversion.endpoint(docData.id), payload);
      toast.success(`${conversion.label} succeeded.`);
      config.invalidateQueries.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      navigate(`${getBasePath()}${conversion.resultRoute(res.data)}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Conversion failed.');
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

  const eligibleConversions = (config.conversions || []).filter((c) => !isNew && c.isEligible(docData));
  const partyRelation = docData[config.party.kind];

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`${getBasePath()}/${config.listRoute}`)}
            className="rounded-xl border-brand-border h-10 w-10 hover:bg-brand-white-hover shadow-sm transition-all active:scale-95"
          >
            <ArrowLeft size={18} />
          </Button>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-brand-primary tracking-tight">
              {isNew ? config.newTitle : `${config.label.toUpperCase()} ${docData[config.numberField] || '#' + id}`}
            </h1>
            {!isNew && <StatusBadge status={docData.status} />}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {!isNew && config.pdf && (
            <DownloadButton id={id!} type={type as 'quote' | 'invoice'} mode="view" variant="outline" label="View PDF" />
          )}
          {eligibleConversions.map((conversion) => (
            <Button
              key={conversion.label}
              onClick={() => handleConvert(conversion)}
              disabled={loading}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 px-4 font-bold text-[11px] uppercase tracking-wider shadow-lg shadow-emerald-600/10"
            >
              <conversion.icon size={15} className="mr-2" /> {conversion.label}
            </Button>
          ))}
          <Button
            onClick={handleSaveDoc}
            disabled={loading || isLocked}
            size="sm"
            className="bg-brand-accent hover:bg-brand-accent-hover text-white rounded-md h-9 px-4 font-medium text-sm transition-all active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
            Save {config.label}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Main canvas */}
        <div className="xl:col-span-8 space-y-4">
          <div className={`grid grid-cols-1 ${config.party.hasContacts ? 'md:grid-cols-2' : ''} gap-4`}>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle ml-1">
                {config.party.label} *
              </Label>
              <PartySearch
                kind={config.party.kind}
                endpoint={config.party.endpoint}
                searchMode={config.party.searchMode}
                value={partyId}
                selected={partyRelation ? {
                  id: partyRelation.id,
                  name: partyRelation.name,
                  company: partyRelation.company,
                  contact_person: partyRelation.contact_person,
                } : undefined}
                placeholder={`Select ${config.party.label.toLowerCase()}…`}
                onSelect={(party) => setDocData((prev: any) => ({
                  ...prev,
                  [config.party.idField]: party.id,
                  ...(config.party.contactIdField ? { [config.party.contactIdField]: undefined } : {}),
                }))}
              />
            </div>

            {config.party.hasContacts && config.party.contactIdField && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle ml-1">
                  Attention (Contact)
                </Label>
                <Select
                  value={String(docData[config.party.contactIdField] || '')}
                  onValueChange={(v) => setDocData({ ...docData, [config.party.contactIdField!]: Number(v) })}
                  disabled={!partyId || contactsList.length === 0}
                >
                  <SelectTrigger className="h-11 bg-brand-bg border-brand-border rounded-xl text-sm shadow-sm">
                    <SelectValue placeholder="Select contact…" />
                  </SelectTrigger>
                  <SelectContent className="bg-brand-white border-brand-border rounded-xl shadow-2xl">
                    {contactsList.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)} className="rounded-lg m-1">
                        <span className="font-medium text-brand-primary">{c.full_name}</span>
                        {c.designation && <span className="text-[10px] text-brand-subtle ml-2 opacity-60">[{c.designation}]</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <LineItemsEditor
            items={items}
            onChange={setItems}
            products={productsList}
            disabled={isLocked}
          />

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle ml-1">Notes & Terms</Label>
            <Textarea
              value={docData.notes || ''}
              onChange={(e) => setDocData({ ...docData, notes: e.target.value })}
              className="bg-brand-white border-brand-border text-sm rounded-lg resize-none min-h-[100px] p-4"
              placeholder="Payment terms, delivery timelines, internal notes…"
            />
          </div>
        </div>

        {/* Right rail */}
        <div className="xl:col-span-4">
          <div className="bg-brand-bg border border-brand-border rounded-lg p-5 sticky top-24 space-y-5">
            <div>
              <p className="text-[10px] font-semibold text-brand-subtle uppercase tracking-wider mb-1">Total</p>
              <p className="text-2xl font-bold text-brand-accent font-mono">
                <CurrencyAmount amount={totals.total} currency={currency} />
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle ml-1">Status</Label>
              <Select value={String(docData.status || '')} onValueChange={(v) => setDocData({ ...docData, status: v })}>
                <SelectTrigger className="h-10 bg-brand-white border-brand-border rounded-xl text-sm shadow-sm">
                  <SelectValue placeholder="Select status…" />
                </SelectTrigger>
                <SelectContent className="bg-brand-white border-brand-border rounded-xl shadow-2xl">
                  {config.statusOptions.map((s) => (
                    <SelectItem key={s} value={s} className="rounded-lg m-1">{s.replace('_', ' ').toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle ml-1 flex items-center gap-1.5">
                <Calendar size={12} /> Date
              </Label>
              <Input
                type="date"
                value={docData.date ? docData.date.split('T')[0] : ''}
                onChange={(e) => setDocData({ ...docData, date: e.target.value })}
                className="h-10 bg-brand-white border-brand-border rounded-xl text-sm shadow-sm"
              />
            </div>

            {config.dateFields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle ml-1 flex items-center gap-1.5">
                  <Calendar size={12} /> {f.label}
                </Label>
                <Input
                  type="date"
                  value={docData[f.key] ? docData[f.key].split('T')[0] : ''}
                  onChange={(e) => setDocData({ ...docData, [f.key]: e.target.value })}
                  className="h-10 bg-brand-white border-brand-border rounded-xl text-sm shadow-sm"
                />
              </div>
            ))}

            {config.hasClosingRatio && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle ml-1">Closing Ratio (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={docData.closing_ratio !== undefined ? docData.closing_ratio : ''}
                  onChange={(e) => setDocData({ ...docData, closing_ratio: e.target.value ? Number(e.target.value) : '' })}
                  className="h-10 bg-brand-white border-brand-border rounded-xl text-sm shadow-sm"
                  placeholder="e.g. 80"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
