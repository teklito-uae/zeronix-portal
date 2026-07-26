/**
 * Loading placeholder shown while a column's first page is in flight.
 * Roughly matches DealCard's rounded-2xl / padding / height footprint.
 */
export const KanbanColumnSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="flex flex-col gap-2.5 p-2.5">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="animate-pulse rounded-2xl border border-brand-border/50 bg-brand-surface p-3.5 space-y-3"
        style={{ height: 176 }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="h-6 w-6 rounded-full bg-brand-border/60 shrink-0" />
          <div className="h-3 w-16 rounded bg-brand-border/60" />
        </div>
        <div className="h-3 w-3/4 rounded bg-brand-border/60" />
        <div className="h-4 w-1/2 rounded bg-brand-border/60" />
        <div className="flex gap-1.5">
          <div className="h-4 w-10 rounded-full bg-brand-border/50" />
          <div className="h-4 w-10 rounded-full bg-brand-border/50" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="h-3 w-20 rounded bg-brand-border/50" />
          <div className="h-3 w-14 rounded bg-brand-border/50" />
        </div>
      </div>
    ))}
  </div>
);
