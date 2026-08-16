import type { DealLostReason } from '@/types';

export const LOST_REASONS: { id: DealLostReason; label: string }[] = [
  { id: 'price', label: 'Price' },
  { id: 'competitor', label: 'Lost to Competitor' },
  { id: 'no_budget', label: 'No Budget' },
  { id: 'requirements_changed', label: 'Requirements Changed' },
  { id: 'customer_cancelled', label: 'Customer Cancelled' },
  { id: 'no_response', label: 'No Response' },
  { id: 'duplicate', label: 'Duplicate' },
  { id: 'other', label: 'Other' },
];
