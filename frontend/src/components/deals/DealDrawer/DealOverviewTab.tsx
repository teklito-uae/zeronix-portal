import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isPast } from 'date-fns';
import { toast } from 'sonner';
import api from '@/lib/axios';
import type { UseMutationResult } from '@tanstack/react-query';
import type { Deal, DealSource } from '@/types';
import type { ApiError } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/shared/Spinner';
import { CurrencyAmount } from '@/components/shared/CurrencyAmount';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { ArrowRightLeft, Building2 } from 'lucide-react';

const SOURCES: { id: DealSource; label: string }[] = [
  { id: 'manual', label: 'Manual' },
  { id: 'website', label: 'Website' },
  { id: 'email', label: 'Email' },
  { id: 'referral', label: 'Referral' },
  { id: 'import', label: 'Import' },
  { id: 'other', label: 'Other' },
];

const PROBABILITY_PRESETS = [10, 25, 50, 75, 90, 100];

const CLOSED_STAGES = ['won', 'lost', 'cancelled'];

const toDatetimeLocal = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toDateInput = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

interface DealOverviewTabProps {
  deal: Deal;
  updateDeal: UseMutationResult<Deal, unknown, { id: number | string; data: Record<string, unknown> }, unknown>;
}

/**
 * Overview tab: value / probability / forecast / expected close / source /
 * notes / next action, plus read-only lost/cancellation info once the deal
 * is closed that way. Lives here rather than in DealDrawer's header because
 * the header only owns the stage select itself (see DealDrawer.tsx).
 */
export const DealOverviewTab = ({ deal, updateDeal }: DealOverviewTabProps) => {
  const currency = useCurrencyStore((s) => s.currency);
  const queryClient = useQueryClient();

  const [value, setValue] = useState(String(deal.value ?? ''));
  const [expectedClose, setExpectedClose] = useState(toDateInput(deal.expected_close_date));
  const [source, setSource] = useState<DealSource>(deal.source);
  const [probabilityInput, setProbabilityInput] = useState(String(deal.probability ?? 0));
  const [notes, setNotes] = useState(deal.notes || '');
  const [nextActionAt, setNextActionAt] = useState(toDatetimeLocal(deal.next_action_at));
  const [nextActionNote, setNextActionNote] = useState(deal.next_action_note || '');

  // Re-sync local editable state whenever a fresh deal payload lands
  // (e.g. after any mutation invalidates ['deals', deal.id]).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: these are editable local fields (user types into them) seeded from the `deal` prop and resynced only when a new deal payload lands from the server; can't be computed via useMemo without wiping in-progress edits on every render.
    setValue(String(deal.value ?? ''));
    setExpectedClose(toDateInput(deal.expected_close_date));
    setSource(deal.source);
    setProbabilityInput(String(deal.probability ?? 0));
    setNotes(deal.notes || '');
    setNextActionAt(toDatetimeLocal(deal.next_action_at));
    setNextActionNote(deal.next_action_note || '');
  }, [deal]);

  // Not exposed via hooks/useDeals.ts (deal-only mutations there) — this is
  // a Lead resource action, mirrored verbatim from Deals.tsx's convertLead.
  const convertLead = useMutation({
    mutationFn: (leadId: number) => api.post(`/admin/leads/${leadId}/convert`),
    onSuccess: () => {
      toast.success('Lead converted to account');
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals', deal.id] });
    },
    onError: (e: ApiError) => toast.error(e.response?.data?.message || 'Failed to convert lead'),
  });

  const forecastValue = deal.forecast_value ?? (deal.value * (deal.probability || 0)) / 100;
  const nextActionOverdue =
    !!deal.next_action_at && isPast(new Date(deal.next_action_at)) && !CLOSED_STAGES.includes(deal.stage);

  const saveDetails = () => {
    updateDeal.mutate({
      id: deal.id,
      data: {
        value: value === '' ? undefined : Number(value),
        expected_close_date: expectedClose || undefined,
        source,
      },
    });
  };

  const saveProbability = (v: number) => {
    setProbabilityInput(String(v));
    updateDeal.mutate({ id: deal.id, data: { probability: v } });
  };

  const saveNextAction = () => {
    updateDeal.mutate({
      id: deal.id,
      data: { next_action_at: nextActionAt || undefined, next_action_note: nextActionNote || undefined },
    });
  };

  const saveNotes = () => {
    updateDeal.mutate({ id: deal.id, data: { notes } });
  };

  return (
    <div className="space-y-5">
      <div className="bg-brand-surface border border-brand-border/50 rounded-xl p-4">
        <p className="text-[12px] font-medium text-brand-subtle flex items-center gap-1.5">
          <Building2 size={12} />
          {deal.customer?.company || deal.customer?.name || deal.lead?.company || deal.lead?.name || 'Unlinked'}
        </p>
        <p className="text-[16px] font-bold text-brand-primary mt-1">
          <CurrencyAmount amount={deal.value} currency={currency} />
        </p>
      </div>

      {deal.lead_id && !deal.customer_id && (
        <Button
          onClick={() => convertLead.mutate(deal.lead_id!)}
          disabled={convertLead.isPending}
          className="w-full h-[38px] rounded-lg text-[13px] font-medium bg-brand-accent text-white hover:opacity-90"
        >
          {convertLead.isPending ? <Spinner size={14} className="mr-2" /> : <ArrowRightLeft size={14} className="mr-2" />}
          Convert Lead to Account
        </Button>
      )}

      {deal.stage === 'lost' && (
        <div className="p-3 bg-brand-danger-bg border border-brand-danger/20 rounded-lg space-y-1">
          <p className="text-[11px] font-semibold text-brand-secondary uppercase tracking-wide">Lost Reason</p>
          <p className="text-[13px] text-brand-primary capitalize">{deal.lost_reason?.replace(/_/g, ' ') || '—'}</p>
          {deal.lost_notes && <p className="text-[12px] text-brand-secondary whitespace-pre-wrap mt-1">{deal.lost_notes}</p>}
        </div>
      )}

      {deal.stage === 'cancelled' && (
        <div className="p-3 bg-brand-bg border border-brand-border rounded-lg space-y-1">
          <p className="text-[11px] font-semibold text-brand-secondary uppercase tracking-wide">Cancellation Reason</p>
          <p className="text-[13px] text-brand-primary whitespace-pre-wrap">{deal.cancellation_reason || '—'}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[12px] font-medium text-brand-secondary ml-1">Value ({currency})</Label>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            type="number"
            step="0.01"
            min="0"
            className="h-[38px] text-[13px] rounded-lg"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[12px] font-medium text-brand-secondary ml-1">Expected Close</Label>
          <Input
            value={expectedClose}
            onChange={(e) => setExpectedClose(e.target.value)}
            type="date"
            className="h-[38px] text-[13px] rounded-lg"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[12px] font-medium text-brand-secondary ml-1">Source</Label>
        <Select value={source} onValueChange={(v) => setSource(v as DealSource)}>
          <SelectTrigger className="h-[38px] text-[13px] rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOURCES.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        size="sm"
        onClick={saveDetails}
        disabled={updateDeal.isPending}
        className="h-[30px] text-[12px] rounded-lg"
      >
        {updateDeal.isPending ? <Spinner size={12} className="mr-1.5" /> : null} Save Details
      </Button>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-[12px] font-medium text-brand-secondary ml-1">Probability</Label>
          <span className="text-[12px] font-semibold text-brand-primary">
            Forecast: <CurrencyAmount amount={forecastValue} currency={currency} />
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PROBABILITY_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => saveProbability(p)}
              className={`px-3 h-[28px] rounded-full text-[12px] font-medium border transition-colors ${
                deal.probability === p
                  ? 'bg-brand-accent text-white border-brand-accent'
                  : 'bg-brand-surface text-brand-secondary border-brand-border/50 hover:bg-brand-accent-light'
              }`}
            >
              {p}%
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={probabilityInput}
            onChange={(e) => setProbabilityInput(e.target.value)}
            type="number"
            min={0}
            max={100}
            className="h-[32px] text-[12px] rounded-lg w-24"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={updateDeal.isPending}
            onClick={() => saveProbability(Math.max(0, Math.min(100, Number(probabilityInput) || 0)))}
            className="h-[32px] text-[12px] rounded-lg"
          >
            Set %
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Label className="text-[12px] font-medium text-brand-secondary ml-1">Next Action</Label>
          {nextActionOverdue && <span className="text-[10px] font-bold text-brand-danger">OVERDUE</span>}
        </div>
        <Input
          type="datetime-local"
          value={nextActionAt}
          onChange={(e) => setNextActionAt(e.target.value)}
          className="h-[38px] text-[13px] rounded-lg"
        />
        <Textarea
          value={nextActionNote}
          onChange={(e) => setNextActionNote(e.target.value)}
          placeholder="Next action note..."
          className="rounded-lg resize-none min-h-[60px] text-[13px]"
        />
        <Button
          type="button"
          size="sm"
          onClick={saveNextAction}
          disabled={updateDeal.isPending}
          className="h-[30px] text-[12px] rounded-lg"
        >
          {updateDeal.isPending ? <Spinner size={12} className="mr-1.5" /> : null} Save Next Action
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[12px] font-medium text-brand-secondary ml-1">Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-xl resize-none min-h-[90px] text-[13px]"
          placeholder="Internal notes about this deal..."
        />
        <Button
          type="button"
          size="sm"
          onClick={saveNotes}
          disabled={updateDeal.isPending}
          className="h-[30px] text-[12px] rounded-lg"
        >
          {updateDeal.isPending ? <Spinner size={12} className="mr-1.5" /> : null} Save Notes
        </Button>
      </div>

      {(deal.items?.length ?? 0) > 0 && (
        <div className="space-y-1.5">
          <Label className="text-[12px] font-medium text-brand-secondary ml-1">Items</Label>
          <div className="border border-brand-border/50 rounded-lg overflow-hidden">
            <table className="w-full text-[12px]">
              <thead className="bg-brand-surface text-brand-subtle">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Item</th>
                  <th className="text-right px-3 py-2 font-medium">Qty</th>
                  <th className="text-right px-3 py-2 font-medium">Unit Price</th>
                  <th className="text-right px-3 py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {deal.items!.map((it) => (
                  <tr key={it.id}>
                    <td className="px-3 py-2 text-brand-primary">{it.description || it.product?.name || '—'}</td>
                    <td className="px-3 py-2 text-right text-brand-secondary">{it.quantity}</td>
                    <td className="px-3 py-2 text-right text-brand-secondary">
                      <CurrencyAmount amount={it.unit_price} currency={currency} />
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-brand-primary">
                      <CurrencyAmount amount={it.total} currency={currency} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
