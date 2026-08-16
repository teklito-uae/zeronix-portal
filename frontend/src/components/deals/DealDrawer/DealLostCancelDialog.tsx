import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DealLostReason } from '@/types';
import { LOST_REASONS } from './DealLostCancelDialog.config';

export interface DealLostCancelReason {
  lost_reason?: DealLostReason;
  lost_notes?: string;
  cancellation_reason?: string;
}

interface DealLostCancelDialogProps {
  open: boolean;
  targetStage: 'lost' | 'cancelled';
  onConfirm: (reason: DealLostCancelReason) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

/**
 * Standalone, fully controlled dialog shown before a deal is moved into
 * `lost` or `cancelled`. Used by DealDrawer's own stage-select flow, and
 * designed to be reused as-is by the Kanban drag-drop flow (a separate,
 * parallel work stream) — all state lives in props/callbacks, nothing is
 * coupled to drawer-only state or stores.
 */
export const DealLostCancelDialog = ({
  open,
  targetStage,
  onConfirm,
  onCancel,
  isSubmitting,
}: DealLostCancelDialogProps) => {
  const [lostReason, setLostReason] = useState<DealLostReason | ''>('');
  const [lostNotes, setLostNotes] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: resets the form fields each time this persistent dialog instance is reopened; the component doesn't unmount between opens, so there's no other lifecycle hook to reset on.
      setLostReason('');
      setLostNotes('');
      setCancellationReason('');
    }
  }, [open, targetStage]);

  const isLost = targetStage === 'lost';
  const canConfirm = isLost ? !!lostReason : cancellationReason.trim().length > 0;

  const handleConfirm = () => {
    if (!canConfirm) return;
    if (isLost) {
      onConfirm({ lost_reason: lostReason as DealLostReason, lost_notes: lostNotes || undefined });
    } else {
      onConfirm({ cancellation_reason: cancellationReason.trim() });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onCancel(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isLost ? 'Mark Deal as Lost' : 'Cancel Deal'}</DialogTitle>
          <DialogDescription>
            {isLost
              ? 'A lost reason is required before this deal can move to Lost.'
              : 'A cancellation reason is required before this deal can be cancelled.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {isLost ? (
            <>
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-brand-secondary">Lost Reason *</Label>
                <Select value={lostReason} onValueChange={(v) => setLostReason(v as DealLostReason)}>
                  <SelectTrigger className="h-[38px] text-[13px] rounded-lg">
                    <SelectValue placeholder="Select a reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    {LOST_REASONS.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-brand-secondary">Notes</Label>
                <Textarea
                  value={lostNotes}
                  onChange={(e) => setLostNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="rounded-lg resize-none min-h-[80px] text-[13px]"
                />
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-brand-secondary">Cancellation Reason *</Label>
              <Textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Why is this deal being cancelled?"
                className="rounded-lg resize-none min-h-[80px] text-[13px]"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel} className="rounded-lg text-[13px]">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || isSubmitting}
            className="rounded-lg text-[13px]"
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
