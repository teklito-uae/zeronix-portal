import api from '@/lib/axios';
import type { SbBroadcast, SbCategory, SbProduct, SbVendor } from '@/types';
import type { LaravelPaginator } from './dealsApi';

// Base path convention: mirrors dealsApi.ts — always hits `/admin/<resource>`
// directly on the shared axios instance (baseURL already includes `/api`).
const BASE = '/admin/sb';

// ── Categories ─────────────────────────────────────────

export async function getCategories(): Promise<SbCategory[]> {
  const res = await api.get(`${BASE}/categories`);
  return res.data.data ?? res.data;
}

export async function createCategory(payload: Record<string, unknown>): Promise<SbCategory> {
  const res = await api.post(`${BASE}/categories`, payload);
  return res.data;
}

export async function updateCategory(id: number | string, payload: Record<string, unknown>): Promise<SbCategory> {
  const res = await api.put(`${BASE}/categories/${id}`, payload);
  return res.data;
}

export async function deleteCategory(id: number | string): Promise<void> {
  await api.delete(`${BASE}/categories/${id}`);
}

// ── Vendors ────────────────────────────────────────────

export interface GetVendorsParams {
  category_id?: number | null;
  search?: string;
  is_active?: boolean;
}

export async function getVendors(params: GetVendorsParams = {}): Promise<SbVendor[]> {
  const res = await api.get(`${BASE}/vendors`, { params });
  return res.data.data ?? res.data;
}

export async function createVendor(payload: Record<string, unknown>): Promise<SbVendor> {
  const res = await api.post(`${BASE}/vendors`, payload);
  return res.data;
}

export async function updateVendor(id: number | string, payload: Record<string, unknown>): Promise<SbVendor> {
  const res = await api.put(`${BASE}/vendors/${id}`, payload);
  return res.data;
}

export async function deleteVendor(id: number | string): Promise<void> {
  await api.delete(`${BASE}/vendors/${id}`);
}

// ── Broadcasts ─────────────────────────────────────────

export interface GetBroadcastsParams {
  vendor_id?: number | null;
  category_id?: number | null;
  page?: number;
  per_page?: number;
}

export async function getBroadcasts(params: GetBroadcastsParams = {}): Promise<LaravelPaginator<SbBroadcast>> {
  const res = await api.get(`${BASE}/broadcasts`, { params });
  return res.data;
}

export interface CreateBroadcastPayload {
  vendor_id?: number | null;
  category_id?: number | null;
  raw_text: string;
}

export async function createBroadcast(payload: CreateBroadcastPayload): Promise<SbBroadcast> {
  const res = await api.post(`${BASE}/broadcasts`, payload);
  return res.data;
}

export async function getBroadcast(id: number | string): Promise<SbBroadcast> {
  const res = await api.get(`${BASE}/broadcasts/${id}`);
  return res.data;
}

export async function deleteBroadcast(id: number | string): Promise<void> {
  await api.delete(`${BASE}/broadcasts/${id}`);
}

// ── Products ───────────────────────────────────────────

export interface GetProductsParams {
  vendor_id?: number | null;
  category_id?: number | null;
  page?: number;
  per_page?: number;
}

export async function getProducts(params: GetProductsParams = {}): Promise<LaravelPaginator<SbProduct>> {
  const res = await api.get(`${BASE}/products`, { params });
  return res.data;
}

export interface SearchProductsParams extends GetProductsParams {
  q?: string;
}

export async function searchProducts(q: string, params: GetProductsParams = {}): Promise<LaravelPaginator<SbProduct>> {
  const res = await api.get(`${BASE}/products/search`, { params: { ...params, q } satisfies SearchProductsParams });
  return res.data;
}

export async function updateProduct(id: number | string, payload: Record<string, unknown>): Promise<SbProduct> {
  const res = await api.put(`${BASE}/products/${id}`, payload);
  return res.data;
}

export async function deleteProduct(id: number | string): Promise<void> {
  await api.delete(`${BASE}/products/${id}`);
}
