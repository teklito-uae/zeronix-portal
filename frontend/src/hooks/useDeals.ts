import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as dealsApi from '@/api/dealsApi';
import type {
  AddActivityPayload,
  AssignDealPayload,
  GetDealsPageParams,
  MoveDealPayload,
  PipelineStatsParams,
} from '@/api/dealsApi';
import { useResourceDetail } from './useApi';
import type { Deal, DealStage } from '@/types';

/**
 * Pipeline stage totals (count + value) for the kanban column headers.
 */
export function usePipelineStats(filters: PipelineStatsParams = {}) {
  return useQuery({
    queryKey: ['deals', 'pipeline-stats', filters],
    queryFn: () => dealsApi.getPipelineStats(filters),
  });
}

export interface ColumnDealsFilters {
  owner_id?: number | null;
  company_id?: number | null;
  tag_id?: number | null;
  search?: string;
  priority?: GetDealsPageParams['priority'];
  source?: GetDealsPageParams['source'];
  per_page?: number;
}

/**
 * Infinite-scrolling list of deals for a single kanban column.
 *
 * `stageKey` may be an array (e.g. the "Lost" column reads
 * `stage IN (lost, cancelled)`). We encode that as a comma-joined string
 * (`stage=lost,cancelled`) sent under the same `stage` query param name.
 *
 * ASSUMPTION / BACKEND TODO: this assumes the backend's `index()` stage
 * filter can accept a comma-joined list (e.g. via `whereIn` split on `,`
 * when a single `stage` param contains a comma), similar to Laravel's
 * `in:` validation style. If the backend only supports a single exact
 * stage value today, it will need a small change to split on `,` before
 * filtering. Flagging this here since the backend is being implemented
 * in parallel.
 */
export function useColumnDeals(stageKey: DealStage | DealStage[], filters: ColumnDealsFilters = {}) {
  const stage = Array.isArray(stageKey) ? stageKey.join(',') : stageKey;

  return useInfiniteQuery({
    queryKey: ['deals', 'column', stage, filters],
    queryFn: ({ pageParam }) =>
      dealsApi.getDealsPage({
        stage,
        page: pageParam,
        per_page: filters.per_page ?? 25,
        owner_id: filters.owner_id,
        company_id: filters.company_id,
        tag_id: filters.tag_id,
        search: filters.search,
        priority: filters.priority,
        source: filters.source,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.current_page < lastPage.last_page ? lastPage.current_page + 1 : undefined,
  });
}

export function useDeal(id: number | string | undefined) {
  return useResourceDetail<Deal>('deals', id);
}

export function useTimeline(id: number | string | undefined) {
  return useQuery({
    queryKey: ['deals', id, 'timeline'],
    queryFn: () => dealsApi.getTimeline(id as number | string),
    enabled: !!id,
  });
}

function useInvalidateDeals() {
  const queryClient = useQueryClient();
  return (id?: number | string) => {
    queryClient.invalidateQueries({ queryKey: ['deals'] });
    if (id !== undefined) {
      queryClient.invalidateQueries({ queryKey: ['deals', id] });
    }
  };
}

export function useCreateDeal() {
  const invalidate = useInvalidateDeals();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => dealsApi.createDeal(payload),
    onSuccess: () => {
      invalidate();
      toast.success('Deal created');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create deal'),
  });
}

export function useUpdateDeal() {
  const invalidate = useInvalidateDeals();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: Record<string, unknown> }) =>
      dealsApi.updateDeal(id, data),
    onSuccess: (_data, vars) => {
      invalidate(vars.id);
      toast.success('Deal updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update deal'),
  });
}

/**
 * Wraps PATCH /admin/deals/{id}/move.
 *
 * NOTE: optimistic cache patching (onMutate/onError rollback) for smooth
 * drag-and-drop is intentionally NOT implemented here — that logic belongs
 * in KanbanBoard.tsx, built in a later, separate work stream, so it can
 * coordinate directly with the drag state stores. This hook only exposes
 * the bare mutation.
 */
export function useMoveDeal() {
  const invalidate = useInvalidateDeals();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number | string } & MoveDealPayload) =>
      dealsApi.moveDeal(id, payload),
    // TODO: optimistic update logic (onMutate/onError/onSuccess cache patching)
    // wired in KanbanBoard.tsx.
    onSuccess: (_data, vars) => {
      invalidate(vars.id);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to move deal'),
  });
}

export function useDeleteDeal() {
  const invalidate = useInvalidateDeals();
  return useMutation({
    mutationFn: (id: number | string) => dealsApi.deleteDeal(id),
    onSuccess: () => {
      invalidate();
      toast.success('Deal deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete deal'),
  });
}

export function useAssignDeal() {
  const invalidate = useInvalidateDeals();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number | string } & AssignDealPayload) =>
      dealsApi.assignDeal(id, payload),
    onSuccess: (_data, vars) => {
      invalidate(vars.id);
      toast.success('Team updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update team'),
  });
}

export function useAddActivity() {
  const invalidate = useInvalidateDeals();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number | string } & AddActivityPayload) =>
      dealsApi.addActivity(id, payload),
    onSuccess: (_data, vars) => {
      invalidate(vars.id);
      toast.success('Activity logged');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to log activity'),
  });
}

export function useUploadAttachment() {
  const invalidate = useInvalidateDeals();
  return useMutation({
    mutationFn: ({ id, formData }: { id: number | string; formData: FormData }) =>
      dealsApi.uploadAttachment(id, formData),
    onSuccess: (_data, vars) => {
      invalidate(vars.id);
      toast.success('File uploaded');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Upload failed'),
  });
}

export function useRemoveAttachment() {
  const invalidate = useInvalidateDeals();
  return useMutation({
    mutationFn: ({ id, index }: { id: number | string; index: number }) =>
      dealsApi.removeAttachment(id, index),
    onSuccess: (_data, vars) => {
      invalidate(vars.id);
      toast.success('File removed');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to remove file'),
  });
}

export function useAttachContact() {
  const invalidate = useInvalidateDeals();
  return useMutation({
    mutationFn: ({ id, contactId }: { id: number | string; contactId: number }) =>
      dealsApi.attachContact(id, contactId),
    onSuccess: (_data, vars) => {
      invalidate(vars.id);
      toast.success('Contact added');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add contact'),
  });
}

export function useDetachContact() {
  const invalidate = useInvalidateDeals();
  return useMutation({
    mutationFn: ({ id, contactId }: { id: number | string; contactId: number }) =>
      dealsApi.detachContact(id, contactId),
    onSuccess: (_data, vars) => {
      invalidate(vars.id);
      toast.success('Contact removed');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to remove contact'),
  });
}

export function useAttachTag() {
  const invalidate = useInvalidateDeals();
  return useMutation({
    mutationFn: ({ id, tagId }: { id: number | string; tagId: number }) => dealsApi.attachTag(id, tagId),
    onSuccess: (_data, vars) => {
      invalidate(vars.id);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add tag'),
  });
}

export function useDetachTag() {
  const invalidate = useInvalidateDeals();
  return useMutation({
    mutationFn: ({ id, tagId }: { id: number | string; tagId: number }) => dealsApi.detachTag(id, tagId),
    onSuccess: (_data, vars) => {
      invalidate(vars.id);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to remove tag'),
  });
}
