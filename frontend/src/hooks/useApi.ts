import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { getBasePath } from './useBasePath';
import type { PaginatedResponse } from '@/types';

/** Loosely-typed query-string params object passed to `api.get`. */
type QueryParams = Record<string, unknown>;

/** Shape of an axios/Laravel validation-style error response. */
export interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

/**
 * Hook for fetching a paginated list of resources.
 *
 * `T` is the *full* shape of the response body, not the list-item type —
 * most `/admin/*` list endpoints return the standard paginated envelope
 * (`{ data, total, current_page, last_page, per_page }`), so callers should
 * pass `useResourceList<PaginatedResponse<Deal>>(...)`. A few endpoints
 * (e.g. `/admin/tags`, `/admin/customers/industries`) return a plain array
 * instead — for those, pass the array type directly, e.g.
 * `useResourceList<Tag[]>(...)`.
 *
 * @param resource - The resource name (e.g., 'products', 'invoices')
 * @param params - Search and pagination parameters
 */
export function useResourceList<T = PaginatedResponse<unknown>>(resource: string, params: QueryParams) {
  return useQuery({
    queryKey: [resource, params],
    queryFn: async (): Promise<T> => {
      const res = await api.get(`/admin/${resource}`, { params });
      return res.data;
    },
  });
}

/**
 * Hook for fetching a single resource detail. `T` is the resource itself
 * (the endpoint returns the model JSON directly, no envelope).
 */
export function useResourceDetail<T>(resource: string, id: string | number | undefined) {
  return useQuery({
    queryKey: [resource, id],
    queryFn: async (): Promise<T | null> => {
      if (!id) return null;
      const res = await api.get(`/admin/${resource}/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook for CRUD operations
 */
export function useResourceMutation(resource: string, additionalQueryKeys: string[][] = []) {
  const queryClient = useQueryClient();
  const basePath = getBasePath();
  // Only invalidate dashboard when operating in the workspace context
  const baseKeys = [[resource], ...(basePath === '/workspace' ? [['admin-dashboard']] : []), ...additionalQueryKeys];

  const invalidateAll = () => {
    baseKeys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
  };

  // Create
  const create = useMutation({
    mutationFn: (data: QueryParams) => api.post(`/admin/${resource}`, data),
    onSuccess: () => {
      invalidateAll();
      toast.success(`${resource.charAt(0).toUpperCase() + resource.slice(1)} created`);
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Create failed'),
  });

  // Update
  const update = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: QueryParams }) =>
      api.put(`/admin/${resource}/${id}`, data),
    onSuccess: () => {
      invalidateAll();
      toast.success(`${resource.charAt(0).toUpperCase() + resource.slice(1)} updated`);
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  // Delete
  const remove = useMutation({
    mutationFn: (id: number | string) => api.delete(`/admin/${resource}/${id}`),
    onSuccess: () => {
      invalidateAll();
      toast.success(`${resource.charAt(0).toUpperCase() + resource.slice(1)} deleted`);
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  // Bulk Update
  const bulkUpdate = useMutation({
    mutationFn: (data: QueryParams) => api.post(`/admin/${resource}/bulk-update`, data),
    onSuccess: () => {
      invalidateAll();
      toast.success('Bulk update successful');
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Bulk update failed'),
  });

  return { create, update, remove, bulkUpdate };
}

/**
 * Hook for fetching public resources (unauthenticated). Same `T` contract as
 * `useResourceList` — pass the full response shape (envelope or plain array).
 */
export function usePublicResourceList<T = PaginatedResponse<unknown>>(resource: string, params: QueryParams) {
  return useQuery({
    queryKey: ['public', resource, params],
    queryFn: async (): Promise<T> => {
      const res = await api.get(`/public/${resource}`, { params });
      return res.data;
    },
  });
}
