import { create } from 'zustand';

interface DealsDragState {
  draggingDealId: number | null;
  draggingFromStage: string | null;
  setDragging: (dealId: number | null, fromStage: string | null) => void;
}

export const useDealsDragStore = create<DealsDragState>((set) => ({
  draggingDealId: null,
  draggingFromStage: null,

  setDragging: (dealId, fromStage) => set({ draggingDealId: dealId, draggingFromStage: fromStage }),
}));
