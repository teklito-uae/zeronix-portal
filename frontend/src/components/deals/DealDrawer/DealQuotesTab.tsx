import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { getBasePath } from '@/hooks/useBasePath';
import type { Deal } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/shared/Spinner';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CurrencyAmount } from '@/components/shared/CurrencyAmount';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { Plus } from 'lucide-react';

interface DealQuotesTabProps {
  deal: Deal;
}

/**
 * Quote list + actions for a deal.
 *
 * NOTE on scope: the source Deals.tsx has a "New Quote" flow that opens a
 * whole separate item-editing Sheet (its own line-item rows editor,
 * contact picker, etc. — none of that is a shared/exported component, it's
 * a page-local `ItemRowsEditor`). The task spec asks for a "Convert to
 * Quote" action here, which we read as: one-click create a Quote from the
 * deal's current items (or a single default line derived from the deal's
 * value/title if it has none) rather than re-building that whole editor as
 * a new shared component. Flagging this interpretation explicitly since
 * the exact intended UX was ambiguous — see the final report.
 *
 * Approve / Convert-to-Sales-Order mirror Deals.tsx's `approveQuote` /
 * `convertQuote` mutations verbatim (endpoints + navigation target).
 */
export const DealQuotesTab = ({ deal }: DealQuotesTabProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currency = useCurrencyStore((s) => s.currency);

  const invalidateDeal = () => {
    queryClient.invalidateQueries({ queryKey: ['deals'] });
    queryClient.invalidateQueries({ queryKey: ['deals', deal.id] });
  };

  const quotesAsc = useMemo(
    () =>
      [...(deal.quotes ?? [])].sort(
        (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      ),
    [deal.quotes]
  );
  const quotesDisplay = useMemo(
    () => [...quotesAsc].reverse().map((q) => ({ quote: q, version: quotesAsc.indexOf(q) + 1 })),
    [quotesAsc]
  );

  const convertToQuote = useMutation({
    mutationFn: () => {
      const items = (deal.items ?? []).map((it) => ({
        product_id: it.product_id || undefined,
        description: it.description || it.product?.name || 'Item',
        quantity: it.quantity || 1,
        unit_price: it.unit_price || 0,
        tax_percent: it.tax_percent ?? 5,
        discount_percent: it.discount_percent ?? 0,
      }));
      const payload = {
        customer_id: deal.customer_id,
        deal_id: deal.id,
        date: new Date().toISOString().slice(0, 10),
        customer_contact_id: deal.customer_contact_id ?? undefined,
        items: items.length > 0
          ? items
          : [{ description: deal.title || 'Item', quantity: 1, unit_price: deal.value || 0, tax_percent: 5, discount_percent: 0 }],
      };
      return api.post('/admin/quotes', payload);
    },
    onSuccess: () => {
      invalidateDeal();
      toast.success('Quote created');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create quote'),
  });

  const approveQuote = useMutation({
    mutationFn: (quoteId: number) => api.post(`/admin/quotes/${quoteId}/approve`),
    onSuccess: () => {
      invalidateDeal();
      toast.success('Quote approved');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to approve quote'),
  });

  const convertQuote = useMutation({
    mutationFn: (quoteId: number) => api.post(`/admin/quotes/${quoteId}/convert-to-sales-order`),
    onSuccess: (res) => {
      invalidateDeal();
      toast.success('Sales order created');
      navigate(`${getBasePath()}/sales-orders/${res.data.id}`);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to convert quote'),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-[12px] font-medium text-brand-secondary ml-1">Quotes</Label>
        <Button
          type="button"
          size="sm"
          disabled={!deal.customer_id || convertToQuote.isPending}
          onClick={() => convertToQuote.mutate()}
          className="h-[30px] text-[12px] rounded-lg"
        >
          {convertToQuote.isPending ? <Spinner size={13} className="mr-1" /> : <Plus size={13} className="mr-1" />}
          Convert to Quote
        </Button>
      </div>
      {!deal.customer_id && (
        <p className="text-[11px] text-brand-subtle">Convert the lead to an account to create quotes for this deal.</p>
      )}
      {quotesDisplay.length === 0 ? (
        <p className="text-[12px] text-brand-subtle text-center py-4">No quotes yet.</p>
      ) : (
        <div className="space-y-2">
          {quotesDisplay.map(({ quote, version }) => (
            <div
              key={quote.id}
              className="flex items-center justify-between gap-2 bg-brand-surface border border-brand-border/50 rounded-lg px-3 py-2.5"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold text-brand-primary">{quote.quote_number || `V${version}`}</p>
                  <StatusBadge status={quote.status} />
                </div>
                <p className="text-[12px] text-brand-subtle mt-0.5">
                  <CurrencyAmount amount={quote.total} currency={currency} />
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {!['approved', 'converted', 'superseded'].includes(quote.status) && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => approveQuote.mutate(quote.id)}
                    disabled={approveQuote.isPending}
                    className="h-[28px] text-[11px] rounded-lg"
                  >
                    Approve
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  disabled={quote.status !== 'approved' || convertQuote.isPending}
                  onClick={() => convertQuote.mutate(quote.id)}
                  className="h-[28px] text-[11px] rounded-lg"
                >
                  Convert to SO
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
