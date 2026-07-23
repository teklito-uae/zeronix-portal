import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
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
        "bg-brand-white border border-brand-border rounded-xl p-4 transition-all relative overflow-hidden flex flex-col gap-2 shadow-sm",
        href && "cursor-pointer hover:border-brand-accent/30 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-medium text-brand-secondary">{title}</h3>
        <div className={cn("text-brand-subtle", iconBg && "h-8 w-8 rounded-lg flex items-center justify-center", iconBg)}>{icon}</div>
      </div>
      <div>
        <p className="text-[24px] font-semibold text-brand-primary leading-tight tracking-tight">{value}</p>
        {subtitle && <p className="text-[12px] font-normal text-brand-subtle mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};
