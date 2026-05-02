import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Receipt } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { Invoice } from '@/types';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export const PaymentReceiptModal = ({ isOpen, onClose, invoice }: PaymentReceiptModalProps) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank' as 'cash' | 'bank',
    reference_id: '',
    notes: '',
  });

  useEffect(() => {
    if (invoice) {
      setFormData(prev => ({ ...prev, amount: invoice.balance }));
    }
  }, [invoice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;
    setLoading(true);
    try {
      await api.post('/admin/payment-receipts', {
        ...formData,
        invoice_id: invoice.id,
        customer_id: invoice.customer_id,
      });
      toast.success('Payment recorded');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payment-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] bg-admin-surface border-admin-border p-0 overflow-hidden rounded-md">
        <DialogHeader className="px-5 py-3 border-b border-admin-border bg-admin-bg/50">
          <DialogTitle className="text-sm font-medium text-admin-text-primary flex items-center gap-2">
            <Receipt size={16} className="text-zeronix-blue" />
            Record Payment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {invoice && (
            <div className="bg-admin-bg/50 p-3 rounded-md border border-admin-border space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-admin-text-muted">Invoice</span>
                <span className="font-mono font-medium text-zeronix-blue">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-admin-text-muted">Customer</span>
                <span className="text-admin-text-primary">{invoice.customer?.name}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-admin-border">
                <span className="text-admin-text-muted">Balance</span>
                <span className="font-mono font-medium text-danger">{invoice.balance?.toLocaleString()} AED</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-admin-text-secondary">Amount (AED)</Label>
              <Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })} className="h-9 bg-admin-bg border-admin-border rounded-md text-sm font-mono" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-admin-text-secondary">Date</Label>
                <Input type="date" value={formData.payment_date} onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })} className="h-9 bg-admin-bg border-admin-border rounded-md text-sm" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-admin-text-secondary">Method</Label>
                <Select value={formData.payment_method} onValueChange={(v: any) => setFormData({ ...formData, payment_method: v })}>
                  <SelectTrigger className="h-9 bg-admin-bg border-admin-border rounded-md text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-admin-surface border-admin-border">
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-admin-text-secondary">Reference / Trans ID</Label>
              <Input value={formData.reference_id} onChange={(e) => setFormData({ ...formData, reference_id: e.target.value })} placeholder="Cheque # or reference" className="h-9 bg-admin-bg border-admin-border rounded-md text-sm" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-admin-text-secondary">Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="bg-admin-bg border-admin-border rounded-md resize-none min-h-[60px] text-sm" placeholder="Internal notes…" />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1 h-9 rounded-md text-sm">Cancel</Button>
            <Button type="submit" disabled={loading || formData.amount <= 0} className="flex-1 h-9 bg-zeronix-blue hover:bg-zeronix-blue-hover text-white rounded-md text-sm">
              {loading ? 'Processing…' : 'Record'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
