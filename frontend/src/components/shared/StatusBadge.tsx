import { cn, toTitleCase } from '@/lib/utils';
import type { DealStage, DealPriority, QuoteStatus, InvoiceStatus } from '@/types';

type StatusType = DealStage | DealPriority | QuoteStatus | InvoiceStatus | string;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string; pulse?: boolean }> = {
  // Deal stages
  new: { label: 'NEW', className: 'text-[#23F78C] bg-[#23F78C1F]' },
  assigned: { label: 'ASSIGNED', className: 'text-[#0F52BA] bg-[#0F52BA1F]' },
  in_progress: { label: 'IN PROGRESS', className: 'text-[#0F52BA] bg-[#0F52BA1F]' },
  requirement: { label: 'REQUIREMENT', className: 'text-[#0F52BA] bg-[#0F52BA1F]' },
  proposal_sent: { label: 'PROPOSAL SENT', className: 'text-[#8B5CF6] bg-[#8B5CF61F]' },
  negotiation: { label: 'NEGOTIATION', className: 'text-[#F59E0B] bg-[#F59E0B1F]' },
  quoted: { label: 'QUOTED', className: 'text-[#8B5CF6] bg-[#8B5CF61F]' },
  won: { label: 'WON', className: 'text-[#10B981] bg-[#10B9811F]' },
  lost: { label: 'LOST', className: 'text-[#EF4444] bg-[#EF44441F]' },
  closed: { label: 'CLOSED', className: 'text-brand-subtle bg-brand-bg' },

  // Lead statuses
  contacted: { label: 'CONTACTED', className: 'text-[#0F52BA] bg-[#0F52BA1F]' },
  qualified: { label: 'QUALIFIED', className: 'text-[#8B5CF6] bg-[#8B5CF61F]' },
  unresponsive: { label: 'UNRESPONSIVE', className: 'text-brand-subtle bg-brand-bg' },
  converted: { label: 'CONVERTED', className: 'text-[#10B981] bg-[#10B9811F]' },

  // Priorities
  normal: { label: 'NORMAL', className: 'text-brand-secondary bg-brand-bg' },
  high: { label: 'HIGH', className: 'text-[#F59E0B] bg-[#F59E0B1F]' },
  urgent: { label: 'URGENT', className: 'text-[#F59E0B] bg-[#F59E0B1F]', pulse: true },

  // Quote statuses
  draft: { label: 'DRAFT', className: 'text-brand-subtle bg-brand-bg' },
  sent: { label: 'SENT', className: 'text-[#0F52BA] bg-[#0F52BA1F]' },
  accepted: { label: 'ACCEPTED', className: 'text-[#10B981] bg-[#10B9811F]' },
  rejected: { label: 'REJECTED', className: 'text-[#EF4444] bg-[#EF44441F]' },
  expired: { label: 'EXPIRED', className: 'text-brand-subtle bg-brand-bg' },
  invoiced: { label: 'INVOICED', className: 'text-[#10B981] bg-[#10B9811F]' },
  approved: { label: 'APPROVED', className: 'text-[#10B981] bg-[#10B9811F]' },
  superseded: { label: 'SUPERSEDED', className: 'text-brand-subtle bg-brand-bg' },

  // Sales Order / Delivery statuses
  confirmed: { label: 'CONFIRMED', className: 'text-[#0F52BA] bg-[#0F52BA1F]' },
  processing: { label: 'PROCESSING', className: 'text-[#F59E0B] bg-[#F59E0B1F]' },
  completed: { label: 'COMPLETED', className: 'text-[#10B981] bg-[#10B9811F]' },
  pending: { label: 'PENDING', className: 'text-[#F59E0B] bg-[#F59E0B1F]' },
  delivered: { label: 'DELIVERED', className: 'text-[#10B981] bg-[#10B9811F]' },

  // Invoice payment_status (computed from receipts, shown alongside workflow status)
  paid: { label: 'PAID', className: 'text-[#10B981] bg-[#10B9811F]' },
  partially_paid: { label: 'PARTIALLY PAID', className: 'text-[#6366F1] bg-[#6366F11F]' },
  partial: { label: 'PARTIALLY PAID', className: 'text-[#6366F1] bg-[#6366F11F]' },
  unpaid: { label: 'UNPAID', className: 'text-brand-subtle bg-brand-bg' },
  overdue: { label: 'OVERDUE', className: 'text-[#EF4444] bg-[#EF44441F]' },

  // Invoice workflow status (on_hold; draft/sent/accepted/cancelled are shared with Quote above)
  on_hold: { label: 'ON HOLD', className: 'text-[#F59E0B] bg-[#F59E0B1F]' },
  cancelled: { label: 'CANCELLED', className: 'text-brand-subtle bg-brand-bg' },

  // Marketing campaign / message / SMTP statuses
  scheduled: { label: 'SCHEDULED', className: 'text-[#0F52BA] bg-[#0F52BA1F]' },
  sending: { label: 'SENDING', className: 'text-[#F59E0B] bg-[#F59E0B1F]', pulse: true },
  paused: { label: 'PAUSED', className: 'text-[#F59E0B] bg-[#F59E0B1F]' },
  queued: { label: 'QUEUED', className: 'text-[#0F52BA] bg-[#0F52BA1F]' },
  deferred: { label: 'DEFERRED', className: 'text-[#F59E0B] bg-[#F59E0B1F]' },
  failed: { label: 'FAILED', className: 'text-[#EF4444] bg-[#EF44441F]' },
  bounced: { label: 'BOUNCED', className: 'text-[#EF4444] bg-[#EF44441F]' },
  spam: { label: 'SPAM', className: 'text-[#EF4444] bg-[#EF44441F]' },
  skipped: { label: 'SKIPPED', className: 'text-brand-subtle bg-brand-bg' },
  unsubscribed: { label: 'UNSUBSCRIBED', className: 'text-brand-subtle bg-brand-bg' },
  healthy: { label: 'HEALTHY', className: 'text-[#10B981] bg-[#10B9811F]' },
  warning: { label: 'WARNING', className: 'text-[#F59E0B] bg-[#F59E0B1F]' },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = (status && statusConfig[status]) || {
    label: (status || 'UNKNOWN').toString().toUpperCase(),
    className: 'text-brand-secondary bg-brand-bg',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border-0',
        config.className,
        config.pulse && 'animate-pulse',
        className
      )}
    >
      {toTitleCase(config.label)}
    </span>
  );
};
