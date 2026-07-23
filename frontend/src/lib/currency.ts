export type CurrencyCode = 'USD' | 'AED';

export interface CurrencyDef {
  code: CurrencyCode;
  name: string;
  symbol: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyDef> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$' },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
};

export const CURRENCY_LIST: CurrencyDef[] = Object.values(CURRENCIES);

export const DEFAULT_CURRENCY: CurrencyCode = 'USD';

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && value in CURRENCIES;
}

export function formatMoney(
  amount: number | string | undefined | null,
  currency: CurrencyCode = DEFAULT_CURRENCY,
  options?: Intl.NumberFormatOptions
): string {
  const numeric = Number(amount) || 0;
  const formatted = numeric.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  });
  const def = CURRENCIES[currency] ?? CURRENCIES[DEFAULT_CURRENCY];
  return currency === 'USD' ? `${def.symbol}${formatted}` : `${formatted} ${def.symbol}`;
}
