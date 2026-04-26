import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

interface CopyableTextProps {
  value: string;
  limit?: number;
  className?: string;
  tooltipSide?: "top" | "right" | "bottom" | "left";
}

/**
 * A reusable component for long text in tables that needs truncation, 
 * a professional tooltip, and a one-click copy button.
 */
export const CopyableText = ({ 
  value, 
  limit = 85, 
  className,
  tooltipSide = "top" 
}: CopyableTextProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    toast.success('Copied to clipboard');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayName = value && value.length > limit 
    ? value.substring(0, limit) + '...' 
    : value;

  if (!value) return <span className="text-admin-text-muted">—</span>;

  return (
    <div className={cn("flex items-center gap-2 group min-w-[200px] max-w-[600px] py-1", className)}>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <p className="font-medium text-admin-text-primary leading-tight flex-1 cursor-help">
            {displayName}
          </p>
        </TooltipTrigger>
        <TooltipContent 
          side={tooltipSide} 
          className="max-w-[400px] bg-admin-surface border-admin-border text-admin-text-primary p-3 shadow-xl z-50 rounded-xl"
        >
          <p className="text-sm leading-relaxed">{value}</p>
        </TooltipContent>
      </Tooltip>
      
      <button
        onClick={handleCopy}
        className={cn(
          "p-1.5 rounded-lg transition-all flex-shrink-0",
          copied
            ? "text-zeronix-green bg-zeronix-green/10 opacity-100"
            : "text-admin-text-muted hover:text-zeronix-blue hover:bg-admin-bg opacity-0 group-hover:opacity-100"
        )}
        title="Copy to clipboard"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  );
};
