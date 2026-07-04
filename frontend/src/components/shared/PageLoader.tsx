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
      <Loader2 className="animate-spin text-zeronix-blue" size={iconSize} />
      {label && (
        <p className="text-[10px] font-bold uppercase tracking-wider text-admin-text-muted">
          {label}
        </p>
      )}
    </div>
  );
};
