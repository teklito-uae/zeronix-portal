import { cn } from '@/lib/utils';
import type { EnquiryStatus, EnquiryPriority, QuoteStatus, InvoiceStatus } from '@/types';

type StatusType = EnquiryStatus | EnquiryPriority | QuoteStatus | InvoiceStatus | string;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string; pulse?: boolean }> = {
  // Enquiry statuses
  new: { label: 'NEW', className: 'text-[#23F78C] bg-[#23F78C1F]' },
  assigned: { label: 'ASSIGNED', className: 'text-[#0F52BA] bg-[#0F52BA1F]' },
  in_progress: { label: 'IN PROGRESS', className: 'text-[#0F52BA] bg-[#0F52BA1F]' },
  quoted: { label: 'QUOTED', className: 'text-[#8B5CF6] bg-[#8B5CF61F]' },
  won: { label: 'WON', className: 'text-[#10B981] bg-[#10B9811F]' },
  lost: { label: 'LOST', className: 'text-[#EF4444] bg-[#EF44441F]' },
  closed: { label: 'CLOSED', className: 'text-admin-text-muted bg-admin-surface-hover' },

  // Lead statuses
  contacted: { label: 'CONTACTED', className: 'text-[#0F52BA] bg-[#0F52BA1F]' },
  qualified: { label: 'QUALIFIED', className: 'text-[#8B5CF6] bg-[#8B5CF61F]' },
  unresponsive: { label: 'UNRESPONSIVE', className: 'text-admin-text-muted bg-admin-surface-hover' },
  converted: { label: 'CONVERTED', className: 'text-[#10B981] bg-[#10B9811F]' },

  // Priorities
  normal: { label: 'NORMAL', className: 'text-admin-text-secondary bg-admin-surface-hover' },
  high: { label: 'HIGH', className: 'text-[#F59E0B] bg-[#F59E0B1F]' },
  urgent: { label: 'URGENT', className: 'text-[#F59E0B] bg-[#F59E0B1F]', pulse: true },

  // Quote statuses
  draft: { label: 'DRAFT', className: 'text-admin-text-muted bg-admin-surface-hover' },
  sent: { label: 'SENT', className: 'text-[#0F52BA] bg-[#0F52BA1F]' },
  accepted: { label: 'ACCEPTED', className: 'text-[#10B981] bg-[#10B9811F]' },
  rejected: { label: 'REJECTED', className: 'text-[#EF4444] bg-[#EF44441F]' },
  expired: { label: 'EXPIRED', className: 'text-admin-text-muted bg-admin-surface-hover' },
  invoiced: { label: 'INVOICED', className: 'text-[#10B981] bg-[#10B9811F]' },

  // Sales Order / Delivery statuses
  confirmed: { label: 'CONFIRMED', className: 'text-[#0F52BA] bg-[#0F52BA1F]' },
  processing: { label: 'PROCESSING', className: 'text-[#F59E0B] bg-[#F59E0B1F]' },
  completed: { label: 'COMPLETED', className: 'text-[#10B981] bg-[#10B9811F]' },
  pending: { label: 'PENDING', className: 'text-[#F59E0B] bg-[#F59E0B1F]' },
  delivered: { label: 'DELIVERED', className: 'text-[#10B981] bg-[#10B9811F]' },

  // Shared/Invoice statuses
  paid: { label: 'PAID', className: 'text-[#10B981] bg-[#10B9811F]' },
  partially_paid: { label: 'PARTIALLY PAID', className: 'text-[#6366F1] bg-[#6366F11F]' },
  posted: { label: 'POSTED', className: 'text-[#F59E0B] bg-[#F59E0B1F]' },
  overdue: { label: 'OVERDUE', className: 'text-[#EF4444] bg-[#EF44441F]' },
  cancelled: { label: 'CANCELLED', className: 'text-admin-text-muted bg-admin-surface-hover' },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = (status && statusConfig[status]) || {
    label: (status || 'UNKNOWN').toString().toUpperCase(),
    className: 'text-admin-text-secondary bg-admin-surface-hover',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide border-0',
        config.className,
        config.pulse && 'animate-pulse',
        className
      )}
    >
      {config.label}
    </span>
  );
};
