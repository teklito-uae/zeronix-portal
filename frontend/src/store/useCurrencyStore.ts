import { create } from 'zustand';
import { DEFAULT_CURRENCY, isCurrencyCode, type CurrencyCode } from '@/lib/currency';

interface CurrencyState {
  currency: CurrencyCode;
  baseCurrency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  setFromSettings: (settings: Record<string, unknown> | null | undefined) => void;
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
  currency: DEFAULT_CURRENCY,
  baseCurrency: DEFAULT_CURRENCY,

  setCurrency: (currency) => set({ currency }),

  setFromSettings: (settings) => {
    const rawCurrency = settings?.currency;
    const rawBase = settings?.base_currency;
    set({
      currency: isCurrencyCode(rawCurrency) ? rawCurrency : DEFAULT_CURRENCY,
      baseCurrency: isCurrencyCode(rawBase) ? rawBase : DEFAULT_CURRENCY,
    });
  },
}));
