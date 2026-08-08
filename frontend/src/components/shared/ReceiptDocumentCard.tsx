import { Avatar } from './Avatar';
import { CurrencyAmount } from './CurrencyAmount';
import { Badge } from '@/components/ui/badge';
import type { CurrencyCode } from '@/lib/currency';
import { CheckCircle2, Receipt, Calendar, Wallet, Hash, Link2, StickyNote, Building2, Mail, Phone } from 'lucide-react';

interface LinkedDocument {
  label: string;
  number: string;
  onClick?: () => void;
}

interface ReceiptDocumentCardProps {
  /** 'received' for money coming in (customer receipts), 'paid' for money going out (supplier receipts). */
  kind: 'received' | 'paid';
  receiptNumber: string;
  amount: number;
  currency: CurrencyCode;
  partyLabel: string;
  partyName?: string | null;
  partyCompany?: string | null;
  partyEmail?: string | null;
  partyPhone?: string | null;
  paymentDate?: string | null;
  paymentMethod?: string | null;
  referenceId?: string | null;
  linkedDocument?: LinkedDocument | null;
  notes?: string | null;
  /** Fill the available detail-pane width instead of capping out as a centered card. */
  fullWidth?: boolean;
}

/**
 * A designed, in-app "receipt" visual — replaces embedding the raw generated
 * PDF (which rendered inside the browser's native PDF viewer chrome: dark
 * background, a blob: UUID as the title, tiny default zoom). The real PDF is
 * still one click away via the View PDF / Download actions; this is what a
 * user actually looks at when scanning a receipt in the app.
 */
export const ReceiptDocumentCard = ({
  kind,
  receiptNumber,
  amount,
  currency,
  partyLabel,
  partyName,
  partyCompany,
  partyEmail,
  partyPhone,
  paymentDate,
  paymentMethod,
  referenceId,
  linkedDocument,
  notes,
  fullWidth = false,
}: ReceiptDocumentCardProps) => {
  const amountLabel = kind === 'received' ? 'Amount Received' : 'Amount Paid';
  const statusLabel = kind === 'received' ? 'Payment Received' : 'Payment Sent';

  return (
    <div className={fullWidth ? 'w-full' : 'w-full max-w-2xl mx-auto'}>
      <div className="relative rounded-2xl border border-brand-border bg-brand-white shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-brand-accent to-brand-accent/40" />

        <div className="p-6 md:p-8 space-y-7">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent flex-shrink-0">
                <Receipt size={20} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-subtle">
                  Payment Receipt
                </p>
                <p className="text-base font-bold text-brand-primary font-mono">{receiptNumber}</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
              <CheckCircle2 size={13} />
              <span className="text-[11px] font-semibold">{statusLabel}</span>
            </div>
          </div>

          {/* Amount hero */}
          <div className="text-center py-6 border-y border-dashed border-brand-border">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-subtle mb-2">
              {amountLabel}
            </p>
            <p className="text-4xl font-bold text-brand-primary font-mono tracking-tight">
              <CurrencyAmount amount={amount} currency={currency} size={26} />
            </p>
          </div>

          {/* Party + meta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-subtle mb-3">
                {partyLabel}
              </p>
              <div className="flex items-start gap-3">
                <Avatar name={partyCompany || partyName} className="w-10 h-10 text-[12px] mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-brand-primary truncate">{partyName || '—'}</p>
                  {partyCompany && (
                    <p className="text-[12px] text-brand-secondary flex items-center gap-1 truncate mt-0.5">
                      <Building2 size={11} /> {partyCompany}
                    </p>
                  )}
                  {partyEmail && (
                    <p className="text-[12px] text-brand-subtle flex items-center gap-1 truncate mt-1">
                      <Mail size={11} /> {partyEmail}
                    </p>
                  )}
                  {partyPhone && (
                    <p className="text-[12px] text-brand-subtle flex items-center gap-1 truncate mt-0.5">
                      <Phone size={11} /> {partyPhone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-brand-subtle flex items-center gap-1.5">
                  <Calendar size={12} /> Payment Date
                </p>
                <p className="text-[12px] font-medium text-brand-primary">
                  {paymentDate ? new Date(paymentDate).toLocaleDateString() : '—'}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-brand-subtle flex items-center gap-1.5">
                  <Wallet size={12} /> Method
                </p>
                <p className="text-[12px] font-medium text-brand-primary capitalize">{paymentMethod || '—'}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-brand-subtle flex items-center gap-1.5">
                  <Hash size={12} /> Reference
                </p>
                <p className="text-[12px] font-medium text-brand-primary">{referenceId || '—'}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-brand-subtle flex items-center gap-1.5">
                  <Link2 size={12} /> {linkedDocument?.label || 'Linked Document'}
                </p>
                {linkedDocument ? (
                  linkedDocument.onClick ? (
                    <button
                      type="button"
                      onClick={linkedDocument.onClick}
                      className="text-[12px] font-medium text-brand-accent hover:underline"
                    >
                      {linkedDocument.number}
                    </button>
                  ) : (
                    <p className="text-[12px] font-medium text-brand-accent">{linkedDocument.number}</p>
                  )
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-brand-surface text-brand-subtle border border-brand-border/50 text-[10px] font-medium px-2 py-0.5"
                  >
                    Advance / Unlinked
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {notes && (
            <div className="bg-brand-bg border border-brand-border rounded-lg p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-subtle mb-1.5 flex items-center gap-1.5">
                <StickyNote size={11} /> Notes
              </p>
              <p className="text-[12px] text-brand-secondary whitespace-pre-line">{notes}</p>
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-brand-border px-6 md:px-8 py-3.5 flex items-center justify-between text-[11px] text-brand-subtle">
          <span>Generated by Zeronix Portal</span>
          <span className="font-mono">{receiptNumber}</span>
        </div>
      </div>
    </div>
  );
};
