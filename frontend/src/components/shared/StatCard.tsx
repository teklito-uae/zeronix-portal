import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
  href?: string;
  className?: string;
}

export const StatCard = ({ title, value, subtitle, icon, iconBg, href, className }: StatCardProps) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => href && navigate(href)}
      className={cn(
        "bg-admin-surface border border-admin-border rounded-xl p-4 transition-all relative overflow-hidden", // Theme rule: Top border accent
        href && "cursor-pointer hover:border-zeronix-blue/30 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-2.5 rounded-lg flex items-center justify-center shrink-0",
          iconBg || "bg-zeronix-blue/10 text-zeronix-blue"
        )}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-admin-text-secondary uppercase tracking-wider">{title}</p>
          <h3 className="text-xl font-bold text-admin-text-primary mt-0.5 truncate">{value}</h3>
          {subtitle && <p className="text-[11px] text-admin-text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};
