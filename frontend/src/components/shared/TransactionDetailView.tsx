import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { getBasePath } from '@/hooks/useBasePath';
import { useResourceDetail, useResourceMutation } from '@/hooks/useApi';
import { StatusBadge } from './StatusBadge';
import { DownloadButton } from './DownloadButton';
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
import api from '@/lib/axios';
import { Loader2, Send, Pencil, MoreHorizontal, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface TransactionDetailViewProps {
  type: TransactionType;
  id: string | number;
  /** Optional: parent wires the type-specific "send email" mutation (e.g. quote send). */
  onSend?: () => void;
  isSendPending?: boolean;
  /** Called after a successful delete so the parent can clear its selection. */
  onDeleted?: () => void;
}

/**
 * Read-only detail pane for the right column of a Zoho-Books-style
 * master-detail layout. Sibling to TransactionEditor (the always-editable
 * full-page form) but deliberately separate — no mutable form state here.
 */
export const TransactionDetailView = ({ type, id, onSend, isSendPending, onDeleted }: TransactionDetailViewProps) => {
  const config = TRANSACTION_CONFIGS[type];
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useResourceDetail<any>(config.apiBase, id);
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
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Conversion failed.');
    }
  };

  const handleDelete = () => {
    remove.mutate(id, { onSuccess: () => onDeleted?.() });
  };

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-zeronix-blue" size={32} />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-admin-text-muted">Loading…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-96 flex items-center justify-center">
        <p className="text-sm text-admin-text-muted">{config.label} not found.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold text-admin-text-primary tracking-tight">
            {config.label.toUpperCase()} {data[config.numberField] || `#${id}`}
          </h1>
          <StatusBadge status={data.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {config.pdf && (
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
              onClick={onSend}
              disabled={isSendPending}
              size="sm"
              variant="outline"
              className="rounded-xl h-9 px-4 font-medium text-sm border-admin-border"
            >
              {isSendPending ? <Loader2 className="animate-spin mr-2" size={15} /> : <Send size={15} className="mr-2" />}
              Send
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`${getBasePath()}/${config.listRoute}/${id}`)}
            className="rounded-xl h-9 px-4 font-medium text-sm border-admin-border"
          >
            <Pencil size={15} className="mr-2" /> Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 p-0 text-admin-text-muted hover:text-admin-text-primary rounded-xl">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 bg-admin-surface border-admin-border rounded-xl shadow-xl p-1">
              <DropdownMenuItem onClick={handleDelete} className="text-danger focus:text-danger rounded-lg cursor-pointer">
                <Trash2 size={14} className="mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Details card */}
      <div className="bg-admin-bg border border-admin-border rounded-lg p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-admin-text-muted mb-1">
            {config.label} Number
          </p>
          <p className="text-[13px] font-medium text-admin-text-primary">{data[config.numberField] || `#${id}`}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-admin-text-muted mb-1 flex items-center gap-1.5">
            <Calendar size={11} /> Date
          </p>
          <p className="text-[13px] font-medium text-admin-text-primary">
            {data.date ? new Date(data.date).toLocaleDateString() : '—'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-admin-text-muted mb-1">Status</p>
          <StatusBadge status={data.status} />
        </div>
        {config.dateFields.map((f) => (
          <div key={f.key}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-admin-text-muted mb-1 flex items-center gap-1.5">
              <Calendar size={11} /> {f.label}
            </p>
            <p className="text-[13px] font-medium text-admin-text-primary">
              {data[f.key] ? new Date(data[f.key]).toLocaleDateString() : '—'}
            </p>
          </div>
        ))}
      </div>

      {/* Party card */}
      {partyRelation && (
        <div className="bg-admin-bg border border-admin-border rounded-lg p-5 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-admin-text-muted mb-2">
            {config.party.label}
          </p>
          <p className="text-[13px] font-bold text-admin-text-primary">{partyRelation.name}</p>
          {partyRelation.company && (
            <p className="text-[12px] text-admin-text-secondary">{partyRelation.company}</p>
          )}
          {partyRelation.email && (
            <p className="text-[12px] text-admin-text-muted">{partyRelation.email}</p>
          )}
          {partyRelation.phone && (
            <p className="text-[12px] text-admin-text-muted">{partyRelation.phone}</p>
          )}
          {partyRelation.address && (
            <p className="text-[12px] text-admin-text-muted whitespace-pre-line">{partyRelation.address}</p>
          )}
        </div>
      )}

      {/* Items table */}
      <div className="bg-admin-bg border border-admin-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-admin-border hover:bg-transparent">
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-admin-text-muted w-10">#</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-admin-text-muted">Item</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-admin-text-muted text-right">Qty</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-admin-text-muted text-right">Price</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-admin-text-muted text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {normalizedItems.length === 0 && (
              <TableRow className="border-admin-border">
                <TableCell colSpan={5} className="text-center text-[12px] text-admin-text-muted py-6">
                  No line items.
                </TableCell>
              </TableRow>
            )}
            {normalizedItems.map((item: any, idx: number) => (
              <TableRow key={item.id ?? idx} className="border-admin-border">
                <TableCell className="text-[12px] text-admin-text-muted">{idx + 1}</TableCell>
                <TableCell className="text-[12px] text-admin-text-primary font-medium">
                  {item.description || item.product_name || '—'}
                </TableCell>
                <TableCell className="text-[12px] text-admin-text-secondary text-right">{item.quantity}</TableCell>
                <TableCell className="text-[12px] text-admin-text-secondary text-right">
                  {Number(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-[12px] text-admin-text-primary font-medium text-right">
                  {(Number(item.quantity) * Number(item.unit_price)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Totals summary */}
      <div className="flex justify-end">
        <div className="w-full max-w-xs bg-admin-bg border border-admin-border rounded-lg p-5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider text-admin-text-muted">Subtotal</p>
            <p className="text-[13px] font-medium text-admin-text-primary">
              {totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider text-admin-text-muted">VAT</p>
            <p className="text-[13px] font-medium text-admin-text-primary">
              {totals.vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-admin-border">
            <p className="text-[11px] font-bold uppercase tracking-wider text-admin-text-muted">Total</p>
            <p className="text-lg font-bold text-zeronix-blue font-mono">
              {totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}{' '}
              <span className="text-xs font-semibold text-admin-text-muted">AED</span>
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      {data.notes && (
        <div className="bg-admin-bg border border-admin-border rounded-lg p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-admin-text-muted mb-2">Notes</p>
          <p className="text-[12px] text-admin-text-secondary whitespace-pre-line">{data.notes}</p>
        </div>
      )}
    </div>
  );
};
