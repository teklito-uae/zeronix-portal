import { Input } from '@/components/ui/input';
import type { DocTotals } from '@/lib/lineItemMath';
import type { TransactionType } from '@/lib/transactionTypes';

interface SummaryPanelProps {
  type: TransactionType;
  totals: DocTotals;
  discountPercent: number;
  shippingAmount: number;
  onDiscountPercentChange: (value: number) => void;
  onShippingAmountChange: (value: number) => void;
  disabled?: boolean;
}

const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const SummaryPanel = ({
  type,
  totals,
  discountPercent,
  shippingAmount,
  onDiscountPercentChange,
  onShippingAmountChange,
  disabled,
}: SummaryPanelProps) => {
  const label = type === 'quote' ? 'Quote' : 'Invoice';

  return (
    <div className="bg-brand-white border border-brand-border rounded-lg p-4 space-y-3">
      <p className="text-[13px] font-semibold text-brand-primary">{label} Summary</p>

      <div className="flex items-center justify-between text-[13px]">
        <span className="text-brand-muted">Subtotal</span>
        <span className="font-mono text-brand-primary">{fmt(totals.subtotal)}</span>
      </div>

      <div className="flex items-center justify-between text-[13px] gap-2">
        <span className="text-brand-muted flex-shrink-0">Discount</span>
        <div className="flex items-center gap-2">
          <div className="relative w-16">
            <Input
              type="number"
              min={0}
              max={100}
              value={discountPercent}
              disabled={disabled}
              onChange={(e) => onDiscountPercentChange(e.target.value === '' ? 0 : Number(e.target.value))}
              className="h-7 text-[12px] text-right pr-5 bg-brand-bg border-brand-border rounded-md"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-brand-subtle pointer-events-none">%</span>
          </div>
          <span className="font-mono text-brand-primary">{fmt(totals.discountAmount)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[13px]">
        <span className="text-brand-muted">Tax</span>
        <span className="font-mono text-brand-primary">{fmt(totals.vat)}</span>
      </div>

      <div className="flex items-center justify-between text-[13px] gap-2">
        <span className="text-brand-muted flex-shrink-0">Shipping</span>
        <Input
          type="number"
          min={0}
          value={shippingAmount}
          disabled={disabled}
          onChange={(e) => onShippingAmountChange(e.target.value === '' ? 0 : Number(e.target.value))}
          className="h-7 w-24 text-[12px] text-right bg-brand-bg border-brand-border rounded-md"
        />
      </div>

      <div className="border-t border-brand-border pt-3 flex items-baseline justify-between">
        <span className="text-[13px] font-semibold text-brand-primary">Grand Total</span>
        <span className="text-xl font-bold text-brand-accent font-mono">
          {fmt(totals.total)} <span className="text-[11px] font-semibold text-brand-muted">AED</span>
        </span>
      </div>

      {totals.discountAmount > 0 && (
        <p className="text-[11px] font-medium text-brand-success">
          You save AED {fmt(totals.discountAmount)}
        </p>
      )}
    </div>
  );
};
