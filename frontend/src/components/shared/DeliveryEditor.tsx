import { getBasePath } from '@/hooks/useBasePath';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBreadcrumb } from '@/hooks/useBreadcrumb';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from './StatusBadge';
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
import { ArrowLeft, Save, Plus, Trash2, Loader2, Calendar, User, Truck, CheckCircle2, FileCheck2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DeliveryEditorProps {
  id?: string;
  isNew: boolean;
}

/**
 * Delivery Editor. Stock only moves when a delivery is explicitly marked
 * delivered (server-side, via markDelivered) — never on create/edit here.
 */
export const DeliveryEditor = ({ id, isNew }: DeliveryEditorProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const [docData, setDocData] = useState<any>({
    status: 'pending',
    customer_id: undefined,
    delivery_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [items, setItems] = useState<any[]>([{ product_id: undefined, product_name: '', quantity: 1 }]);

  const docLabel = isNew ? 'New Delivery' : (docData.delivery_number || `#${id}`);

  useBreadcrumb([
    { label: 'Deliveries', href: `${getBasePath()}/deliveries` },
    { label: docLabel },
  ]);

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
      const response = await api.get(`/admin/deliveries/${id}`);
      setDocData(response.data);
      setItems((response.data.items || []).map((item: any) => ({ ...item, quantity: Number(item.quantity) })));
    } catch {
      toast.error('Failed to load delivery');
    } finally {
      setLoading(false);
    }
  };

  const isLocked = !isNew && docData.status === 'delivered';

  const handleSaveDoc = async () => {
    if (!docData.customer_id) return toast.error('Please select a customer first.');
    if (items.length === 0 || items.some(i => !i.product_name)) return toast.error('Every line item needs a product name.');
    setLoading(true);
    try {
      const payload = { ...docData, items };
      if (isNew) {
        await api.post('/admin/deliveries', payload);
        toast.success('Delivery created successfully.');
      } else {
        await api.put(`/admin/deliveries/${id}`, payload);
        toast.success(`Records updated for ${docLabel}.`);
      }
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      navigate(`${getBasePath()}/deliveries`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Transaction failed. Please verify all fields.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDelivered = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/admin/deliveries/${id}/mark-delivered`);
      setDocData((prev: any) => ({ ...prev, ...res.data }));
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Delivery marked as delivered — stock updated.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to mark delivered.');
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToInvoice = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/admin/deliveries/${id}/convert-to-invoice`);
      toast.success('Invoice created.');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      navigate(`${getBasePath()}/invoices/${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create invoice.');
    } finally {
      setLoading(false);
    }
  };

  const linkedInvoice = docData.invoice || docData.invoices?.[0];
  const canInvoice = !isNew && docData.status === 'delivered' && !linkedInvoice;

  const updateItem = (i: number, patch: any) => {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    setItems(next);
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20 md:pb-0">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(`${getBasePath()}/deliveries`)} className="rounded-2xl border-admin-border h-11 w-11 hover:bg-admin-surface-hover shadow-sm transition-all active:scale-95">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-admin-text-primary tracking-tight">
                {isNew ? 'New Delivery' : `DELIVERY ${docData.delivery_number || '#' + id}`}
              </h1>
              {!isNew && <StatusBadge status={docData.status} />}
            </div>
            <p className="text-xs font-medium text-admin-text-muted mt-0.5 uppercase tracking-wide opacity-70">
              {isNew ? 'Outbound Goods Movement' : 'Managing Delivery Records'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!isNew && docData.status !== 'delivered' && docData.status !== 'cancelled' && (
            <Button onClick={handleMarkDelivered} disabled={loading} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-5 font-bold text-[11px] uppercase tracking-wider shadow-lg shadow-emerald-600/10">
              <CheckCircle2 size={16} className="mr-2" /> Mark Delivered
            </Button>
          )}
          {canInvoice && (
            <Button onClick={handleConvertToInvoice} disabled={loading} size="sm" className="bg-zeronix-blue hover:bg-zeronix-blue-hover text-white rounded-xl h-10 px-5 font-bold text-[11px] uppercase tracking-wider shadow-lg">
              <FileCheck2 size={16} className="mr-2" /> Convert to Invoice
            </Button>
          )}
          {!isLocked && (
            <Button onClick={handleSaveDoc} disabled={loading} size="sm" className="bg-zeronix-blue hover:bg-zeronix-blue-hover text-white rounded-md h-9 px-4 font-medium text-sm transition-all active:scale-95">
              {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
              Save Delivery
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 space-y-6">
          <div className="bg-admin-surface border border-admin-border rounded-lg p-6 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-admin-text-muted ml-1 flex items-center gap-1.5">
                  <User size={12} className="text-zeronix-blue" /> Customer *
                </Label>
                <Select value={String(docData.customer_id || '')} onValueChange={(v) => setDocData({ ...docData, customer_id: Number(v) })} disabled={isLocked}>
                  <SelectTrigger className="h-11 bg-admin-bg border-admin-border rounded-xl text-sm shadow-sm">
                    <SelectValue placeholder="Select customer..." />
                  </SelectTrigger>
                  <SelectContent className="bg-admin-surface border-admin-border rounded-2xl shadow-2xl">
                    {customersList.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)} className="rounded-lg m-1">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-admin-text-muted ml-1 flex items-center gap-1.5">
                  <Calendar size={12} className="text-zeronix-blue" /> Delivery Date
                </Label>
                <Input
                  type="date"
                  disabled={isLocked}
                  value={docData.delivery_date ? docData.delivery_date.split('T')[0] : ''}
                  onChange={(e) => setDocData({ ...docData, delivery_date: e.target.value })}
                  className="h-11 bg-admin-bg border-admin-border rounded-xl text-sm shadow-sm"
                />
              </div>

              {!isNew && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-admin-text-muted ml-1 flex items-center gap-1.5">
                    <Truck size={12} className="text-zeronix-blue" /> Linked Sales Order
                  </Label>
                  <p className="h-11 flex items-center px-3 bg-admin-bg border border-admin-border rounded-xl text-sm text-admin-text-secondary">
                    {docData.salesOrder?.order_number || '— (ad hoc delivery)'}
                  </p>
                </div>
              )}

              {!isNew && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-admin-text-muted ml-1 flex items-center gap-1.5">
                    <FileCheck2 size={12} className="text-zeronix-blue" /> Linked Invoice
                  </Label>
                  <p className="h-11 flex items-center px-3 bg-admin-bg border border-admin-border rounded-xl text-sm text-admin-text-secondary">
                    {linkedInvoice?.invoice_number || '— (not yet invoiced)'}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-admin-text-muted ml-1">Notes</Label>
              <Textarea
                disabled={isLocked}
                value={docData.notes || ''}
                onChange={(e) => setDocData({ ...docData, notes: e.target.value })}
                className="bg-admin-bg border-admin-border rounded-xl text-sm resize-none min-h-[70px]"
              />
            </div>

            {!isNew && docData.customer_confirmation && (
              <div className={`rounded-xl border p-4 flex gap-3 ${docData.customer_confirmation === 'accepted' ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-danger/5 border-danger/30'}`}>
                {docData.customer_confirmation === 'accepted' ? (
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle size={18} className="text-danger shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="text-xs font-bold text-admin-text-primary uppercase tracking-wide">
                    Customer {docData.customer_confirmation === 'accepted' ? 'confirmed receipt' : 'rejected delivery'}
                    {docData.customer_confirmed_at && ` on ${new Date(docData.customer_confirmed_at).toLocaleString()}`}
                  </p>
                  {docData.customer_notes && (
                    <p className="text-xs text-admin-text-secondary italic">"{docData.customer_notes}"</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-admin-surface border border-admin-border rounded-lg overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-admin-border flex items-center justify-between bg-admin-bg/10">
              <span className="text-xs font-semibold text-admin-text-primary uppercase tracking-wider">Items</span>
              {!isLocked && (
                <Button size="sm" variant="outline" onClick={() => setItems([...items, { product_id: undefined, product_name: '', quantity: 1 }])} className="h-8 rounded-md text-xs border-admin-border bg-admin-surface hover:bg-admin-bg px-3">
                  <Plus size={14} className="mr-1" /> Add Item
                </Button>
              )}
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-admin-bg/30">
                  <TableRow className="border-admin-border hover:bg-transparent">
                    <TableHead className="w-12 text-center text-[11px] font-semibold uppercase tracking-wider text-admin-text-muted">#</TableHead>
                    <TableHead className="min-w-[260px] text-[11px] font-semibold uppercase tracking-wider text-admin-text-muted">Product</TableHead>
                    <TableHead className="text-center text-[11px] font-semibold uppercase tracking-wider text-admin-text-muted w-28">Quantity</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, i) => (
                    <TableRow key={i} className="border-admin-border">
                      <TableCell className="text-center text-xs text-admin-text-muted font-medium">{i + 1}</TableCell>
                      <TableCell className="py-2">
                        {isLocked ? (
                          <p className="text-sm text-admin-text-primary">{item.product_name}</p>
                        ) : (
                          <Select
                            value={item.product_id ? String(item.product_id) : ''}
                            onValueChange={(v) => {
                              const p = productsList.find((p) => p.id === Number(v));
                              updateItem(i, { product_id: Number(v), product_name: p?.name || item.product_name });
                            }}
                          >
                            <SelectTrigger className="h-9 bg-admin-bg border-admin-border rounded-lg text-sm">
                              <SelectValue placeholder="Select product..." />
                            </SelectTrigger>
                            <SelectContent className="bg-admin-surface border-admin-border rounded-xl">
                              {productsList.map((p) => (
                                <SelectItem key={p.id} value={String(p.id)} className="text-sm">{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {isLocked ? (
                          <span className="text-sm text-admin-text-secondary">{item.quantity}</span>
                        ) : (
                          <Input
                            type="number"
                            min={0.01}
                            value={item.quantity}
                            onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                            className="h-9 bg-admin-bg border-admin-border rounded-lg text-sm text-center"
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!isLocked && (
                          <Button variant="ghost" size="icon" onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="h-8 w-8 text-admin-text-muted hover:text-danger hover:bg-danger/10 rounded-lg">
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
