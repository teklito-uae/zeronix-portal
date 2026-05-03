import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const Logo = ({ className, size = 'md', showText = true }: LogoProps) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl',
  };

  const textSizes = {
    sm: 'text-[14px]',
    md: 'text-[22px]',
    lg: 'text-[32px]',
    xl: 'text-[48px]',
  };

  return (
    <div className={cn(
      "flex items-center font-bold transition-all duration-300 ease-in-out",
      sizeClasses[size],
      className
    )}>
      <div className="relative flex items-center justify-center">
        <span className="text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]">Z</span>
      </div>
      {showText && (
        <div className="flex items-baseline ml-1 animate-in fade-in slide-in-from-left-2 duration-700">
          <span className={cn(
            "text-slate-950 dark:text-white font-bold uppercase tracking-[-0.02em]",
            textSizes[size]
          )}>
            eronix
          </span>
          <span className={cn(
            "bg-emerald-500 rounded-full animate-pulse",
            size === 'sm' ? 'w-1 h-1 ml-0.5 mb-1' : 
            size === 'md' ? 'w-1.5 h-1.5 ml-1 mb-1.5' :
            size === 'lg' ? 'w-2 h-2 ml-1.5 mb-2' :
            'w-3 h-3 ml-2 mb-3'
          )} />
        </div>
      )}
    </div>
  );
};
