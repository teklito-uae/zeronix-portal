import type { ReactNode } from 'react';
import { create } from 'zustand';

interface TopbarActionsStore {
  actions: ReactNode | null;
  setActions: (actions: ReactNode | null) => void;
  clear: () => void;
}

export const useTopbarActionsStore = create<TopbarActionsStore>((set) => ({
  actions: null,
  setActions: (actions) => set({ actions }),
  clear: () => set({ actions: null }),
}));
