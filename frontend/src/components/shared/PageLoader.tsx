import { Loader2 } from "lucide-react";

interface PageLoaderProps {
  label?: string;
  className?: string;
  iconSize?: number;
}

export const PageLoader = ({
  label,
  className = "min-h-[300px]",
  iconSize = 32,
}: PageLoaderProps) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className="animate-spin text-brand-accent" size={iconSize} />
      {label && (
        <p className="text-[10px] font-bold uppercase tracking-wider text-brand-subtle">
          {label}
        </p>
      )}
    </div>
  );
};
