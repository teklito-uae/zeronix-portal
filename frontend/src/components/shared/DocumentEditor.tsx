import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBreadcrumb } from '@/hooks/useBreadcrumb';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from './StatusBadge';
import { DownloadButton } from './DownloadButton';
import { ItemModal } from './ItemModal';
import api from '@/lib/axios';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import type { Customer, Product } from '@/types';
import { ArrowLeft, Save, Plus, Trash2, Receipt, Loader2, Calendar, User, Settings2, Edit3, Pencil, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentEditorProps {
  type: 'quote' | 'invoice';
  id?: string;
  isNew: boolean;
}

/**
 * High-Fidelity Document Editor
 * Handles both Quotations and Invoices with a unified, premium interface.
 */
export const DocumentEditor = ({ type, id, isNew }: DocumentEditorProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const admin = useAuthStore(s => s.admin);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [docData, setDocData] = useState<any>({
    status: type === 'quote' ? 'draft' : 'unpaid',
    customer_id: undefined,
    date: new Date().toISOString().split('T')[0],
    valid_until: '',
    due_date: '',
    notes: '',
    reference_id: '',
  });

  const listLabel = type === 'quote' ? 'Quotes' : 'Invoices';
  const listHref = `/admin/${type}s`;
  const docLabel = isNew
    ? `New ${listLabel.slice(0, -1)}`
    : (docData[`${type}_number`] || `#${id}`);

  useBreadcrumb([
    { label: listLabel, href: listHref },
    { label: docLabel },
  ]);

  const [items, setItems] = useState<any[]>([]);

  const { data: customersList = [] } = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: async () => (await api.get('/admin/customers?per_page=100')).data.data as Customer[]
  });

  const { data: productsList = [] } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => (await api.get('/admin/products?per_page=100')).data.data as Product[]
  });

  useEffect(() => {
    if (!isNew && id) fetchDocument();
  }, [id, isNew]);

  const fetchDocument = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/${type}s/${id}`);
      const data = response.data;
      setDocData(data);
      setItems((data.items || []).map((item: any) => ({
        ...item,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        total: Number(item.total),
        tax_percent: Number(item.tax_percent || 5)
      })));
    } catch {
      toast.error(`Failed to load ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    const totalVat = items.reduce((sum, item) => {
      const sub = (item.quantity || 0) * (item.unit_price || 0);
      return sum + (sub * (Number(item.tax_percent || 0) / 100));
    }, 0);
    const subtotal = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0);
    return { subtotal, vat: totalVat, total: subtotal + totalVat };
  }, [items]);

  const handleSaveItem = (item: any) => {
    if (editingIndex !== null) {
      const next = [...items];
      next[editingIndex] = item;
      setItems(next);
      setEditingIndex(null);
    } else {
      setItems([...items, item]);
    }
  };

  const handleSaveDoc = async () => {
    if (!docData.customer_id) return toast.error('Please select a customer first.');
    if (items.length === 0) return toast.error('Document must contain at least one line item.');
    setLoading(true);
    try {
      const payload = { ...docData, items };
      if (isNew) {
        await api.post(`/admin/${type}s`, payload);
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} issued successfully.`);
      } else {
        await api.put(`/admin/${type}s/${id}`, payload);
        toast.success(`Records updated for ${docLabel}.`);
      }
      queryClient.invalidateQueries({ queryKey: [type === 'quote' ? 'quotes' : 'invoices'] });
      navigate(`/admin/${type}s`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Transaction failed. Please verify all fields.');
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    setLoading(true);
    try {
      const payload = { customer_id: docData.customer_id, quote_id: docData.id, date: new Date().toISOString().split('T')[0], items: items.map(i => ({ ...i })) };
      const res = await api.post('/admin/invoices', payload);
      toast.success('Successfully converted to commercial invoice.');
      navigate(`/admin/invoices/${res.data.id}`);
    } catch {
      toast.error('Conversion process interrupted.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isNew) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-zeronix-blue" size={32} />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-admin-text-muted">Loading Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate(`/admin/${type}s`)} 
            className="rounded-2xl border-admin-border h-11 w-11 hover:bg-admin-surface-hover shadow-sm transition-all active:scale-95"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-admin-text-primary tracking-tight">
                {isNew ? `Issue ${type.charAt(0).toUpperCase() + type.slice(1)}` : `${type.toUpperCase()} ${docData[`${type}_number`] || '#' + id}`}
              </h1>
              {!isNew && <StatusBadge status={docData.status} />}
            </div>
            <p className="text-xs font-medium text-admin-text-muted mt-0.5 uppercase tracking-wide opacity-70">
              {isNew ? 'Financial Instrument Creation' : `Managing ${type} Ledger Records`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!isNew && (
            <>
              <DownloadButton id={id!} type={type} mode="view" variant="outline" label="View PDF" />
              {type === 'quote' && docData.status !== 'invoiced' && (
                <Button 
                  onClick={handleConvert} 
                  size="sm" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-5 font-bold text-[11px] uppercase tracking-wider shadow-lg shadow-emerald-600/10"
                >
                  <Receipt size={16} className="mr-2" /> Convert to Invoice
                </Button>
              )}
            </>
          )}
          <Button 
            onClick={handleSaveDoc} 
            disabled={loading || (type === 'invoice' && docData.delivery_status === 'delivered' && admin?.role !== 'admin')} 
            size="sm" 
            className="bg-zeronix-blue hover:bg-zeronix-blue-hover text-white rounded-md h-9 px-4 font-medium text-sm transition-all active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
            Save {type.charAt(0).toUpperCase() + type.slice(1)}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Primary Configuration */}
        <div className="xl:col-span-8 space-y-6">
          <div className="bg-admin-surface border border-admin-border rounded-lg p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-admin-border pb-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-admin-text-primary uppercase tracking-wider">
                <Settings2 size={16} className="text-zeronix-blue" /> Details
              </div>
              <ShieldCheck size={16} className="text-emerald-500 opacity-50" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-admin-text-muted ml-1 flex items-center gap-1.5">
                  <User size={12} className="text-zeronix-blue" /> Registered Client *
                </Label>
                <Select value={String(docData.customer_id || '')} onValueChange={(v) => setDocData({ ...docData, customer_id: Number(v) })}>
                  <SelectTrigger className="h-11 bg-admin-bg border-admin-border rounded-xl text-sm focus:ring-zeronix-blue/10 transition-all shadow-sm">
                    <SelectValue placeholder="Select client profile..." />
                  </SelectTrigger>
                  <SelectContent className="bg-admin-surface border-admin-border rounded-2xl shadow-2xl">
                    {customersList.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)} className="hover:bg-admin-surface-hover rounded-lg m-1">
                        <span className="font-bold text-admin-text-primary">{c.name}</span>
                        {c.company && <span className="text-[10px] text-admin-text-muted ml-2 opacity-60">[{c.company}]</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-admin-text-muted ml-1 flex items-center gap-1.5">
                  <Edit3 size={12} className="text-zeronix-blue" /> Lifecycle Status
                </Label>
                <Select value={String(docData.status || '')} onValueChange={(v) => setDocData({ ...docData, status: v })}>
                  <SelectTrigger className="h-11 bg-admin-bg border-admin-border rounded-xl text-sm focus:ring-zeronix-blue/10 transition-all shadow-sm">
                    <SelectValue placeholder="Select status..." />
                  </SelectTrigger>
                  <SelectContent className="bg-admin-surface border-admin-border rounded-2xl shadow-2xl">
                    {type === 'quote' ? (
                      <>{['draft','sent','accepted','rejected','invoiced'].map(s => <SelectItem key={s} value={s} className="rounded-lg m-1">{s.toUpperCase()}</SelectItem>)}</>
                    ) : (
                      <>{['draft','sent','unpaid','paid','partial','overdue','cancelled'].map(s => <SelectItem key={s} value={s} className="rounded-lg m-1">{s.toUpperCase()}</SelectItem>)}</>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-admin-text-muted ml-1 flex items-center gap-1.5">
                  <Calendar size={12} className="text-zeronix-blue" /> Issue Date
                </Label>
                <Input 
                  type="date" 
                  value={docData.date ? docData.date.split('T')[0] : ''} 
                  onChange={(e) => setDocData({ ...docData, date: e.target.value })} 
                  className="h-11 bg-admin-bg border-admin-border rounded-xl text-sm focus:ring-zeronix-blue/10 shadow-sm" 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-admin-text-muted ml-1 flex items-center gap-1.5">
                  <Calendar size={12} className="text-zeronix-blue" /> {type === 'quote' ? 'Validity Period' : 'Settlement Due'}
                </Label>
                <Input
                  type="date"
                  value={type === 'quote' ? (docData.valid_until ? docData.valid_until.split('T')[0] : '') : (docData.due_date ? docData.due_date.split('T')[0] : '')}
                  onChange={(e) => setDocData({ ...docData, [type === 'quote' ? 'valid_until' : 'due_date']: e.target.value })}
                  className="h-11 bg-admin-bg border-admin-border rounded-xl text-sm focus:ring-zeronix-blue/10 shadow-sm"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-admin-text-muted mb-1.5 block">
                  Commercial Reference (LPO / SO)
                </Label>
                <Input 
                  value={docData.reference_id || ''} 
                  onChange={(e) => setDocData({ ...docData, reference_id: e.target.value })} 
                  placeholder="Reference #" 
                  className="h-10 bg-admin-bg border-admin-border rounded-md text-sm shadow-sm" 
                />
              </div>
            </div>
          </div>

          {/* Line Items Inventory */}
          <div className="bg-admin-surface border border-admin-border rounded-lg overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-admin-border flex items-center justify-between bg-admin-bg/10">
              <span className="text-xs font-semibold text-admin-text-primary uppercase tracking-wider flex items-center gap-2">
                Line Items
              </span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => { setEditingIndex(null); setIsModalOpen(true); }} 
                className="h-8 rounded-md text-xs border-admin-border bg-admin-surface hover:bg-admin-bg px-3"
                disabled={type === 'invoice' && docData.delivery_status === 'delivered' && admin?.role !== 'admin'}
              >
                <Plus size={14} className="mr-1" /> Add Item
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-admin-bg/30">
                  <TableRow className="border-admin-border hover:bg-transparent">
                    <TableHead className="w-12 text-center text-[11px] font-semibold uppercase tracking-wider text-admin-text-muted">#</TableHead>
                    <TableHead className="min-w-[300px] text-[11px] font-semibold uppercase tracking-wider text-admin-text-muted">Description</TableHead>
                    <TableHead className="text-center text-[11px] font-semibold uppercase tracking-wider text-admin-text-muted w-20">Qty</TableHead>
                    <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-admin-text-muted w-32">Unit Price</TableHead>
                    <TableHead className="text-center text-[11px] font-semibold uppercase tracking-wider text-admin-text-muted w-20">VAT</TableHead>
                    <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-admin-text-muted w-36">Subtotal</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-40 text-center">
                        <div className="flex flex-col items-center gap-2 text-admin-text-muted opacity-40">
                          <Plus size={32} />
                          <p className="text-[10px] font-bold uppercase tracking-wider">Awaiting Line Item Initialization</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : items.map((item, i) => (
                    <TableRow key={i} className="border-admin-border group hover:bg-admin-surface-hover/50 transition-colors">
                      <TableCell className="text-center text-xs text-admin-text-muted font-medium">{i + 1}</TableCell>
                      <TableCell className="py-4">
                        <p className="text-sm text-admin-text-primary leading-tight">{item.description || 'N/A'}</p>
                      </TableCell>
                      <TableCell className="text-center text-sm text-admin-text-secondary">{item.quantity}</TableCell>
                      <TableCell className="text-right text-sm font-mono text-admin-text-secondary">
                        {Number(item.unit_price).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-[10px] font-semibold text-admin-text-muted">{item.tax_percent}%</span>
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono font-medium text-admin-text-primary">
                        {Number(item.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => { setEditingIndex(i); setIsModalOpen(true); }} 
                            disabled={type === 'invoice' && docData.delivery_status === 'delivered' && admin?.role !== 'admin'}
                            className="h-8 w-8 text-admin-text-muted hover:text-zeronix-blue hover:bg-zeronix-blue/10 rounded-lg"
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setItems(items.filter((_, idx) => idx !== i))} 
                            disabled={type === 'invoice' && docData.delivery_status === 'delivered' && admin?.role !== 'admin'}
                            className="h-8 w-8 text-admin-text-muted hover:text-danger hover:bg-danger/10 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Financial Recaps */}
        <div className="xl:col-span-4">
          <div className="bg-admin-surface border border-admin-border rounded-lg p-6 sticky top-24 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-admin-text-primary uppercase tracking-wider border-b border-admin-border pb-4">
              Summary
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs text-admin-text-secondary uppercase">
                <span>Subtotal</span>
                <span className="font-mono text-sm">{totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-admin-text-secondary uppercase">
                <span>VAT (5%)</span>
                <span className="font-mono text-sm">{totals.vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div className="pt-4 border-t border-admin-border">
                <div className="bg-admin-bg p-4 rounded-md border border-admin-border">
                  <p className="text-[10px] font-semibold text-admin-text-muted uppercase tracking-wider mb-1">Total Amount</p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-2xl font-bold text-zeronix-blue font-mono">
                      {totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-xs font-semibold text-admin-text-muted">AED</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-admin-text-muted ml-1">Internal Notes & Terms</Label>
              <Textarea
                value={docData.notes || ''}
                onChange={(e) => setDocData({ ...docData, notes: e.target.value })}
                className="bg-admin-bg border-admin-border text-sm rounded-xl resize-none min-h-[140px] focus:ring-zeronix-blue/10 p-4 transition-all"
                placeholder="Specify payment terms, delivery timelines or internal references..."
              />
            </div>

            <p className="text-[9px] text-center text-admin-text-muted font-medium uppercase tracking-wider opacity-30 mt-4">
              Zeronix Internal Document • {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>

      <ItemModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingIndex(null); }}
        onSave={handleSaveItem}
        item={editingIndex !== null ? items[editingIndex] : null}
        products={productsList}
      />
    </div>
  );
};
