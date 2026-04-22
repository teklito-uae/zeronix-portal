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
    <div className="flex flex-col items-center justify-center p-12 text-center bg-admin-surface border border-dashed border-admin-border rounded-xl">
      <div className="h-16 w-16 bg-admin-bg rounded-full flex items-center justify-center mb-4 text-admin-text-muted opacity-50">
        <Icon size={32} />
      </div>
      <h3 className="text-lg font-semibold text-admin-text-primary mb-2">{title}</h3>
      <p className="text-sm text-admin-text-secondary max-w-xs mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-zeronix-blue hover:bg-zeronix-blue-hover text-white">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
