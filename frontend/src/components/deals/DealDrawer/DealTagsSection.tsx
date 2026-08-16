import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/axios';
import type { Deal, Tag } from '@/types';
import type { ApiError } from '@/hooks/useApi';
import { Label } from '@/components/ui/label';
import { SharedTagBadge } from '@/components/shared/SharedTagBadge';
import { cn } from '@/lib/utils';
import { Check, Loader2, Plus, Tag as TagIcon } from 'lucide-react';

interface DealTagsSectionProps {
  deal: Deal;
  attachTag: UseMutationResult<Tag[], unknown, { id: number | string; tagId: number }, unknown>;
  detachTag: UseMutationResult<Tag[], unknown, { id: number | string; tagId: number }, unknown>;
}

const COLOR_OPTIONS = [
  { value: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  { value: 'bg-indigo-100 text-indigo-800', dot: 'bg-indigo-500' },
  { value: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500' },
  { value: 'bg-pink-100 text-pink-800', dot: 'bg-pink-500' },
  { value: 'bg-rose-100 text-rose-800', dot: 'bg-rose-500' },
  { value: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500' },
  { value: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
  { value: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  { value: 'bg-teal-100 text-teal-800', dot: 'bg-teal-500' },
  { value: 'bg-cyan-100 text-cyan-800', dot: 'bg-cyan-500' },
];

/**
 * Tag picker for a deal, built on the same trigger/dropdown/"create new"
 * pattern as the Companies "Refine Client Identity" drawer's LabelSelector
 * (full-width box trigger, dropdown list with checkmarks, inline color-swatch
 * creation). Wired to the id-based attach/detach mutations rather than
 * LabelSelector's deferred-until-save selection, since deal tags apply
 * immediately like the rest of this drawer.
 */
export const DealTagsSection = ({ deal, attachTag, detachTag }: DealTagsSectionProps) => {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0].value);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: allTags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => (await api.get('/admin/tags')).data as Tag[],
    staleTime: 60_000,
  });

  const createTag = useMutation({
    mutationFn: (data: { name: string; color: string }) =>
      api.post('/admin/tags', data).then((r) => r.data as Tag),
    onSuccess: (tag) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      attachTag.mutate({ id: deal.id, tagId: tag.id });
      setCreating(false);
      setNewName('');
      toast.success(`Tag "${tag.name}" created`);
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Failed to create tag'),
  });

  const dealTags = deal.tags ?? [];
  const selectedIds = new Set(dealTags.map((t) => t.id));

  const toggle = (tag: Tag) => {
    if (selectedIds.has(tag.id)) {
      detachTag.mutate({ id: deal.id, tagId: tag.id });
    } else {
      attachTag.mutate({ id: deal.id, tagId: tag.id });
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] font-medium text-brand-secondary ml-1">Tags</Label>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex flex-wrap gap-1.5 min-h-[42px] w-full items-center px-3 py-2 bg-brand-surface border border-brand-border/50 rounded-xl text-left hover:border-brand-accent/50 transition-colors"
        >
          {dealTags.length === 0 && (
            <span className="flex items-center gap-1.5 text-brand-subtle text-[12px]">
              <TagIcon size={12} /> Add tags...
            </span>
          )}
          {dealTags.map((t) => (
            <SharedTagBadge
              key={t.id}
              tag={t.name}
              color={t.color}
              onRemove={() => detachTag.mutate({ id: deal.id, tagId: t.id })}
            />
          ))}
        </button>

        {open && (
          <div className="absolute z-50 top-full mt-1 left-0 w-full bg-brand-white border border-brand-border/50 rounded-xl shadow-2xl overflow-hidden">
            {isLoading && (
              <div className="flex justify-center p-4">
                <Loader2 size={16} className="animate-spin text-brand-subtle" />
              </div>
            )}

            {!isLoading && allTags.length === 0 && !creating && (
              <p className="text-[11px] text-brand-subtle text-center py-4">No tags yet</p>
            )}

            <div className="max-h-48 overflow-y-auto">
              {allTags.map((t) => {
                const isSelected = selectedIds.has(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggle(t)}
                    disabled={attachTag.isPending || detachTag.isPending}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-brand-bg/60 transition-colors text-left disabled:opacity-50"
                  >
                    <SharedTagBadge tag={t.name} color={t.color} />
                    {isSelected && <Check size={14} className="text-brand-accent flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Create new */}
            <div className="border-t border-brand-border/50 p-2">
              {!creating ? (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-bold text-brand-accent hover:bg-brand-accent-light rounded-lg transition-colors"
                >
                  <Plus size={13} /> Create new tag
                </button>
              ) : (
                <div className="space-y-2 p-1">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Tag name"
                    className="w-full h-8 px-2 text-[12px] bg-brand-bg border border-brand-border/50 rounded-lg text-brand-primary focus:outline-none focus:border-brand-accent"
                  />
                  <div className="flex gap-1.5 flex-wrap">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setNewColor(c.value)}
                        className={cn(
                          'w-5 h-5 rounded-full transition-transform hover:scale-110',
                          c.dot,
                          newColor === c.value && 'ring-2 ring-offset-1 ring-brand-primary'
                        )}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!newName.trim() || createTag.isPending}
                      onClick={() => createTag.mutate({ name: newName.trim(), color: newColor })}
                      className="flex-1 h-7 text-[11px] font-bold bg-brand-accent text-white rounded-lg disabled:opacity-50 flex items-center justify-center"
                    >
                      {createTag.isPending ? <Loader2 size={12} className="animate-spin" /> : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCreating(false);
                        setNewName('');
                      }}
                      className="flex-1 h-7 text-[11px] font-medium text-brand-subtle border border-brand-border/50 rounded-lg hover:bg-brand-bg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
