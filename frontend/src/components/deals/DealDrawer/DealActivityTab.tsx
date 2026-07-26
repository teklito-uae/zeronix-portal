import { useState } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import { useTimeline } from '@/hooks/useDeals';
import type { DealActivity, ActivityLogEntry } from '@/types';
import { ActivityTimeline } from '@/components/shared/quote-invoice/ActivityTimeline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/shared/Spinner';
import { ListTodo, CalendarClock, StickyNote, Mail, Phone } from 'lucide-react';

const ACTIVITY_TYPES: { id: DealActivity['type']; label: string; icon: typeof ListTodo }[] = [
  { id: 'task', label: 'Task', icon: ListTodo },
  { id: 'meeting', label: 'Meeting', icon: CalendarClock },
  { id: 'note', label: 'Note', icon: StickyNote },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'call', label: 'Call', icon: Phone },
];

interface DealActivityTabProps {
  dealId: number;
  addActivity: UseMutationResult<
    DealActivity,
    unknown,
    { id: number | string; type: DealActivity['type']; notes?: string; due_date?: string },
    unknown
  >;
}

/**
 * Activity feed for a deal. Backed by `useTimeline` (the merged
 * system+manual event feed powering Deals.tsx's old "Timeline" tab), fed
 * into the shared `ActivityTimeline` component — which expects
 * `ActivityLogEntry[]` (quote/invoice audit-log shape: `action`/`description`
 * /`created_at`). The deal timeline endpoint returns a slightly different
 * shape (`type`/`description`/`at`), so entries are adapted inline rather
 * than hand-rolling a second timeline renderer.
 */
export const DealActivityTab = ({ dealId, addActivity }: DealActivityTabProps) => {
  const { data: timeline = [], isLoading } = useTimeline(dealId);
  const [activeType, setActiveType] = useState<DealActivity['type'] | null>(null);
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');

  const reset = () => {
    setActiveType(null);
    setNotes('');
    setDueDate('');
  };

  const handleLogActivity = () => {
    if (!activeType) return;
    addActivity.mutate(
      {
        id: dealId,
        type: activeType,
        notes: notes || undefined,
        due_date: activeType === 'task' && dueDate ? dueDate : undefined,
      },
      { onSuccess: reset }
    );
  };

  const adaptedEntries: ActivityLogEntry[] = timeline.map((ev, idx) => ({
    id: idx,
    action: ev.type,
    description: ev.description,
    created_at: ev.at,
    user: ev.user as ActivityLogEntry['user'],
  }));

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-[12px] font-medium text-brand-secondary ml-1">Log Activity</Label>
        <div className="flex flex-wrap gap-1.5">
          {ACTIVITY_TYPES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveType((prev) => (prev === id ? null : id))}
              className={`flex items-center gap-1.5 px-3 h-[30px] rounded-full text-[12px] font-medium border transition-colors ${
                activeType === id
                  ? 'bg-brand-accent text-white border-brand-accent'
                  : 'bg-brand-surface text-brand-secondary border-brand-border/50 hover:bg-brand-accent-light'
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {activeType && (
          <div className="p-3 bg-brand-surface border border-brand-border/50 rounded-xl space-y-2">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={`Add ${activeType} notes...`}
              className="rounded-lg resize-none min-h-[60px] text-[13px]"
            />
            {activeType === 'task' && (
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-[34px] text-[13px] rounded-lg w-auto"
              />
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={reset} className="h-[30px] text-[12px] rounded-lg">
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleLogActivity}
                disabled={addActivity.isPending}
                className="h-[30px] text-[12px] rounded-lg"
              >
                {addActivity.isPending ? <Spinner size={12} className="mr-1.5" /> : null} Save
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="border border-brand-border/50 rounded-xl">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner size={20} />
          </div>
        ) : (
          <ActivityTimeline activities={adaptedEntries} />
        )}
      </div>
    </div>
  );
};
