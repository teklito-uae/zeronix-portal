import { create } from 'zustand';

interface SelectedDealState {
  selectedDealId: number | null;
  setSelectedDealId: (id: number | null) => void;
}

export const useSelectedDealStore = create<SelectedDealState>((set) => ({
  selectedDealId: null,

  setSelectedDealId: (id) => set({ selectedDealId: id }),
}));
