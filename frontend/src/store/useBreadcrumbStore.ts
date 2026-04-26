import { create } from 'zustand';

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

interface BreadcrumbStore {
  segments: BreadcrumbSegment[];
  setSegments: (segments: BreadcrumbSegment[]) => void;
  clear: () => void;
}

export const useBreadcrumbStore = create<BreadcrumbStore>((set) => ({
  segments: [],
  setSegments: (segments) => set({ segments }),
  clear: () => set({ segments: [] }),
}));
