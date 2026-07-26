import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  page: number;
  perPage: number;
  total: number;
  lastPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  perPageOptions?: number[];
  className?: string;
}

/**
 * Shared pagination footer — used by every list page. Changing `perPage`
 * (via onPerPageChange) is expected to feed back into the caller's data
 * query params so the next page of results is re-fetched from the DB,
 * not sliced client-side from an already-fetched page.
 */
export const Pagination = ({
  page,
  perPage,
  total,
  lastPage,
  onPageChange,
  onPerPageChange,
  perPageOptions = [10, 25, 50, 100],
  className,
}: PaginationProps) => {
  if (total === 0) return null;

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  const renderPageButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(lastPage, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(i)}
          className={cn(
            'h-8 w-8 p-0 rounded-md text-sm font-semibold transition-colors',
            page === i
              ? 'bg-zeronix-blue text-white hover:bg-zeronix-blue-hover hover:text-white'
              : 'text-admin-text-secondary hover:bg-admin-surface-hover'
          )}
        >
          {i}
        </Button>
      );
    }
    return buttons;
  };

  return (
    <div
      className={cn(
        'sticky bottom-0 z-10 px-4 sm:px-5 py-3 border-t border-brand-border bg-brand-white flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 flex-shrink-0',
        className
      )}
    >
      {/* Result count — compact on mobile, full sentence from sm: up */}
      <div className="text-xs text-brand-subtle font-medium order-2 sm:order-1">
        <span className="sm:hidden">
          Page <span className="text-brand-primary">{page}</span> of {lastPage} · {total} results
        </span>
        <span className="hidden sm:inline">
          Showing <span className="text-brand-primary">{from}</span> to{' '}
          <span className="text-brand-primary">{to}</span> of{' '}
          <span className="text-brand-primary">{total}</span> results
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 order-1 sm:order-2">
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs text-brand-subtle">Rows:</span>
          <Select
            value={String(perPage)}
            onValueChange={(v) => onPerPageChange(Number(v))}
          >
            <SelectTrigger className="h-9 sm:h-[30px] w-16 text-xs bg-brand-white border-brand-border shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-brand-white border-brand-border">
              {perPageOptions.map((opt) => (
                <SelectItem key={opt} value={String(opt)} className="text-xs">
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="hidden sm:inline-flex h-[30px] w-[30px] rounded-lg border-brand-border shadow-sm"
            onClick={() => onPageChange(1)}
            disabled={page === 1}
          >
            <ChevronsLeft size={14} className="text-brand-secondary" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 sm:h-[30px] sm:w-[30px] rounded-lg border-brand-border shadow-sm"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            <ChevronLeft size={14} className="text-brand-secondary" />
          </Button>

          <div className="hidden sm:flex items-center gap-1 px-2">
            {renderPageButtons()}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 sm:h-[30px] sm:w-[30px] rounded-lg border-brand-border shadow-sm"
            onClick={() => onPageChange(Math.min(lastPage, page + 1))}
            disabled={page === lastPage || lastPage === 0}
          >
            <ChevronRight size={14} className="text-brand-secondary" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden sm:inline-flex h-[30px] w-[30px] rounded-lg border-brand-border shadow-sm"
            onClick={() => onPageChange(lastPage)}
            disabled={page === lastPage || lastPage === 0}
          >
            <ChevronsRight size={14} className="text-brand-secondary" />
          </Button>
        </div>
      </div>
    </div>
  );
};
