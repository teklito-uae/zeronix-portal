import { create } from 'zustand';

import type { ReactNode } from 'react';

interface BreadcrumbSegment {
  label: string;
  href?: string;
  badge?: ReactNode;
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
