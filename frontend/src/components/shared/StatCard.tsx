import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard = ({ title, value, icon, className }: StatCardProps) => {
  return (
    <div className={cn(
      "bg-admin-surface border border-admin-border rounded-brand p-3 md:p-5 shadow-sm border-t-2 border-t-zeronix-blue",
      className
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] md:text-sm text-admin-text-secondary mb-0.5 md:mb-1">{title}</p>
          <h3 className="text-xl md:text-2xl font-bold text-admin-text-primary">{value}</h3>
        </div>
        {icon && <div className="p-1.5 md:p-2 rounded-brand bg-zeronix-green-dim text-zeronix-green scale-90 md:scale-100">{icon}</div>}
      </div>
    </div>
  );
};
