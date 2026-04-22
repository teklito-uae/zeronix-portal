import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StatusBadge } from '@/components/shared/StatusBadge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mockInvoices, mockInvoiceItems, mockCustomers, mockProducts } from '@/lib/mockData';
import type { Invoice, InvoiceItem, InvoiceStatus } from '@/types';
import { ArrowLeft, Save, FileDown, Send, Plus, Trash2, CreditCard } from 'lucide-react';

export const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'create';

  const [invoice, setInvoice] = useState<Partial<Invoice>>({
    status: 'draft',
    vat_rate: 5,
    customer_id: undefined,
    due_date: '',
    notes: '',
  });

  const [items, setItems] = useState<Partial<InvoiceItem>[]>([]);

  useEffect(() => {
    if (!isNew && id) {
      const inv = mockInvoices.find((i) => i.id === Number(id));
      if (inv) {
        setInvoice(inv);
        const invItems = mockInvoiceItems.filter((i) => i.invoice_id === inv.id);
        setItems(invItems);
      }
    }
  }, [id, isNew]);

  const addItem = () => {
    setItems([...items, { product_id: undefined, description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };

    if (field === 'product_id' && value) {
      const product = mockProducts.find((p) => p.id === Number(value));
      if (product) {
        item.description = product.name;
        item.unit_price = item.unit_price || 1000;
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
  const vatAmount = subtotal * ((invoice.vat_rate || 5) / 100);
  const total = subtotal + vatAmount;

  const handleSave = () => {
    navigate('/admin/invoices');
  };

  const recordPayment = () => {
    alert('Payment recorded (Mock)');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/invoices')}
            className="text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-surface-hover"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-admin-text-primary">
              {isNew ? 'Create Invoice' : `Invoice INV-${String(invoice.id).padStart(4, '0')}`}
            </h1>
            {!isNew && invoice.status && (
              <div className="mt-1">
                <StatusBadge status={invoice.status} />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isNew && (
            <>
              <Button variant="outline" className="h-[38px] text-admin-text-secondary border-admin-border bg-admin-surface hover:bg-admin-surface-hover">
                <FileDown size={16} className="mr-2" /> PDF
              </Button>
              <Button variant="outline" className="h-[38px] text-admin-text-secondary border-admin-border bg-admin-surface hover:bg-admin-surface-hover">
                <Send size={16} className="mr-2" /> Email
              </Button>
              {invoice.status !== 'paid' && (
                <Button onClick={recordPayment} className="h-[38px] bg-success text-white hover:bg-success/90">
                  <CreditCard size={16} className="mr-2" /> Record Payment
                </Button>
              )}
            </>
          )}
          <Button onClick={handleSave} className="h-[38px] bg-zeronix-blue text-white hover:bg-zeronix-blue-hover">
            <Save size={16} className="mr-2" /> Save Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-admin-surface border border-admin-border rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-admin-text-primary">Invoice Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-admin-text-secondary text-sm">Customer *</Label>
                <Select value={String(invoice.customer_id || '')} onValueChange={(val) => setInvoice({ ...invoice, customer_id: Number(val) })}>
                  <SelectTrigger className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent className="bg-admin-surface border-admin-border">
                    {mockCustomers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} {c.company ? `(${c.company})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-admin-text-secondary text-sm">Status</Label>
                <Select value={invoice.status} onValueChange={(val) => setInvoice({ ...invoice, status: val as InvoiceStatus })}>
                  <SelectTrigger className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-admin-surface border-admin-border">
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-admin-text-secondary text-sm">Due Date</Label>
                <Input
                  type="date"
                  value={invoice.due_date ? invoice.due_date.split('T')[0] : ''}
                  onChange={(e) => setInvoice({ ...invoice, due_date: e.target.value })}
                  className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-admin-text-secondary text-sm">VAT Rate (%)</Label>
                <Input
                  type="number"
                  value={invoice.vat_rate}
                  onChange={(e) => setInvoice({ ...invoice, vat_rate: Number(e.target.value) })}
                  className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-admin-text-secondary text-sm">Notes / Payment Terms</Label>
              <Textarea
                value={invoice.notes || ''}
                onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
                className="bg-admin-bg border-admin-border text-admin-text-primary resize-none"
                placeholder="Payment terms..."
                rows={3}
              />
            </div>
          </div>

          <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-admin-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-admin-text-primary">Line Items</h3>
              <Button variant="ghost" size="sm" onClick={addItem} className="text-zeronix-blue hover:bg-zeronix-blue/10">
                <Plus size={16} className="mr-1" /> Add Item
              </Button>
            </div>
            
            <Table>
              <TableHeader className="bg-admin-bg">
                <TableRow className="border-admin-border hover:bg-transparent">
                  <TableHead className="w-[40%] text-admin-text-secondary">Product / Description</TableHead>
                  <TableHead className="text-admin-text-secondary w-24">Qty</TableHead>
                  <TableHead className="text-admin-text-secondary">Unit Price</TableHead>
                  <TableHead className="text-admin-text-secondary">Total</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-admin-text-muted">
                      No items added yet. Click "Add Item" to start.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => (
                    <TableRow key={index} className="border-admin-border">
                      <TableCell className="align-top space-y-2 p-3">
                        <Select value={String(item.product_id || '')} onValueChange={(val) => updateItem(index, 'product_id', Number(val))}>
                          <SelectTrigger className="h-8 bg-admin-bg border-admin-border text-admin-text-primary text-xs">
                            <SelectValue placeholder="Select product (optional)" />
                          </SelectTrigger>
                          <SelectContent className="bg-admin-surface border-admin-border max-h-48">
                            {mockProducts.map((p) => (
                              <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                                {p.part_number} - {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Textarea
                          value={item.description || ''}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="min-h-[60px] text-xs bg-admin-bg border-admin-border text-admin-text-primary resize-none p-2"
                          placeholder="Description..."
                        />
                      </TableCell>
                      <TableCell className="align-top p-3">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity || ''}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          className="h-8 text-xs bg-admin-bg border-admin-border text-admin-text-primary text-center px-1"
                        />
                      </TableCell>
                      <TableCell className="align-top p-3">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price === 0 ? '' : item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                          className="h-8 text-xs bg-admin-bg border-admin-border text-admin-text-primary"
                        />
                      </TableCell>
                      <TableCell className="align-top p-3 pt-5 font-mono text-sm text-admin-text-primary">
                        {(item.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="align-top p-3 pt-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="h-8 w-8 text-admin-text-muted hover:text-danger hover:bg-admin-surface-hover"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-admin-surface border border-admin-border rounded-xl p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-admin-text-primary mb-4">Summary</h3>
            
            <div className="space-y-3 font-mono text-sm">
              <div className="flex justify-between text-admin-text-secondary">
                <span>Subtotal</span>
                <span>{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} AED</span>
              </div>
              <div className="flex justify-between text-admin-text-secondary">
                <span>VAT ({invoice.vat_rate || 0}%)</span>
                <span>{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} AED</span>
              </div>
              
              <div className="pt-3 mt-3 border-t border-admin-border flex justify-between items-center">
                <span className="font-semibold text-admin-text-primary font-sans">Total</span>
                <span className="font-bold text-lg text-zeronix-blue">
                  {total.toLocaleString(undefined, { minimumFractionDigits: 2 })} AED
                </span>
              </div>
            </div>

            {!isNew && invoice.created_at && (
              <div className="mt-8 space-y-4 pt-6 border-t border-admin-border">
                <h4 className="text-xs font-semibold uppercase text-admin-text-muted">Activity Info</h4>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between text-admin-text-secondary">
                    <span>Created At</span>
                    <span className="text-admin-text-primary">
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {invoice.paid_at && (
                    <div className="flex justify-between text-admin-text-secondary">
                      <span>Paid At</span>
                      <span className="text-success font-medium">
                        {new Date(invoice.paid_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {invoice.quote_id && (
                    <div className="flex justify-between text-admin-text-secondary">
                      <span>Related Quote</span>
                      <span className="text-zeronix-blue font-mono font-medium hover:underline cursor-pointer" onClick={() => navigate(`/admin/quotes/${invoice.quote_id}`)}>
                        QT-{String(invoice.quote_id).padStart(4, '0')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
