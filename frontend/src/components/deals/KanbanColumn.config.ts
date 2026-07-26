import type { DealStage } from '@/types';

export interface KanbanColumnConfig {
  key: string;
  label: string;
  /** Value(s) sent as the `stage` query filter when fetching this column's deals. */
  stageFilter: DealStage | DealStage[];
  /** Stage written to the backend when a deal is dropped into this column. */
  writeStage: DealStage;
}

/**
 * Single source of truth for the 7 Kanban UI columns mapped onto the 8 real
 * backend `DealStage` values. The "Lost" column reads both `lost` and
 * `cancelled` deals (so a deliberately-cancelled deal still shows up here,
 * flagged with a small "Cancelled" sub-badge) but dropping a card onto this
 * column always writes `lost` — cancelling is a separate, deliberate action
 * that lives in the deal drawer, not something drag-and-drop should produce.
 */
export const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  { key: 'new', label: 'New', stageFilter: 'new', writeStage: 'new' },
  { key: 'qualified', label: 'Qualified', stageFilter: 'qualified', writeStage: 'qualified' },
  { key: 'requirement', label: 'Requirement', stageFilter: 'requirement', writeStage: 'requirement' },
  { key: 'proposal_sent', label: 'Proposal', stageFilter: 'proposal_sent', writeStage: 'proposal_sent' },
  { key: 'negotiation', label: 'Negotiation', stageFilter: 'negotiation', writeStage: 'negotiation' },
  { key: 'won', label: 'Won', stageFilter: 'won', writeStage: 'won' },
  { key: 'lost', label: 'Lost', stageFilter: ['lost', 'cancelled'], writeStage: 'lost' },
];
