import { create } from 'zustand';

interface DealsColumnsState {
  columns: Record<string, number[]>; // stageKey -> ordered deal IDs
  collapsedColumns: Record<string, boolean>;
  setColumnIds: (stageKey: string, ids: number[]) => void;
  reorderWithinColumn: (stageKey: string, fromIndex: number, toIndex: number) => void;
  moveCardAcrossColumns: (fromStage: string, toStage: string, dealId: number, toIndex: number) => void;
  toggleCollapsed: (stageKey: string) => void;
}

export const useDealsColumnsStore = create<DealsColumnsState>((set) => ({
  columns: {},
  collapsedColumns: {},

  setColumnIds: (stageKey, ids) =>
    set((state) => ({
      columns: { ...state.columns, [stageKey]: ids },
    })),

  reorderWithinColumn: (stageKey, fromIndex, toIndex) =>
    set((state) => {
      const current = state.columns[stageKey] ?? [];
      if (
        fromIndex < 0 ||
        fromIndex >= current.length ||
        toIndex < 0 ||
        toIndex >= current.length ||
        fromIndex === toIndex
      ) {
        return state;
      }
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return {
        columns: { ...state.columns, [stageKey]: next },
      };
    }),

  moveCardAcrossColumns: (fromStage, toStage, dealId, toIndex) =>
    set((state) => {
      const fromIds = state.columns[fromStage] ?? [];
      const index = fromIds.indexOf(dealId);
      if (index === -1) {
        // Not found in source column — no-op safely.
        return state;
      }

      const nextFromIds = [...fromIds.slice(0, index), ...fromIds.slice(index + 1)];

      const existingToIds =
        fromStage === toStage ? nextFromIds : state.columns[toStage] ?? [];
      const boundedIndex = Math.max(0, Math.min(toIndex, existingToIds.length));
      const nextToIds = [
        ...existingToIds.slice(0, boundedIndex),
        dealId,
        ...existingToIds.slice(boundedIndex),
      ];

      if (fromStage === toStage) {
        return {
          columns: { ...state.columns, [toStage]: nextToIds },
        };
      }

      return {
        columns: {
          ...state.columns,
          [fromStage]: nextFromIds,
          [toStage]: nextToIds,
        },
      };
    }),

  toggleCollapsed: (stageKey) =>
    set((state) => ({
      collapsedColumns: {
        ...state.collapsedColumns,
        [stageKey]: !state.collapsedColumns[stageKey],
      },
    })),
}));
