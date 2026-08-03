import { create } from 'zustand';

type DealsViewMode = 'kanban' | 'list';

interface DealsViewModeState {
  viewMode: DealsViewMode;
  setViewMode: (m: DealsViewMode) => void;
}

export const useDealsViewModeStore = create<DealsViewModeState>((set) => ({
  viewMode: 'list',

  setViewMode: (m) => set({ viewMode: m }),
}));
