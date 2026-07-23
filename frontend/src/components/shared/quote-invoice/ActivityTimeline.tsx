import { formatDistanceToNow } from 'date-fns';
import { FilePlus2, Pencil, Send, CheckCircle2, XCircle, Copy, Trash2, Clock } from 'lucide-react';
import type { ActivityLogEntry } from '@/types';

interface ActivityTimelineProps {
  activities?: ActivityLogEntry[] | null;
}

const iconFor = (action: string) => {
  const a = action.toLowerCase();
  if (a.includes('creat')) return FilePlus2;
  if (a.includes('sent') || a.includes('email')) return Send;
  if (a.includes('accept') || a.includes('paid') || a.includes('post')) return CheckCircle2;
  if (a.includes('reject') || a.includes('cancel')) return XCircle;
  if (a.includes('duplicate')) return Copy;
  if (a.includes('delete')) return Trash2;
  if (a.includes('update') || a.includes('edit')) return Pencil;
  return Clock;
};

/**
 * Vertical activity feed for the doc's `activities` relation. Present on
 * Quote responses today; Invoice responses gain it once the backend agent's
 * parallel changes land — coded defensively in the meantime.
 */
export const ActivityTimeline = ({ activities }: ActivityTimelineProps) => {
  const list = activities ?? [];

  return (
    <div className="p-4">
      <p className="text-[13px] font-semibold text-brand-primary mb-3">Activity</p>
      {list.length === 0 ? (
        <p className="text-[12px] text-brand-subtle italic">No activity recorded yet.</p>
      ) : (
        <ul className="space-y-0">
          {list.map((activity, idx) => {
            const Icon = iconFor(activity.action || '');
            const actor = activity.user?.name ?? activity.customer?.name;
            return (
              <li key={activity.id} className="flex gap-3 pb-4 last:pb-0">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="h-6 w-6 rounded-full bg-brand-accent-light text-brand-accent flex items-center justify-center">
                    <Icon size={12} />
                  </div>
                  {idx < list.length - 1 && <div className="w-px flex-1 bg-brand-border mt-1" />}
                </div>
                <div className="min-w-0 pb-1">
                  <p className="text-[12px] text-brand-primary">{activity.description}</p>
                  <p className="text-[11px] text-brand-subtle mt-0.5">
                    {actor ? `${actor} · ` : ''}
                    {activity.created_at ? formatDistanceToNow(new Date(activity.created_at), { addSuffix: true }) : '—'}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
