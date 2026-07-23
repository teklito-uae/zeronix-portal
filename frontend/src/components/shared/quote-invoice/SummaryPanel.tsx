import { Input } from '@/components/ui/input';
import type { DocTotals } from '@/lib/lineItemMath';
import type { TransactionType } from '@/lib/transactionTypes';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { CurrencyAmount } from '@/components/shared/CurrencyAmount';

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
  const currency = useCurrencyStore((s) => s.currency);
  const label = type === 'quote' ? 'Quote' : type === 'invoice' ? 'Invoice' : 'Purchase Bill';

  return (
    <div className="p-4 md:p-5 border-b border-brand-border space-y-3">
      <p className="text-[14px] font-semibold text-brand-primary">{label} Summary</p>

      <div className="flex items-center justify-between text-[13px]">
        <span className="text-brand-muted">Subtotal</span>
        <span className="font-mono font-medium text-brand-primary">{totals.subtotal > 0 ? fmt(totals.subtotal) : '-'}</span>
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
          <span className="font-mono font-medium text-brand-danger">{totals.discountAmount > 0 ? `- ${fmt(totals.discountAmount)}` : '-'}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[13px]">
        <span className="text-brand-muted">Tax</span>
        <span className="font-mono font-medium text-brand-primary">{totals.vat > 0 ? fmt(totals.vat) : '-'}</span>
      </div>

      <div className="flex items-center justify-between text-[13px] gap-2">
        <span className="text-brand-muted flex-shrink-0">Shipping</span>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            value={shippingAmount}
            disabled={disabled}
            onChange={(e) => onShippingAmountChange(e.target.value === '' ? 0 : Number(e.target.value))}
            className="h-7 w-20 text-[12px] text-right bg-brand-bg border-brand-border rounded-md"
          />
          <span className="font-mono font-medium text-brand-primary">{shippingAmount > 0 ? fmt(shippingAmount) : '-'}</span>
        </div>
      </div>

      <div className="border-t border-brand-border pt-4 flex items-baseline justify-between mt-2">
        <span className="text-[14px] font-bold text-brand-primary">Grand Total</span>
        <span className="text-xl font-bold text-[#10B981] font-mono">
          <CurrencyAmount amount={totals.total} currency={currency} />
        </span>
      </div>

      {totals.discountAmount > 0 && (
        <p className="text-[11px] font-medium text-[#10B981] text-right">
          You save <CurrencyAmount amount={totals.discountAmount} currency={currency} />
        </p>
      )}
    </div>
  );
};
