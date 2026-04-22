import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DownloadButton } from '@/components/shared/DownloadButton';
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
import { mockCustomers, mockProducts } from '@/lib/mockData';
import type { Quote, QuoteItem, QuoteStatus } from '@/types';
import { ArrowLeft, Save, Send, Plus, Trash2, Receipt, Loader2 } from 'lucide-react';

export const QuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'create';

  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<Partial<Quote>>({
    status: 'draft',
    customer_id: undefined,
    valid_until: '',
    notes: '',
  });

  const [items, setItems] = useState<Partial<QuoteItem>[]>([]);

  useEffect(() => {
    if (!isNew && id) {
      fetchQuote();
    }
  }, [id, isNew]);

  const fetchQuote = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/quotes/${id}`);
      setQuote(response.data);
      setItems(response.data.items || []);
    } catch (error) {
      console.error('Failed to fetch quote', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { product_id: undefined, product_name: '', description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };

    if (field === 'product_id' && value) {
      const product = mockProducts.find((p) => p.id === Number(value));
      if (product) {
        item.product_name = product.name;
        item.description = product.description;
        item.unit_price = 1000; // Default price
      }
    }

    if (field === 'quantity' || field === 'unit_price') {
      const qty = field === 'quantity' ? Number(value) : (item.quantity || 0);
      const price = field === 'unit_price' ? Number(value) : (item.unit_price || 0);
      item.total = qty * price;
    }

    newItems[index] = item;
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const vatAmount = subtotal * 0.05;
  const total = subtotal + vatAmount;

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        ...quote,
        items,
        subtotal,
        vat_amount: vatAmount,
        total
      };
      
      if (isNew) {
        await api.post('/admin/quotes', payload);
      } else {
        await api.put(`/admin/quotes/${id}`, payload);
      }
      navigate('/admin/quotes');
    } catch (error) {
      console.error('Save failed', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isNew) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/quotes')}
            className="text-slate-500 hover:bg-slate-100"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isNew ? 'Create Quote' : `Quote ${quote.quote_number || id}`}
            </h1>
            {!isNew && quote.status && (
              <div className="mt-1">
                <StatusBadge status={quote.status} />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isNew && (
            <>
              <DownloadButton id={id!} type="quote" mode="view" variant="outline" label="View PDF" />
              <DownloadButton id={id!} type="quote" mode="download" variant="outline" label="Download" />
              <Button variant="outline" className="h-8 px-3 text-xs">
                <Send size={14} className="mr-2" /> Email
              </Button>
              {quote.status !== 'accepted' && (
                <Button className="h-8 px-3 text-xs bg-emerald-500 hover:bg-emerald-600 text-white border-none">
                  <Receipt size={14} className="mr-2" /> Convert to Invoice
                </Button>
              )}
            </>
          )}
          <Button onClick={handleSave} disabled={loading} className="h-8 px-3 text-xs bg-slate-900 hover:bg-slate-800 text-white">
            {loading ? <Loader2 className="animate-spin mr-2" size={14} /> : <Save size={14} className="mr-2" />}
            Save Quote
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Quote Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-600 text-sm">Customer *</Label>
                <Select value={String(quote.customer_id || '')} onValueChange={(val) => setQuote({ ...quote, customer_id: Number(val) })}>
                  <SelectTrigger className="h-10 border-slate-200">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCustomers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} {c.company ? `(${c.company})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600 text-sm">Status</Label>
                <Select value={quote.status} onValueChange={(val) => setQuote({ ...quote, status: val as QuoteStatus })}>
                  <SelectTrigger className="h-10 border-slate-200">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600 text-sm">Valid Until</Label>
                <Input
                  type="date"
                  value={quote.valid_until ? quote.valid_until.split('T')[0] : ''}
                  onChange={(e) => setQuote({ ...quote, valid_until: e.target.value })}
                  className="h-10 border-slate-200"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600 text-sm">Reference ID</Label>
                <Input
                  value={quote.reference_id || ''}
                  onChange={(e) => setQuote({ ...quote, reference_id: e.target.value })}
                  placeholder="LPO Number etc."
                  className="h-10 border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-600 text-sm">Notes / Terms</Label>
              <Textarea
                value={quote.notes || ''}
                onChange={(e) => setQuote({ ...quote, notes: e.target.value })}
                className="border-slate-200 resize-none"
                placeholder="Terms and conditions..."
                rows={3}
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Line Items</h3>
              <Button variant="ghost" size="sm" onClick={addItem} className="text-emerald-600 hover:bg-emerald-50">
                <Plus size={16} className="mr-1" /> Add Item
              </Button>
            </div>
            
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[40%]">Product / Description</TableHead>
                  <TableHead className="w-24 text-center">Qty</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="space-y-2">
                      <Input
                        value={item.product_name || ''}
                        onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                        placeholder="Product Name"
                        className="h-8 text-xs font-bold"
                      />
                      <Textarea
                        value={item.description || ''}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="min-h-[60px] text-xs resize-none"
                        placeholder="Detailed description..."
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        className="h-8 text-xs text-center"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.unit_price || ''}
                        onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {(item.total || 0).toLocaleString()} AED
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="h-8 w-8 text-slate-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-xl p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Summary</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono">{subtotal.toLocaleString()} AED</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>VAT (5%)</span>
                <span className="font-mono">{vatAmount.toLocaleString()} AED</span>
              </div>
              
              <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="font-bold text-xl text-emerald-600 font-mono">
                  {total.toLocaleString()} AED
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
