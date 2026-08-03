import api from '@/lib/axios';
import type { Deal, DealActivity, DealLostReason, DealPriority, DealSource, DealStage, Tag } from '@/types';

// Base path convention: mirrors other resource API usage in this codebase
// (see hooks/useApi.ts and pages/workspace/Deals.tsx), which always hits
// `/admin/<resource>` directly on the shared axios instance (baseURL already
// includes `/api`; the axios request interceptor also rewrites
// `/workspace/`|`/saas-admin/` prefixes to `/admin/`, but new code here just
// targets `/admin/deals` directly).
const BASE = '/admin/deals';

// Laravel paginator response shape, as consumed elsewhere in this codebase
// (see useResourceList / DataTable-style consumers).
export interface LaravelPaginator<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number | null;
  to?: number | null;
  [key: string]: unknown;
}

export interface PipelineStatsParams {
  owner_id?: number | null;
  company_id?: number | null;
  tag_id?: number | null;
  search?: string;
  priority?: DealPriority | null;
  source?: DealSource | null;
}

export type PipelineStatsResponse = {
  data: Record<DealStage, { count: number; value: number }>;
};

export async function getPipelineStats(params: PipelineStatsParams = {}): Promise<PipelineStatsResponse> {
  const res = await api.get(`${BASE}/pipeline/stats`, { params });
  return res.data;
}

export interface GetDealsPageParams {
  stage?: DealStage | string; // comma-joined for multi-stage columns, e.g. "lost,cancelled"
  page?: number;
  per_page?: number;
  owner_id?: number | null;
  company_id?: number | null;
  tag_id?: number | null;
  search?: string;
  priority?: DealPriority | null;
  source?: DealSource | null;
}

export async function getDealsPage(params: GetDealsPageParams): Promise<LaravelPaginator<Deal>> {
  const res = await api.get(BASE, { params });
  return res.data;
}

export async function getDeal(id: number | string): Promise<Deal> {
  const res = await api.get(`${BASE}/${id}`);
  return res.data;
}

export async function createDeal(payload: Record<string, unknown>): Promise<Deal> {
  const res = await api.post(BASE, payload);
  return res.data;
}

export async function updateDeal(id: number | string, payload: Record<string, unknown>): Promise<Deal> {
  const res = await api.put(`${BASE}/${id}`, payload);
  return res.data;
}

export interface MoveDealPayload {
  stage: DealStage;
  before_id?: number | null;
  after_id?: number | null;
  lost_reason?: DealLostReason;
  lost_notes?: string;
  cancellation_reason?: string;
}

export async function moveDeal(id: number | string, payload: MoveDealPayload): Promise<Deal> {
  const res = await api.patch(`${BASE}/${id}/move`, payload);
  return res.data;
}

export async function deleteDeal(id: number | string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}

export interface AssignDealPayload {
  user_ids: number[];
}

export async function assignDeal(id: number | string, payload: AssignDealPayload): Promise<Deal> {
  const res = await api.put(`${BASE}/${id}/assign`, payload);
  return res.data;
}

export interface AddActivityPayload {
  type: DealActivity['type'];
  notes?: string;
  due_date?: string;
}

export async function addActivity(id: number | string, payload: AddActivityPayload): Promise<DealActivity> {
  const res = await api.post(`${BASE}/${id}/activities`, payload);
  return res.data;
}

export async function uploadAttachment(id: number | string, formData: FormData): Promise<Deal> {
  const res = await api.post(`${BASE}/${id}/attachments`, formData);
  return res.data;
}

export async function removeAttachment(id: number | string, index: number): Promise<Deal> {
  const res = await api.delete(`${BASE}/${id}/attachments/${index}`);
  return res.data;
}

export async function attachContact(id: number | string, contactId: number): Promise<Deal> {
  const res = await api.post(`${BASE}/${id}/contacts/${contactId}`);
  return res.data;
}

export async function detachContact(id: number | string, contactId: number): Promise<Deal> {
  const res = await api.delete(`${BASE}/${id}/contacts/${contactId}`);
  return res.data;
}

export interface AttachTagPayload {
  tag_id: number;
}

export async function attachTag(id: number | string, tagId: number): Promise<Tag[]> {
  const res = await api.post(`${BASE}/${id}/tags`, { tag_id: tagId } satisfies AttachTagPayload);
  return res.data;
}

export async function detachTag(id: number | string, tagId: number): Promise<Tag[]> {
  const res = await api.delete(`${BASE}/${id}/tags/${tagId}`);
  return res.data;
}

export interface TimelineEntry {
  type: string;
  description: string;
  user?: { id: number; name: string } | null;
  at: string;
}

export async function getTimeline(id: number | string): Promise<TimelineEntry[]> {
  const res = await api.get(`${BASE}/${id}/timeline`);
  return res.data;
}
