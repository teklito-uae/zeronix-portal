import { create } from 'zustand';

export interface DealsFilters {
  search: string;
  ownerId: number | null;
  companyId: number | null;
  tagId: number | null;
  priority: string | null;
}

interface DealsFiltersState {
  filters: DealsFilters;
  setFilter: <K extends keyof DealsFilters>(key: K, value: DealsFilters[K]) => void;
  resetFilters: () => void;
}

const defaultFilters: DealsFilters = {
  search: '',
  ownerId: null,
  companyId: null,
  tagId: null,
  priority: null,
};

export const useDealsFiltersStore = create<DealsFiltersState>((set) => ({
  filters: { ...defaultFilters },

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  resetFilters: () => set({ filters: { ...defaultFilters } }),
}));
