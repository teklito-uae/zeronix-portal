import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { PageLoader } from '@/components/shared/PageLoader';
import { RichTextEditor } from '@/components/marketing/RichTextEditor';
import { TemplatePreviewDialog } from '@/components/marketing/TemplatePreviewDialog';
import { TestSendDialog } from '@/components/marketing/TestSendDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Save, Eye, Send, History, ArrowLeft } from 'lucide-react';
import type { MarketingTemplate, MarketingTemplateVersion } from '@/types';

const CATEGORIES = [
  { value: 'welcome', label: 'Welcome' },
  { value: 'introduction', label: 'Introduction' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'renewal', label: 'Renewal' },
  { value: 'promotional', label: 'Promotional' },
  { value: 'custom', label: 'Custom' },
];

export const MarketingTemplateEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !id;

  const { data: template, isLoading } = useQuery({
    queryKey: ['marketing/templates', id],
    queryFn: async () => {
      const res = await api.get(`/admin/marketing/templates/${id}`);
      return res.data as MarketingTemplate;
    },
    enabled: !isNew,
  });

  const [form, setForm] = useState({
    name: '',
    subject: '',
    preheader: '',
    body_html: '',
    category: 'custom',
  });
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);

  useEffect(() => {
    if (template) {
      setForm({
        name: template.name,
        subject: template.subject,
        preheader: template.preheader || '',
        body_html: template.body_html,
        category: template.category,
      });
    }
  }, [template]);

  const save = async () => {
    if (!form.name || !form.subject || !form.body_html) {
      toast.error('Name, subject and content are required');
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const res = await api.post('/admin/marketing/templates', form);
        toast.success('Template created');
        queryClient.invalidateQueries({ queryKey: ['marketing/templates'] });
        navigate(`/workspace/marketing/templates/${res.data.id}/edit`, { replace: true });
      } else {
        await api.put(`/admin/marketing/templates/${id}`, form);
        toast.success('Template saved');
        queryClient.invalidateQueries({ queryKey: ['marketing/templates', id] });
        queryClient.invalidateQueries({ queryKey: ['marketing/templates'] });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  if (!isNew && isLoading) {
    return (
      <MarketingLayout title="Templates">
        <PageLoader label="Loading template..." />
      </MarketingLayout>
    );
  }

  return (
    <MarketingLayout
      title={isNew ? 'New Template' : 'Edit Template'}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/workspace/marketing/templates')} className="h-9 text-[13px] gap-1.5">
            <ArrowLeft size={14} /> Back
          </Button>
          {!isNew && (
            <>
              <Button variant="outline" onClick={() => setVersionsOpen(true)} className="h-9 text-[13px] gap-1.5">
                <History size={14} /> Versions
              </Button>
              <Button variant="outline" onClick={() => setTestOpen(true)} className="h-9 text-[13px] gap-1.5">
                <Send size={14} /> Test Send
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => setPreviewOpen(true)} className="h-9 text-[13px] gap-1.5">
            <Eye size={14} /> Preview
          </Button>
          <Button onClick={save} disabled={saving} className="h-9 text-[13px] gap-1.5 bg-brand-primary">
            <Save size={14} /> {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      }
    >
      <div className="max-w-4xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-[12px]">Template name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px]">Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value} className="text-[13px]">{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[12px]">Subject line</Label>
          <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Welcome to {{company.name}}, {{recipient.first_name}}!" className="h-9 text-[13px]" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[12px]">Preheader (optional preview text)</Label>
          <Input value={form.preheader} onChange={(e) => setForm({ ...form, preheader: e.target.value })} className="h-9 text-[13px]" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[12px]">Content</Label>
          <RichTextEditor value={form.body_html} onChange={(html) => setForm({ ...form, body_html: html })} />
        </div>
      </div>

      <TemplatePreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} subject={form.subject} bodyHtml={form.body_html} />
      {!isNew && <TestSendDialog open={testOpen} onOpenChange={setTestOpen} endpoint={`/admin/marketing/templates/${id}/test-send`} />}
      {!isNew && id && (
        <VersionsSheet
          open={versionsOpen}
          onOpenChange={setVersionsOpen}
          templateId={Number(id)}
          onRestored={() => {
            queryClient.invalidateQueries({ queryKey: ['marketing/templates', id] });
          }}
        />
      )}
    </MarketingLayout>
  );
};

const VersionsSheet = ({
  open,
  onOpenChange,
  templateId,
  onRestored,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: number;
  onRestored: () => void;
}) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['marketing/templates', templateId, 'versions'],
    queryFn: async () => {
      const res = await api.get(`/admin/marketing/templates/${templateId}/versions`);
      return res.data.data as MarketingTemplateVersion[];
    },
    enabled: open,
  });

  const restore = async (version: number) => {
    try {
      await api.post(`/admin/marketing/templates/${templateId}/versions/${version}/restore`);
      toast.success(`Restored version ${version}`);
      onRestored();
      refetch();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to restore version');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-[15px]">Version History</SheetTitle>
          <SheetDescription className="text-[12px]">Previous versions are saved automatically whenever content changes.</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-2 max-h-[70vh] overflow-y-auto">
          {isLoading && <p className="text-[12px] text-brand-subtle">Loading…</p>}
          {!isLoading && (data || []).length === 0 && <p className="text-[12px] text-brand-subtle">No previous versions yet.</p>}
          {(data || []).map((v) => (
            <div key={v.id} className="border border-brand-border rounded-lg p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-brand-primary">Version {v.version}</p>
                <p className="text-[11px] text-brand-subtle truncate">{v.subject}</p>
                <p className="text-[10px] text-brand-subtle">{v.editor?.name} · {v.created_at ? new Date(v.created_at).toLocaleString() : ''}</p>
              </div>
              <Button variant="outline" size="sm" className="h-8 text-[11px] flex-shrink-0" onClick={() => restore(v.version)}>
                Restore
              </Button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
