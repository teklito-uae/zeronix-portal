import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as sbApi from '@/api/supplierBroadcastApi';
import type {
  CreateBroadcastPayload,
  GetBroadcastsParams,
  GetProductsParams,
  GetVendorsParams,
} from '@/api/supplierBroadcastApi';

// ── Categories ─────────────────────────────────────────

export function useSbCategories() {
  return useQuery({
    queryKey: ['sb', 'categories'],
    queryFn: () => sbApi.getCategories(),
  });
}

export function useCreateSbCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => sbApi.createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sb', 'categories'] });
      toast.success('Category created');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create category'),
  });
}

export function useUpdateSbCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: Record<string, unknown> }) =>
      sbApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sb', 'categories'] });
      toast.success('Category updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update category'),
  });
}

export function useDeleteSbCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => sbApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sb', 'categories'] });
      toast.success('Category deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete category'),
  });
}

// ── Vendors ────────────────────────────────────────────

export function useSbVendors(filters: GetVendorsParams = {}) {
  return useQuery({
    queryKey: ['sb', 'vendors', filters],
    queryFn: () => sbApi.getVendors(filters),
  });
}

export function useCreateSbVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => sbApi.createVendor(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sb', 'vendors'] });
      toast.success('Vendor created');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create vendor'),
  });
}

export function useUpdateSbVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: Record<string, unknown> }) =>
      sbApi.updateVendor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sb', 'vendors'] });
      toast.success('Vendor updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update vendor'),
  });
}

export function useDeleteSbVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => sbApi.deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sb', 'vendors'] });
      toast.success('Vendor deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete vendor'),
  });
}

// ── Broadcasts ─────────────────────────────────────────

export function useSbBroadcasts(filters: GetBroadcastsParams = {}) {
  return useQuery({
    queryKey: ['sb', 'broadcasts', filters],
    queryFn: () => sbApi.getBroadcasts(filters),
  });
}

export function useSbBroadcast(id: number | string | undefined) {
  return useQuery({
    queryKey: ['sb', 'broadcasts', id],
    queryFn: () => sbApi.getBroadcast(id as number | string),
    enabled: !!id,
  });
}

/**
 * Paste-import mutation. A new broadcast also creates `sb_products` rows on
 * the backend, so on success we invalidate both the broadcasts list AND the
 * products/search queries — not just broadcasts — so the product list picks
 * up the newly parsed rows without a manual refresh.
 */
export function useCreateSbBroadcast() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBroadcastPayload) => sbApi.createBroadcast(payload),
    onSuccess: (broadcast) => {
      queryClient.invalidateQueries({ queryKey: ['sb', 'broadcasts'] });
      queryClient.invalidateQueries({ queryKey: ['sb', 'products'] });
      toast.success(`Broadcast imported — ${broadcast.parsed_row_count} product(s) parsed`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to import broadcast'),
  });
}

export function useDeleteSbBroadcast() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => sbApi.deleteBroadcast(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sb', 'broadcasts'] });
      queryClient.invalidateQueries({ queryKey: ['sb', 'products'] });
      toast.success('Broadcast deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete broadcast'),
  });
}

// ── Products ───────────────────────────────────────────

export function useSbProducts(filters: GetProductsParams = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['sb', 'products', filters],
    queryFn: () => sbApi.getProducts(filters),
    enabled: options.enabled ?? true,
  });
}

export function useSbProductSearch(query: string, filters: GetProductsParams = {}) {
  return useQuery({
    queryKey: ['sb', 'products', 'search', query, filters],
    queryFn: () => sbApi.searchProducts(query, filters),
    enabled: query.trim().length > 0,
  });
}

export function useUpdateSbProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: Record<string, unknown> }) =>
      sbApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sb', 'products'] });
      toast.success('Product updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update product'),
  });
}

export function useDeleteSbProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => sbApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sb', 'products'] });
      toast.success('Product deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete product'),
  });
}
