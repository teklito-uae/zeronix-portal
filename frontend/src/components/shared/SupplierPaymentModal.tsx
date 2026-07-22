import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import type { PurchaseBill } from '@/types';

interface SupplierPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseBill: PurchaseBill | null;
}

export const SupplierPaymentModal = ({ isOpen, onClose, purchaseBill }: SupplierPaymentModalProps) => {
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
    if (purchaseBill) {
      setFormData(prev => ({ ...prev, amount: purchaseBill.balance }));
    }
  }, [purchaseBill]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseBill) return;
    setLoading(true);
    try {
      await api.post('/admin/supplier-payment-receipts', {
        ...formData,
        purchase_bill_id: purchaseBill.id,
        supplier_id: purchaseBill.supplier_id,
      });
      toast.success('Payment recorded');
      queryClient.invalidateQueries({ queryKey: ['purchase-bills'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-payment-receipts'] });
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-[440px] bg-admin-surface border-admin-border p-0 flex flex-col gap-0">
        <SheetHeader className="px-5 py-3 border-b border-admin-border bg-admin-bg/50 space-y-0 text-left flex-shrink-0">
          <SheetTitle className="text-sm font-medium text-admin-text-primary flex items-center gap-2 pr-6">
            <Receipt size={16} className="text-zeronix-blue" />
            Record Supplier Payment
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col p-5 space-y-4">
          {purchaseBill && (
            <div className="bg-admin-bg/50 p-3 rounded-md border border-admin-border space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-admin-text-muted">Bill</span>
                <span className="font-mono font-medium text-zeronix-blue">{purchaseBill.bill_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-admin-text-muted">Supplier</span>
                <span className="text-admin-text-primary">{purchaseBill.supplier?.name}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-admin-border">
                <span className="text-admin-text-muted">Balance</span>
                <span className="font-mono font-medium text-danger">{purchaseBill.balance?.toLocaleString()} AED</span>
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
      </SheetContent>
    </Sheet>
  );
};
