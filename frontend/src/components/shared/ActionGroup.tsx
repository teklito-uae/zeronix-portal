import {
  Pencil, Trash2, Eye, Mail, Download, DollarSign,
  MoreHorizontal, Loader2, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ActionGroupProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  onMail?: () => void;
  onDownload?: () => void;
  onPay?: () => void;
  isMailPending?: boolean;
  isMailSent?: boolean;
  className?: string;
}

/**
 * Standardized set of actions for table rows.
 * Features consistent icons, sizes, and spacing following theme.md
 */
export const ActionGroup = ({
  onEdit,
  onDelete,
  onView,
  onMail,
  onDownload,
  onPay,
  isMailPending,
  isMailSent,
  className
}: ActionGroupProps) => {
  return (
    <div className={cn("flex items-center justify-end gap-1", className)} onClick={(e) => e.stopPropagation()}>
      {onPay && (
        <Button
          variant="outline"
          size="sm"
          onClick={onPay}
          className="h-8 px-3 text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
        >
          <DollarSign size={12} className="mr-1" /> PAY
        </Button>
      )}

      {onMail && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onMail}
          disabled={isMailPending}
          className={cn(
            "h-8 w-8 p-0 rounded-lg transition-all",
            isMailSent ? "text-success bg-success/10" : "text-admin-text-muted hover:text-zeronix-blue hover:bg-admin-bg"
          )}
        >
          {isMailPending ? <Loader2 size={14} className="animate-spin" /> : (isMailSent ? <Check size={14} /> : <Mail size={14} />)}
        </Button>
      )}

      {onDownload && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDownload}
          className="h-8 w-8 p-0 text-admin-text-muted hover:text-zeronix-blue hover:bg-admin-bg rounded-lg transition-all"
        >
          <Download size={14} />
        </Button>
      )}

      {/* Main Actions Dropdown for Edit/Delete/View */}
      {(onEdit || onDelete || onView) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 text-admin-text-muted hover:text-admin-text-primary rounded-lg">
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36 bg-admin-surface border-admin-border rounded-xl shadow-xl p-1">
            {onView && (
              <DropdownMenuItem onClick={onView} className="rounded-lg cursor-pointer">
                <Eye size={14} className="mr-2" /> View Details
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={onEdit} className="rounded-lg cursor-pointer">
                <Pencil size={14} className="mr-2" /> Edit Record
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-danger focus:text-danger rounded-lg cursor-pointer">
                <Trash2 size={14} className="mr-2" /> Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
