import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';

/**
 * Hook for fetching a paginated list of resources
 * @param resource - The resource name (e.g., 'products', 'invoices')
 * @param params - Search and pagination parameters
 */
export function useResourceList<_T>(resource: string, params: any) {
  return useQuery({
    queryKey: [resource, params],
    queryFn: async () => {
      const res = await api.get(`/admin/${resource}`, { params });
      return res.data;
    },
  });
}

/**
 * Hook for fetching a single resource detail
 */
export function useResourceDetail<_T>(resource: string, id: string | number | undefined) {
  return useQuery({
    queryKey: [resource, id],
    queryFn: async () => {
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
export function useResourceMutation(resource: string) {
  const queryClient = useQueryClient();

  // Create
  const create = useMutation({
    mutationFn: (data: any) => api.post(`/admin/${resource}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] });
      toast.success(`${resource.charAt(0).toUpperCase() + resource.slice(1)} created`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Create failed'),
  });

  // Update
  const update = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) => 
      api.put(`/admin/${resource}/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] });
      toast.success(`${resource.charAt(0).toUpperCase() + resource.slice(1)} updated`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  // Delete
  const remove = useMutation({
    mutationFn: (id: number | string) => api.delete(`/admin/${resource}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] });
      toast.success(`${resource.charAt(0).toUpperCase() + resource.slice(1)} deleted`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  // Bulk Update
  const bulkUpdate = useMutation({
    mutationFn: (data: any) => api.post(`/admin/${resource}/bulk-update`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] });
      toast.success('Bulk update successful');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Bulk update failed'),
  });

  return { create, update, remove, bulkUpdate };
}
