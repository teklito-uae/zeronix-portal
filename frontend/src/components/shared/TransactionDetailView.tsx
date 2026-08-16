import { useMemo, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { getBasePath } from '@/hooks/useBasePath';
import { useResourceDetail, useResourceMutation } from '@/hooks/useApi';
import { StatusBadge } from './StatusBadge';
import { DownloadButton } from './DownloadButton';
import { ReceiptDocumentCard } from './ReceiptDocumentCard';
import { LinkedDocumentSummaryCard } from './LinkedDocumentSummaryCard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { TRANSACTION_CONFIGS, type TransactionType, type TransactionConversionConfig } from '@/lib/transactionTypes';
import { computeDocTotals, normalizeLineItems } from '@/lib/lineItemMath';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { CurrencyAmount } from '@/components/shared/CurrencyAmount';
import api from '@/lib/axios';
import type { AxiosError } from 'axios';
import { Loader2, Send, Pencil, MoreHorizontal, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface TransactionDetailViewProps {
  type: TransactionType;
  id: string | number;
  /** Optional: parent wires the type-specific "send email" mutation (e.g. quote send). Receives the record's real numeric id. */
  onSend?: (recordId: number | string) => void;
  isSendPending?: boolean;
  /** Called after a successful delete so the parent can clear its selection. */
  onDeleted?: () => void;
}

interface TransactionPartyInfo {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface TransactionInvoiceSummary {
  id: number;
  invoice_number?: string;
  date?: string;
  due_date?: string;
  total?: number;
  amount_paid?: number;
  balance?: number;
  payment_status?: string;
}

interface TransactionLineItem {
  id?: number;
  description?: string;
  product_name?: string;
  quantity: number | string;
  unit_price: number | string;
  tax_percent?: number | string;
  total?: number | string;
}

/**
 * This view renders six different transaction types (quote/invoice/sales
 * order/purchase bill/delivery/payment receipt) through one config-driven
 * template, including access via dynamic keys (`config.numberField`,
 * `dateFields[].key`). The record shape is genuinely polymorphic across
 * those types, so this captures the fields actually read here; anything
 * accessed via a non-literal dynamic key resolves to `unknown` and is
 * narrowed at the point of use.
 */
type TransactionRecord = {
  id: number;
  status?: string;
  date?: string;
  notes?: string | null;
  receipt_number?: string;
  amount?: number | string;
  payment_date?: string;
  payment_method?: string;
  reference_id?: string;
  invoice?: TransactionInvoiceSummary | null;
  items?: TransactionLineItem[];
  customer?: TransactionPartyInfo;
  supplier?: TransactionPartyInfo;
} & Record<string, unknown>;

/**
 * Read-only detail pane for the right column of a Zoho-Books-style
 * master-detail layout. Sibling to TransactionEditor (the always-editable
 * full-page form) but deliberately separate — no mutable form state here.
 */
export const TransactionDetailView = ({ type, id, onSend, isSendPending, onDeleted }: TransactionDetailViewProps) => {
  const config = TRANSACTION_CONFIGS[type];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currency = useCurrencyStore((s) => s.currency);

  const { data, isLoading } = useResourceDetail<TransactionRecord>(config.apiBase, id);
  const { remove } = useResourceMutation(config.apiBase);

  const normalizedItems = useMemo(() => normalizeLineItems(data?.items || []), [data]);
  const totals = useMemo(() => computeDocTotals(normalizedItems), [normalizedItems]);

  const eligibleConversions = data ? (config.conversions || []).filter((c) => c.isEligible(data)) : [];
  const partyRelation = data?.[config.party.kind];

  const handleConvert = async (conversion: TransactionConversionConfig) => {
    if (!data?.id) return;
    try {
      const payload = conversion.buildPayload ? conversion.buildPayload(data, normalizedItems) : undefined;
      const res = await api.post(conversion.endpoint(data.id), payload);
      toast.success(`${conversion.label} succeeded.`);
      config.invalidateQueries.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      navigate(`${getBasePath()}${conversion.resultRoute(res.data)}`);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      toast.error(axiosErr.response?.data?.message || 'Conversion failed.');
    }
  };

  const handleDelete = () => {
    remove.mutate(id, { onSuccess: () => onDeleted?.() });
  };

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-brand-accent" size={32} />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle">Loading…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-96 flex items-center justify-center">
        <p className="text-sm text-brand-subtle">{config.label} not found.</p>
      </div>
    );
  }

  // `numberField` and each `dateFields[].key` are plain `string`s (not a
  // literal union), so indexing `data` with them resolves to `unknown` —
  // narrow here rather than at each render site.
  const numberFieldValue = data[config.numberField];
  const displayNumber = typeof numberFieldValue === 'string' || typeof numberFieldValue === 'number' ? numberFieldValue : undefined;

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold text-brand-primary tracking-tight">
            {config.label.toUpperCase()} {displayNumber || `#${id}`}
          </h1>
          {type !== 'payment-receipt' && <StatusBadge status={data.status || ''} />}
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {config.pdf && type === 'payment-receipt' && (
            <>
              <DownloadButton id={data.id} type="payment-receipt" mode="view" variant="outline" label="View PDF" />
              <DownloadButton id={data.id} type="payment-receipt" mode="download" variant="outline" label="Download" />
            </>
          )}
          {config.pdf && type !== 'payment-receipt' && (
            <DownloadButton id={id} type={type as 'quote' | 'invoice'} mode="view" variant="outline" label="View PDF" />
          )}
          {eligibleConversions.map((conversion) => (
            <Button
              key={conversion.label}
              onClick={() => handleConvert(conversion)}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 px-4 font-bold text-[11px] uppercase tracking-wider shadow-lg shadow-emerald-600/10"
            >
              <conversion.icon size={15} className="mr-2" /> {conversion.label}
            </Button>
          ))}
          {onSend && (
            <Button
              onClick={() => onSend(data.id)}
              disabled={isSendPending}
              size="sm"
              variant="outline"
              className="rounded-xl h-9 px-4 font-medium text-sm border-brand-border"
            >
              {isSendPending ? <Loader2 className="animate-spin mr-2" size={15} /> : <Send size={15} className="mr-2" />}
              Send
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`${getBasePath()}/${config.listRoute}/${id}`)}
            className="rounded-xl h-9 px-4 font-medium text-sm border-brand-border"
          >
            <Pencil size={15} className="mr-2" /> Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 p-0 text-brand-subtle hover:text-brand-primary rounded-xl">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 bg-brand-white border-brand-border rounded-xl shadow-xl p-1">
              <DropdownMenuItem onClick={handleDelete} className="text-danger focus:text-danger rounded-lg cursor-pointer">
                <Trash2 size={14} className="mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {type === 'payment-receipt' ? (
        <div className="space-y-5">
          <ReceiptDocumentCard
            fullWidth
            kind="received"
            receiptNumber={data.receipt_number || `#${id}`}
            amount={Number(data.amount || 0)}
            currency={currency}
            partyLabel={config.party.label}
            partyName={partyRelation?.name}
            partyCompany={partyRelation?.company}
            partyEmail={partyRelation?.email}
            partyPhone={partyRelation?.phone}
            paymentDate={data.payment_date}
            paymentMethod={data.payment_method}
            referenceId={data.reference_id}
            linkedDocument={data.invoice ? { label: 'Invoice', number: data.invoice.invoice_number || '' } : null}
            notes={data.notes}
          />

          <LinkedDocumentSummaryCard
            label="Invoice"
            number={data.invoice?.invoice_number}
            date={data.invoice?.date}
            dueDate={data.invoice?.due_date}
            total={Number(data.invoice?.total || 0)}
            amountPaid={Number(data.invoice?.amount_paid || 0)}
            balance={Number(data.invoice?.balance || 0)}
            status={data.invoice?.payment_status}
            currency={currency}
            onClick={data.invoice ? () => navigate(`${getBasePath()}/invoices/${data.invoice!.id}`) : undefined}
            emptyMessage="This payment isn't linked to an invoice — recorded as an account payment."
          />
        </div>
      ) : (
        <Fragment>
          {/* Details card */}
          <div className="bg-brand-bg border border-brand-border rounded-lg p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1">
                {config.label} Number
              </p>
              <p className="text-[13px] font-medium text-brand-primary">{displayNumber || `#${id}`}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1 flex items-center gap-1.5">
                <Calendar size={11} /> Date
              </p>
              <p className="text-[13px] font-medium text-brand-primary">
                {data.date ? new Date(data.date).toLocaleDateString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1">Status</p>
              <StatusBadge status={data.status || ''} />
            </div>
            {config.dateFields.map((f) => {
              const fieldValue = data[f.key];
              const dateStr = typeof fieldValue === 'string' ? fieldValue : undefined;
              return (
                <div key={f.key}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-1 flex items-center gap-1.5">
                    <Calendar size={11} /> {f.label}
                  </p>
                  <p className="text-[13px] font-medium text-brand-primary">
                    {dateStr ? new Date(dateStr).toLocaleDateString() : '—'}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Party card */}
          {partyRelation && (
            <div className="bg-brand-bg border border-brand-border rounded-lg p-5 space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-2">
                {config.party.label}
              </p>
              <p className="text-[13px] font-bold text-brand-primary">{partyRelation.name}</p>
              {partyRelation.company && (
                <p className="text-[12px] text-brand-secondary">{partyRelation.company}</p>
              )}
              {partyRelation.email && (
                <p className="text-[12px] text-brand-subtle">{partyRelation.email}</p>
              )}
              {partyRelation.phone && (
                <p className="text-[12px] text-brand-subtle">{partyRelation.phone}</p>
              )}
              {partyRelation.address && (
                <p className="text-[12px] text-brand-subtle whitespace-pre-line">{partyRelation.address}</p>
              )}
            </div>
          )}

          {/* Items table */}
          <div className="bg-brand-bg border border-brand-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-brand-border hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle w-10">#</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle">Item</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle text-right">Qty</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle text-right">Price</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {normalizedItems.length === 0 && (
                  <TableRow className="border-brand-border">
                    <TableCell colSpan={5} className="text-center text-[12px] text-brand-subtle py-6">
                      No line items.
                    </TableCell>
                  </TableRow>
                )}
                {(data.items || []).map((item, idx) => (
                  <TableRow key={item.id ?? idx} className="border-brand-border">
                    <TableCell className="text-[12px] text-brand-subtle">{idx + 1}</TableCell>
                    <TableCell className="text-[12px] text-brand-primary font-medium">
                      {item.description || item.product_name || '—'}
                    </TableCell>
                    <TableCell className="text-[12px] text-brand-secondary text-right">{item.quantity}</TableCell>
                    <TableCell className="text-[12px] text-brand-secondary text-right">
                      {Number(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-[12px] text-brand-primary font-medium text-right">
                      {(Number(item.quantity) * Number(item.unit_price)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Totals summary */}
          <div className="flex justify-end">
            <div className="w-full max-w-xs bg-brand-bg border border-brand-border rounded-lg p-5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-wider text-brand-subtle">Subtotal</p>
                <p className="text-[13px] font-medium text-brand-primary">
                  {totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-wider text-brand-subtle">VAT</p>
                <p className="text-[13px] font-medium text-brand-primary">
                  {totals.vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-brand-border">
                <p className="text-[11px] font-bold uppercase tracking-wider text-brand-subtle">Total</p>
                <p className="text-lg font-bold text-brand-accent font-mono">
                  <CurrencyAmount amount={totals.total} currency={currency} />
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {data.notes && (
            <div className="bg-brand-bg border border-brand-border rounded-lg p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle mb-2">Notes</p>
              <p className="text-[12px] text-brand-secondary whitespace-pre-line">{data.notes}</p>
            </div>
          )}
        </Fragment>
      )}
    </div>
  );
};
