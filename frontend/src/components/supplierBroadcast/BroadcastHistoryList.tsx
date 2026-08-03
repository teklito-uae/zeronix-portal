import { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/shared/PageLoader';
import { useDeleteSbBroadcast, useSbBroadcasts } from '@/hooks/useSupplierBroadcast';

interface BroadcastHistoryListProps {
  canDelete: boolean;
}

export const BroadcastHistoryList = ({ canDelete }: BroadcastHistoryListProps) => {
  const { data, isLoading } = useSbBroadcasts();
  const deleteBroadcast = useDeleteSbBroadcast();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const broadcasts = data?.data ?? [];

  const handleDelete = (id: number) => {
    if (!window.confirm('Delete this broadcast and all of its parsed products? This cannot be undone.')) return;
    deleteBroadcast.mutate(id);
  };

  if (isLoading) {
    return <PageLoader label="Loading broadcast history..." iconSize={28} className="min-h-[200px] gap-3" />;
  }

  if (broadcasts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 min-h-[200px] text-brand-subtle">
        <History size={28} className="opacity-40" />
        <p className="text-[13px] font-medium">No broadcasts imported yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {broadcasts.map((broadcast) => {
        const expanded = expandedId === broadcast.id;
        return (
          <div key={broadcast.id} className="rounded-xl border border-brand-border/40 bg-brand-white overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedId(expanded ? null : broadcast.id)}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-brand-surface/50 transition-colors"
            >
              {expanded ? <ChevronDown size={14} className="text-brand-subtle shrink-0" /> : <ChevronRight size={14} className="text-brand-subtle shrink-0" />}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-brand-primary truncate">
                  {broadcast.vendor?.name || 'Unassigned vendor'}
                  {broadcast.category?.name ? ` · ${broadcast.category.name}` : ''}
                </p>
                <p className="text-[11px] text-brand-subtle mt-0.5">
                  {broadcast.created_at ? new Date(broadcast.created_at).toLocaleString() : ''}
                </p>
              </div>
              <Badge variant="secondary" className="text-[10px] capitalize shrink-0">{broadcast.source.replace('_', ' ')}</Badge>
              <Badge variant="info" className="text-[10px] shrink-0">{broadcast.parsed_row_count} rows</Badge>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-brand-subtle hover:text-brand-danger shrink-0"
                  onClick={(e) => { e.stopPropagation(); handleDelete(broadcast.id); }}
                >
                  <Trash2 size={13} />
                </Button>
              )}
            </button>

            {expanded && (
              <div className="border-t border-brand-border/40 p-3 space-y-3">
                {broadcast.parse_warnings && broadcast.parse_warnings.length > 0 && (
                  <div className="space-y-1">
                    {broadcast.parse_warnings.map((warning, idx) => (
                      <p key={idx} className="text-[11px] text-brand-warning font-medium">⚠ {warning}</p>
                    ))}
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-semibold text-brand-secondary mb-1">Raw Text</p>
                  <pre className="text-[11px] text-brand-subtle bg-brand-surface rounded-lg p-3 whitespace-pre-wrap break-words max-h-[200px] overflow-y-auto font-mono">
                    {broadcast.raw_text}
                  </pre>
                </div>
                {broadcast.products && broadcast.products.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-brand-secondary mb-1">Parsed Products ({broadcast.products.length})</p>
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                      {broadcast.products.map((product) => (
                        <div key={product.id} className="flex items-center justify-between gap-2 text-[12px] px-2 py-1.5 rounded-lg bg-brand-surface/70">
                          <span className="truncate text-brand-primary font-medium">{product.product_name || product.raw_line}</span>
                          <span className="text-brand-subtle shrink-0">
                            {product.price !== null ? `${product.currency ?? ''} ${product.price}` : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
