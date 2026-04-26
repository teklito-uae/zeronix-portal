import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingCart, Trash2, Plus, Minus, Send, Package, Info, Tag } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

export const CartDrawer = ({ children }: { children: React.ReactNode }) => {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const [notes, setNotes] = useState('');
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/customer/enquiries', data),
    onSuccess: () => {
      toast.success('Enquiry sent successfully! Our team will contact you soon.');
      clearCart();
      setNotes('');
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['customer-enquiries'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to send enquiry');
    }
  });

  const handleSendEnquiry = () => {
    const payload = {
      notes,
      items: items.map(item => ({
        product_id: item.product?.id,
        quantity: item.quantity,
        description: item.isManual ? item.description : undefined
      }))
    };
    mutation.mutate(payload);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md bg-admin-surface border-admin-border flex flex-col p-0">
        <SheetHeader className="p-6 border-b border-admin-border bg-admin-bg/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zeronix-blue/10 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-zeronix-blue" />
              </div>
              <SheetTitle className="text-xl font-bold text-admin-text-primary">Enquiry Cart</SheetTitle>
            </div>
            <Badge variant="secondary" className="h-6 rounded-full bg-admin-bg border-admin-border text-admin-text-secondary font-bold uppercase tracking-widest text-[10px]">
              {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
            </Badge>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-admin-bg rounded-full flex items-center justify-center mb-6 border border-admin-border">
                <Package className="h-10 w-10 text-admin-text-muted/30" />
              </div>
              <h3 className="text-lg font-semibold text-admin-text-primary mb-2">Your cart is empty</h3>
              <p className="text-admin-text-muted text-sm max-w-[200px]">
                Add products from the catalog to start an enquiry.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={item.product?.id || `manual-${idx}`} className="group relative flex flex-col gap-3 p-4 bg-admin-bg/40 rounded-xl border border-admin-border hover:border-zeronix-blue/30 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {item.isManual && (
                          <Badge variant="outline" className="h-5 text-[9px] font-bold uppercase tracking-tighter border-zeronix-blue/30 text-zeronix-blue bg-zeronix-blue/5">
                            <Tag size={10} className="mr-1" /> Manual
                          </Badge>
                        )}
                        <h4 className="text-sm font-bold text-admin-text-primary truncate">
                          {item.isManual ? item.description : item.product?.name}
                        </h4>
                      </div>
                      {!item.isManual && (
                        <p className="text-[10px] font-bold text-admin-text-muted uppercase tracking-widest">
                          {item.product?.model_code || 'No Code'}
                        </p>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-admin-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      onClick={() => removeItem(item.product?.id, item.description)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1 bg-admin-surface rounded-lg p-0.5 border border-admin-border">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-admin-text-secondary hover:text-admin-text-primary"
                        onClick={() => updateQuantity(item.quantity - 1, item.product?.id, item.description)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-bold text-admin-text-primary">
                        {item.quantity}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-admin-text-secondary hover:text-admin-text-primary"
                        onClick={() => updateQuantity(item.quantity + 1, item.product?.id, item.description)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-[10px] font-medium text-admin-text-muted italic">Ready for request</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {items.length > 0 && (
          <SheetFooter className="p-6 border-t border-admin-border bg-admin-bg/30">
            <div className="w-full space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-admin-text-muted uppercase tracking-widest flex items-center gap-2">
                  <Info className="h-3 w-3" /> Request Notes
                </label>
                <Textarea 
                  placeholder="e.g. Please provide your best price and lead time for these items..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-admin-surface border-admin-border focus:ring-zeronix-blue/20 resize-none min-h-[80px] text-sm text-admin-text-primary"
                />
              </div>
              
              <Button 
                className="w-full h-11 bg-zeronix-blue hover:bg-zeronix-blue-hover text-white font-bold text-sm gap-2 group shadow-lg shadow-zeronix-blue/10 transition-all"
                disabled={mutation.isPending}
                onClick={handleSendEnquiry}
              >
                {mutation.isPending ? 'Processing...' : 'Submit Quote Request'}
                {!mutation.isPending && <Send className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
              </Button>
              
              <p className="text-[10px] text-center text-admin-text-muted font-medium italic">
                Our sales team typically responds within 2-4 business hours.
              </p>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};
