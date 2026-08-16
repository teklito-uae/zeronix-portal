import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-brand-white border border-dashed border-brand-border rounded-xl">
      <div className="h-16 w-16 bg-brand-bg rounded-full flex items-center justify-center mb-4 text-brand-subtle opacity-50">
        <Icon size={32} />
      </div>
      <h3 className="text-lg font-semibold text-brand-primary mb-2">{title}</h3>
      <p className="text-sm text-brand-secondary max-w-xs mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-brand-accent hover:bg-brand-accent-hover text-white">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
