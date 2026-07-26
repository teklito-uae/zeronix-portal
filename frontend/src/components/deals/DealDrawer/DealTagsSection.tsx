import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/axios';
import type { Deal, Tag } from '@/types';
import { TagsManager } from '@/components/shared/TagsManager';
import { Label } from '@/components/ui/label';

interface DealTagsSectionProps {
  deal: Deal;
  attachTag: UseMutationResult<Tag[], unknown, { id: number | string; tagId: number }, unknown>;
  detachTag: UseMutationResult<Tag[], unknown, { id: number | string; tagId: number }, unknown>;
}

/**
 * Thin wrapper around the shared `TagsManager` (name-based API — it works
 * with tag *names*, creating new tags itself via `POST /admin/tags`) wired
 * to the id-based `useAttachTag`/`useDetachTag` mutations. Deals never had
 * tags before this rebuild, so there's no prior UX to preserve — this is a
 * new integration.
 */
export const DealTagsSection = ({ deal, attachTag, detachTag }: DealTagsSectionProps) => {
  const queryClient = useQueryClient();

  const { data: dbTags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => (await api.get('/admin/tags')).data as Tag[],
  });

  const selectedTags = (deal.tags ?? []).map((t) => t.name);

  const resolveTagId = async (name: string): Promise<number | undefined> => {
    const cached = dbTags.find((t) => t.name === name);
    if (cached) return cached.id;
    // TagsManager may have just created this tag itself (it invalidates the
    // shared ['tags'] query key on creation, but that refetch can land after
    // this callback runs) — fall back to a fresh fetch so brand-new tags
    // still resolve to an id on the very first attach.
    const fresh = (await api.get('/admin/tags')).data as Tag[];
    queryClient.setQueryData(['tags'], fresh);
    return fresh.find((t) => t.name === name)?.id;
  };

  const handleAddTag = async (name: string) => {
    const tagId = await resolveTagId(name);
    if (!tagId) {
      toast.error('Could not find tag to attach');
      return;
    }
    attachTag.mutate({ id: deal.id, tagId });
  };

  const handleRemoveTag = async (name: string) => {
    const tagId = dbTags.find((t) => t.name === name)?.id ?? (await resolveTagId(name));
    if (!tagId) return;
    detachTag.mutate({ id: deal.id, tagId });
  };

  return (
    <div className="space-y-2">
      <Label className="text-[12px] font-medium text-brand-secondary ml-1">Tags</Label>
      <TagsManager selectedTags={selectedTags} onAddTag={handleAddTag} onRemoveTag={handleRemoveTag} />
    </div>
  );
};
