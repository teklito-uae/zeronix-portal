import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Send, ShoppingCart, ArrowLeft, PenLine } from 'lucide-react';

export const RequestForm = () => {
  const navigate = useNavigate();
  const { company } = useParams();
  const { items, updateQuantity, removeItem, clearCart } = useCartStore();
  const [notes, setNotes] = useState('');
  const [manualRequest, setManualRequest] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (items.length === 0 && !manualRequest.trim() && !notes.trim()) {
      alert('Please add products or enter your manual request details.');
      return;
    }

    setIsSubmitting(true);
    // Mock API call
    setTimeout(() => {
      alert('Enquiry submitted successfully!');
      clearCart();
      setIsSubmitting(false);
      navigate(`/portal/${company}/enquiries`);
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/portal/${company}/products`)}
          className="text-admin-text-secondary hover:text-admin-text-primary -ml-2"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-admin-text-primary">Send Enquiry</h1>
          <p className="text-admin-text-secondary mt-1">Request a quote for products from our catalog or enter your requirements manually.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {items.length > 0 ? (
            <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-admin-border bg-admin-bg flex items-center gap-2">
                <ShoppingCart size={18} className="text-zeronix-blue" />
                <h3 className="font-semibold text-admin-text-primary">Selected Items ({items.length})</h3>
              </div>
              <div className="divide-y divide-admin-border">
                {items.map((item) => (
                  <div key={item.product.id} className="p-4 flex flex-col sm:flex-row gap-4 sm:items-center">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-admin-text-primary mb-1 truncate">{item.product.name}</h4>
                      <p className="text-sm text-admin-text-secondary font-mono mb-2">{item.product.part_number}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center">
                        <span className="text-sm text-admin-text-secondary mr-2">Qty:</span>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.product.id, Number(e.target.value) || 1)}
                          className="h-8 w-20 text-sm bg-admin-bg border-admin-border"
                        />
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-sm text-danger hover:underline flex items-center gap-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-admin-surface border border-admin-border rounded-xl p-8 text-center shadow-sm">
              <ShoppingCart size={40} className="mx-auto text-admin-text-muted mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-admin-text-primary mb-2">No Products Selected</h3>
              <p className="text-admin-text-secondary mb-6 text-sm">You can browse the catalog to add items, or just use the manual form below.</p>
              <Button variant="outline" onClick={() => navigate(`/portal/${company}/products`)} className="border-zeronix-blue text-zeronix-blue hover:bg-zeronix-blue hover:text-white">
                Browse Catalog
              </Button>
            </div>
          )}

          <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-admin-border bg-admin-bg flex items-center gap-2">
              <PenLine size={18} className="text-zeronix-blue" />
              <h3 className="font-semibold text-admin-text-primary">Manual Requirements</h3>
            </div>
            <div className="p-4">
              <label className="block text-sm font-medium text-admin-text-secondary mb-2">
                List part numbers, descriptions, or upload requirements
              </label>
              <Textarea
                value={manualRequest}
                onChange={(e) => setManualRequest(e.target.value)}
                placeholder="E.g., 50x CISCO-1234, 10x Dell Server R740..."
                className="min-h-[120px] resize-none bg-admin-bg border-admin-border"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-admin-surface border border-admin-border rounded-xl p-6 shadow-sm sticky top-24">
            <h3 className="font-semibold text-lg text-admin-text-primary mb-4">Final Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-admin-text-secondary mb-2">
                  Additional Notes / Deadline
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="E.g., Require delivery by next week in Dubai branch..."
                  className="min-h-[100px] resize-none bg-admin-bg border-admin-border"
                />
              </div>

              <div className="pt-4 border-t border-admin-border">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-zeronix-blue hover:bg-zeronix-blue-hover text-white h-12 text-base font-medium"
                >
                  {isSubmitting ? 'Submitting...' : (
                    <>
                      <Send size={18} className="mr-2" /> Submit Enquiry
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-admin-text-muted mt-3">
                  Our sales team will process your enquiry and issue a formal quote.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
