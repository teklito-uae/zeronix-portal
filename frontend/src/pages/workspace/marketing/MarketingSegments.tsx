import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { AudienceFilterPanel } from '@/components/marketing/AudienceFilterPanel';
import { useResourceList } from '@/hooks/useApi';
import { PageLoader } from '@/components/shared/PageLoader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Plus, Filter, Pencil, Trash2, RefreshCw, Users2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import type { MarketingSegment } from '@/types';

const EMPTY_FORM = { name: '', description: '', source: 'customers' as 'customers' | 'leads' | 'contacts', filters: {} as Record<string, any> };

export const MarketingSegments = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useResourceList<MarketingSegment>('marketing/segments', { per_page: 50 });
  const segments: MarketingSegment[] = data?.data || [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MarketingSegment | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [preview, setPreview] = useState<{ count: number; sample: any[] } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MarketingSegment | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setPreview(null);
    setDialogOpen(true);
  };

  const openEdit = (segment: MarketingSegment) => {
    setEditing(segment);
    setForm({ name: segment.name, description: segment.description || '', source: segment.source, filters: segment.filters || {} });
    setPreview(segment.cached_count != null ? { count: segment.cached_count, sample: [] } : null);
    setDialogOpen(true);
  };

  const runPreview = async () => {
    setPreviewing(true);
    try {
      if (editing) {
        const res = await api.get(`/admin/marketing/segments/${editing.id}/preview`);
        setPreview(res.data);
      } else {
        // No id yet for a draft segment; approximate using audience-preview
        const res = await api.post('/admin/marketing/campaigns/audience-preview', {
          sources: [{ type: form.source, filters: form.filters }],
        });
        setPreview(res.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Preview failed');
    } finally {
      setPreviewing(false);
    }
  };

  const save = async () => {
    if (!form.name) {
      toast.error('Segment name is required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/marketing/segments/${editing.id}`, form);
        toast.success('Segment updated');
      } else {
        await api.post('/admin/marketing/segments', form);
        toast.success('Segment created');
      }
      queryClient.invalidateQueries({ queryKey: ['marketing/segments'] });
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save segment');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/marketing/segments/${deleteTarget.id}`);
      queryClient.invalidateQueries({ queryKey: ['marketing/segments'] });
      toast.success('Segment deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete segment');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <MarketingLayout
      title="Saved Segments"
      actions={
        <Button onClick={openCreate} className="h-9 text-[13px] gap-1.5">
          <Plus size={14} /> New Segment
        </Button>
      }
    >
      {isLoading ? (
        <PageLoader label="Loading segments..." />
      ) : segments.length === 0 ? (
        <EmptyState icon={Filter} title="No segments yet" description="Save a reusable audience filter to speed up campaign creation." actionLabel="New Segment" onAction={openCreate} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.map((s) => (
            <div key={s.id} className="bg-brand-white border border-brand-border rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-brand-primary truncate">{s.name}</p>
                  <p className="text-[11px] text-brand-subtle capitalize">{s.source}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}><Pencil size={13} /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-brand-danger" onClick={() => setDeleteTarget(s)}><Trash2 size={13} /></Button>
                </div>
              </div>
              {s.description && <p className="text-[12px] text-brand-subtle line-clamp-2">{s.description}</p>}
              <div className="flex items-center gap-1.5 mt-1 text-[12px] text-brand-secondary">
                <Users2 size={13} />
                {s.cached_count ?? '—'} recipients
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col gap-0">
          <div className="p-6 border-b border-brand-border/50 flex-shrink-0">
            <SheetHeader className="space-y-1 text-left">
              <SheetTitle className="text-[15px] pr-6">{editing ? 'Edit Segment' : 'New Segment'}</SheetTitle>
              <SheetDescription className="text-[12px]">Segments are re-evaluated live whenever a campaign uses them.</SheetDescription>
            </SheetHeader>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[12px]">Segment name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 text-[13px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v as any, filters: {} })}>
                  <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customers" className="text-[13px]">Customers</SelectItem>
                    <SelectItem value="leads" className="text-[13px]">Leads</SelectItem>
                    <SelectItem value="contacts" className="text-[13px]">Customer Contacts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">Description (optional)</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="text-[13px] min-h-[60px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">Filters</Label>
              <AudienceFilterPanel source={form.source} filters={form.filters} onChange={(f) => setForm({ ...form, filters: f })} />
            </div>
            <div className="flex items-center justify-between bg-brand-surface/50 border border-brand-border rounded-lg px-3 py-2">
              <div className="text-[12px] text-brand-secondary">
                {preview ? <span className="font-semibold text-brand-primary">{preview.count} recipients</span> : 'Preview not run yet'}
              </div>
              <Button variant="outline" size="sm" onClick={runPreview} disabled={previewing} className="h-7 text-[11px] gap-1.5">
                <RefreshCw size={12} className={previewing ? 'animate-spin' : ''} /> Preview Count
              </Button>
            </div>
          </div>
          <div className="p-6 pt-4 border-t border-brand-border/50 flex-shrink-0">
            <SheetFooter className="sm:justify-end">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-[13px]">Cancel</Button>
              <Button onClick={save} disabled={saving} className="text-[13px] bg-brand-primary">{saving ? 'Saving…' : 'Save Segment'}</Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete segment?"
        description={`"${deleteTarget?.name}" will be removed. Campaigns already using it keep their sent history.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={remove}
      />
    </MarketingLayout>
  );
};
