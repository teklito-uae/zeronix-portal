import { CurrencyIcon } from './CurrencyIcon';
import { CURRENCIES, type CurrencyCode } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface CurrencyAmountProps {
  amount: number | string | undefined | null;
  currency: CurrencyCode;
  size?: number;
  className?: string;
  iconClassName?: string;
}

/**
 * JSX-rendered money amount. Unlike formatMoney() (plain text, for
 * contexts like toasts/titles/PDF strings), this actually renders the
 * Dirham icon glyph for AED instead of the word "AED".
 */
export const CurrencyAmount = ({
  amount,
  currency,
  size = 13,
  className = '',
  iconClassName = '',
}: CurrencyAmountProps) => {
  const numeric = Number(amount) || 0;
  const formatted = numeric.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (currency === 'USD') {
    return <span className={className}>{CURRENCIES.USD.symbol}{formatted}</span>;
  }

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <CurrencyIcon currency={currency} size={size} className={iconClassName} />
      {formatted}
    </span>
  );
};
