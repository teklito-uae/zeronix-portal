import React, { useState, useEffect, useMemo } from 'react';
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
import type { Customer, Product, QuoteItem, InvoiceItem } from '@/types';
import { ArrowLeft, Save, Plus, Trash2, Receipt, Loader2, Calendar, User, FileText, Settings2, Edit3, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DocumentEditorProps {
  type: 'quote' | 'invoice';
  id?: string;
  isNew: boolean;
}

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
    if (!docData.customer_id) return toast.error('Select a customer');
    if (items.length === 0) return toast.error('Add at least one item');
    setLoading(true);
    try {
      const payload = { ...docData, items };
      if (isNew) {
        await api.post(`/admin/${type}s`, payload);
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} created`);
      } else {
        await api.put(`/admin/${type}s/${id}`, payload);
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} updated`);
      }
      // Bust list cache so the table shows fresh data immediately on navigate back
      queryClient.invalidateQueries({ queryKey: [type === 'quote' ? 'quotes' : 'invoices'] });
      navigate(`/admin/${type}s`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    setLoading(true);
    try {
      const payload = { customer_id: docData.customer_id, quote_id: docData.id, date: new Date().toISOString().split('T')[0], items: items.map(i => ({ ...i })) };
      const res = await api.post('/admin/invoices', payload);
      toast.success('Converted to Invoice');
      navigate(`/admin/invoices/${res.data.id}`);
    } catch {
      toast.error('Conversion failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isNew) {
    return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-zeronix-blue" size={24} /></div>;
  }

  return (
    <div className="space-y-5 animate-in pb-16">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(`/admin/${type}s`)} className="rounded-md border-admin-border h-9 w-9">
            <ArrowLeft size={16} />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-admin-text-primary">
                {isNew ? `New ${type.charAt(0).toUpperCase() + type.slice(1)}` : `${type.toUpperCase()} ${docData[`${type}_number`] || '#' + id}`}
              </h1>
              {!isNew && <StatusBadge status={docData.status} />}
            </div>
            <p className="text-xs text-admin-text-muted mt-0.5">
              {isNew ? 'Create a new document' : 'Edit document details'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isNew && (
            <>
              <DownloadButton id={id!} type={type} mode="view" variant="outline" label="View PDF" />
              {type === 'quote' && docData.status !== 'invoiced' && (
                <Button onClick={handleConvert} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md h-9 text-sm">
                  <Receipt size={14} className="mr-1.5" /> Convert to Invoice
                </Button>
              )}
            </>
          )}
          <Button 
            onClick={handleSaveDoc} 
            disabled={loading || (type === 'invoice' && docData.delivery_status === 'delivered' && admin?.role !== 'admin')} 
            size="sm" 
            className="bg-zeronix-blue hover:bg-zeronix-blue-hover text-white rounded-md h-9 text-sm"
          >
            {loading ? <Loader2 className="animate-spin mr-1.5" size={14} /> : <Save size={14} className="mr-1.5" />}
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Main */}
        <div className="xl:col-span-8 space-y-5">
          {/* Settings */}
          <div className="bg-admin-surface border border-admin-border rounded-md p-5 space-y-5">
            <div className="flex items-center gap-2 text-sm font-medium text-admin-text-primary border-b border-admin-border pb-3">
              <Settings2 size={14} className="text-zeronix-blue" /> Document Details
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-admin-text-secondary flex items-center gap-1"><User size={11} /> Customer *</Label>
                <Select value={String(docData.customer_id || '')} onValueChange={(v) => setDocData({ ...docData, customer_id: Number(v) })}>
                  <SelectTrigger className="h-9 bg-admin-bg border-admin-border rounded-md text-sm"><SelectValue placeholder="Select customer…" /></SelectTrigger>
                  <SelectContent className="bg-admin-surface border-admin-border">
                    {customersList.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        <span className="font-medium">{c.name}</span>
                        {c.company && <span className="text-admin-text-muted ml-1.5">— {c.company}</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-admin-text-secondary flex items-center gap-1"><Edit3 size={11} /> Status</Label>
                <Select value={docData.status} onValueChange={(v) => setDocData({ ...docData, status: v })}>
                  <SelectTrigger className="h-9 bg-admin-bg border-admin-border rounded-md text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-admin-surface border-admin-border">
                    {type === 'quote' ? (
                      <>{['draft','sent','accepted','rejected','invoiced'].map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</SelectItem>)}</>
                    ) : (
                      <>{['draft','unpaid','paid','overdue','cancelled'].map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</SelectItem>)}</>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-admin-text-secondary flex items-center gap-1"><Calendar size={11} /> Date</Label>
                <Input type="date" value={docData.date ? docData.date.split('T')[0] : ''} onChange={(e) => setDocData({ ...docData, date: e.target.value })} className="h-9 bg-admin-bg border-admin-border rounded-md text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-admin-text-secondary flex items-center gap-1"><Calendar size={11} /> {type === 'quote' ? 'Valid Until' : 'Due Date'}</Label>
                <Input
                  type="date"
                  value={type === 'quote' ? (docData.valid_until ? docData.valid_until.split('T')[0] : '') : (docData.due_date ? docData.due_date.split('T')[0] : '')}
                  onChange={(e) => setDocData({ ...docData, [type === 'quote' ? 'valid_until' : 'due_date']: e.target.value })}
                  className="h-9 bg-admin-bg border-admin-border rounded-md text-sm"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-xs text-admin-text-secondary flex items-center gap-1"><FileText size={11} /> Reference (PO / LPO)</Label>
                <Input value={docData.reference_id || ''} onChange={(e) => setDocData({ ...docData, reference_id: e.target.value })} placeholder="E.g. PO-789234" className="h-9 bg-admin-bg border-admin-border rounded-md text-sm" />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-admin-surface border border-admin-border rounded-md overflow-hidden">
            <div className="px-5 py-3 border-b border-admin-border flex items-center justify-between bg-admin-bg/30">
              <span className="text-sm font-medium text-admin-text-primary flex items-center gap-2">
                <Plus size={14} className="text-zeronix-blue" /> Line Items
              </span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => { setEditingIndex(null); setIsModalOpen(true); }} 
                className="h-8 rounded-md text-xs border-admin-border"
                disabled={type === 'invoice' && docData.delivery_status === 'delivered' && admin?.role !== 'admin'}
              >
                Add Item
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-admin-bg/50">
                  <TableRow className="border-admin-border">
                    <TableHead className="w-10 text-center text-xs">#</TableHead>
                    <TableHead className="min-w-[250px] text-xs">Description</TableHead>
                    <TableHead className="text-center text-xs w-16">Qty</TableHead>
                    <TableHead className="text-right text-xs w-24">Price</TableHead>
                    <TableHead className="text-center text-xs w-16">VAT</TableHead>
                    <TableHead className="text-right text-xs w-28">Total</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-sm text-admin-text-muted">
                        No items. Click "Add Item" to start.
                      </TableCell>
                    </TableRow>
                  ) : items.map((item, i) => (
                    <TableRow key={i} className="border-admin-border group hover:bg-admin-surface-hover transition-colors">
                      <TableCell className="text-center text-xs text-admin-text-muted font-mono">{i + 1}</TableCell>
                      <TableCell className="py-3">
                        <p className="text-sm text-admin-text-primary line-clamp-2">{item.description || '—'}</p>
                      </TableCell>
                      <TableCell className="text-center text-sm font-medium">{item.quantity}</TableCell>
                      <TableCell className="text-right text-sm font-mono text-admin-text-secondary">
                        {Number(item.unit_price).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          "text-[11px] font-medium px-1.5 py-0.5 rounded",
                          item.tax_percent > 0 ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                        )}>{item.tax_percent}%</span>
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
                            className="h-7 w-7 text-admin-text-muted hover:text-zeronix-blue"
                          >
                            <Pencil size={12} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setItems(items.filter((_, idx) => idx !== i))} 
                            disabled={type === 'invoice' && docData.delivery_status === 'delivered' && admin?.role !== 'admin'}
                            className="h-7 w-7 text-admin-text-muted hover:text-red-500"
                          >
                            <Trash2 size={12} />
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

        {/* Sidebar */}
        <div className="xl:col-span-4">
          <div className="bg-admin-surface border border-admin-border rounded-md p-5 sticky top-8 space-y-5">
            <h3 className="text-sm font-medium text-admin-text-primary">Financial Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-admin-text-secondary">Subtotal</span>
                <span className="font-mono text-admin-text-primary">{totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} AED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-admin-text-secondary">VAT</span>
                <span className="font-mono text-admin-text-primary">{totals.vat.toLocaleString(undefined, { minimumFractionDigits: 2 })} AED</span>
              </div>
              <div className="pt-3 border-t border-dashed border-admin-border">
                <div className="bg-admin-bg p-4 rounded-md border border-admin-border">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[11px] text-admin-text-muted uppercase tracking-wide">Total</p>
                      <p className="text-lg font-semibold text-zeronix-blue font-mono mt-0.5">
                        {totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <span className="text-xs text-admin-text-muted mb-0.5">AED</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-admin-text-secondary">Notes / Terms</Label>
              <Textarea
                value={docData.notes || ''}
                onChange={(e) => setDocData({ ...docData, notes: e.target.value })}
                className="bg-admin-bg border-admin-border text-sm rounded-md resize-none"
                placeholder="Payment terms, delivery notes…"
                rows={4}
              />
            </div>
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
