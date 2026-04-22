import { Skeleton } from "../ui/skeleton";

export const StatsSkeleton = ({ count = 4 }: { count?: number }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-admin-surface border border-admin-border rounded-brand p-5 h-[100px] flex flex-col justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64" />
      <div className="rounded-xl border border-admin-border bg-admin-surface overflow-hidden">
        <div className="h-11 border-b border-admin-border bg-admin-surface-hover px-4 flex items-center gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        <div className="divide-y divide-admin-border">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="h-14 px-4 flex items-center gap-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
