import { StatusBadge } from './StatusBadge';
import { CurrencyAmount } from './CurrencyAmount';
import type { CurrencyCode } from '@/lib/currency';
import { FileText, Calendar, CalendarClock } from 'lucide-react';

interface LinkedDocumentSummaryCardProps {
  /** 'Invoice' or 'Purchase Bill' */
  label: string;
  number?: string | null;
  date?: string | null;
  dueDate?: string | null;
  total: number;
  amountPaid: number;
  balance: number;
  status?: string | null;
  currency: CurrencyCode;
  onClick?: () => void;
  emptyMessage: string;
}

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : '—');

/**
 * "What this payment was applied against" — shown below the receipt itself
 * on the payment-receipt / supplier-payment-receipt detail views. Pulls the
 * linked Invoice/PurchaseBill's own totals (amount_paid/balance are computed
 * server-side across ALL receipts against that document, not just this one).
 */
export const LinkedDocumentSummaryCard = ({
  label,
  number,
  date,
  dueDate,
  total,
  amountPaid,
  balance,
  status,
  currency,
  onClick,
  emptyMessage,
}: LinkedDocumentSummaryCardProps) => {
  if (!number) {
    return (
      <div className="bg-brand-bg border border-brand-border rounded-lg p-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-subtle mb-1.5">{label} Details</p>
        <p className="text-[12px] text-brand-subtle italic">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-brand-bg border border-brand-border rounded-lg p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-subtle">
          {label} Applied To This Payment
        </p>
        {status && <StatusBadge status={status} />}
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-lg bg-brand-white border border-brand-border flex items-center justify-center text-brand-accent flex-shrink-0">
          <FileText size={17} />
        </div>
        {onClick ? (
          <button type="button" onClick={onClick} className="text-[15px] font-bold text-brand-accent hover:underline">
            {number}
          </button>
        ) : (
          <p className="text-[15px] font-bold text-brand-primary">{number}</p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1 flex items-center gap-1.5">
            <Calendar size={11} /> Date
          </p>
          <p className="text-[13px] font-medium text-brand-primary">{formatDate(date)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1 flex items-center gap-1.5">
            <CalendarClock size={11} /> Due Date
          </p>
          <p className="text-[13px] font-medium text-brand-primary">{formatDate(dueDate)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1">Total</p>
          <p className="text-[13px] font-semibold text-brand-primary font-mono">
            <CurrencyAmount amount={total} currency={currency} />
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1">Amount Paid</p>
          <p className="text-[13px] font-semibold text-emerald-600 font-mono">
            <CurrencyAmount amount={amountPaid} currency={currency} />
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-brand-border flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-brand-subtle">Balance Due</p>
        <p className={`text-lg font-bold font-mono ${balance > 0 ? 'text-danger' : 'text-emerald-600'}`}>
          <CurrencyAmount amount={balance} currency={currency} />
        </p>
      </div>
    </div>
  );
};
