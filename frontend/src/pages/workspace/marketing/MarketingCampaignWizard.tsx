import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { PageLoader } from '@/components/shared/PageLoader';
import { RichTextEditor } from '@/components/marketing/RichTextEditor';
import { TemplatePreviewDialog } from '@/components/marketing/TemplatePreviewDialog';
import { TestSendDialog } from '@/components/marketing/TestSendDialog';
import { AudienceFilterPanel } from '@/components/marketing/AudienceFilterPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  Send,
  Users2,
  FileUp,
  Trash2,
  Plus,
  Rocket,
  CheckCircle2,
} from 'lucide-react';
import type { MarketingAudienceSource, MarketingCampaign, MarketingSegment, MarketingTemplate } from '@/types';

const STEPS = ['Details', 'Audience', 'Content', 'Schedule', 'Review'];

const SOURCE_LABELS: Record<string, string> = {
  segment: 'Saved Segment',
  customers: 'Customers',
  leads: 'Leads',
  contacts: 'Customer Contacts',
  manual: 'Manual Entry',
};

export const MarketingCampaignWizard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditingExisting = !!id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [campaignId, setCampaignId] = useState<number | null>(id ? Number(id) : null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [audiencePreview, setAudiencePreview] = useState<{ count: number; sample: any[] } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);
  const [launchWarning, setLaunchWarning] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    template_id: undefined as number | undefined,
    subject: '',
    body_html: '',
    preheader: '',
    schedule_type: 'immediate' as 'immediate' | 'scheduled',
    scheduled_at: '',
    timezone: '',
  });
  const [sources, setSources] = useState<MarketingAudienceSource[]>([]);

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['marketing/campaigns', id],
    queryFn: async () => {
      const res = await api.get(`/admin/marketing/campaigns/${id}`);
      return res.data as MarketingCampaign;
    },
    enabled: isEditingExisting,
  });

  const { data: templatesData } = useQuery({
    queryKey: ['marketing/templates', { for: 'wizard' }],
    queryFn: async () => (await api.get('/admin/marketing/templates', { params: { per_page: 100 } })).data,
  });
  const { data: segmentsData } = useQuery({
    queryKey: ['marketing/segments', { for: 'wizard' }],
    queryFn: async () => (await api.get('/admin/marketing/segments', { params: { per_page: 100 } })).data,
  });

  const templates: MarketingTemplate[] = templatesData?.data || [];
  const segments: MarketingSegment[] = segmentsData?.data || [];

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        template_id: existing.template_id ?? undefined,
        subject: existing.subject || '',
        body_html: existing.body_html || '',
        preheader: existing.preheader || '',
        schedule_type: existing.schedule_type,
        scheduled_at: existing.scheduled_at ? existing.scheduled_at.slice(0, 16) : '',
        timezone: existing.timezone || '',
      });
      setSources(existing.audience_config?.sources || []);
    }
  }, [existing]);

  const applyTemplate = (templateId: number | undefined) => {
    const template = templates.find((t) => t.id === templateId);
    setForm((prev) => ({
      ...prev,
      template_id: templateId,
      subject: template ? template.subject : prev.subject,
      body_html: template ? template.body_html : prev.body_html,
      preheader: template ? template.preheader || '' : prev.preheader,
    }));
  };

  const persist = async (extra: Partial<typeof form> = {}, extraSources?: MarketingAudienceSource[]): Promise<number | null> => {
    const payload: any = {
      ...form,
      ...extra,
      audience_config: { sources: extraSources ?? sources },
      scheduled_at: (extra.scheduled_at ?? form.scheduled_at) || undefined,
    };
    setSaving(true);
    try {
      if (campaignId) {
        await api.put(`/admin/marketing/campaigns/${campaignId}`, payload);
        return campaignId;
      }
      const res = await api.post('/admin/marketing/campaigns', payload);
      setCampaignId(res.data.id);
      queryClient.invalidateQueries({ queryKey: ['marketing/campaigns'] });
      return res.data.id;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save campaign');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const goNext = async () => {
    if (step === 0 && !form.name) {
      toast.error('Campaign name is required');
      return;
    }
    if (step === 2 && !form.body_html) {
      toast.error('Add content before continuing');
      return;
    }
    const savedId = await persist();
    if (!savedId) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const addSource = (type: MarketingAudienceSource['type']) => {
    if (type === 'manual') {
      setSources((prev) => [...prev, { type, recipients: [] }]);
    } else if (type === 'segment') {
      setSources((prev) => [...prev, { type, id: segments[0]?.id }]);
    } else {
      setSources((prev) => [...prev, { type, filters: {} }]);
    }
  };

  const removeSource = (index: number) => setSources((prev) => prev.filter((_, i) => i !== index));

  const runAudiencePreview = async () => {
    if (sources.length === 0) {
      setAudiencePreview({ count: 0, sample: [] });
      return;
    }
    setPreviewing(true);
    try {
      const res = await api.post('/admin/marketing/campaigns/audience-preview', { sources });
      setAudiencePreview(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to preview audience');
    } finally {
      setPreviewing(false);
    }
  };

  const uploadCsv = async (file: File) => {
    const savedId = campaignId ?? (await persist());
    if (!savedId) return;
    setCsvImporting(true);
    setCsvResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/admin/marketing/campaigns/${savedId}/recipients/import`, formData);
      setCsvResult(res.data.message);
      toast.success(res.data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'CSV import failed');
    } finally {
      setCsvImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const launch = async (force = false) => {
    const savedId = await persist();
    if (!savedId) return;
    setLaunching(true);
    try {
      const res = await api.post(`/admin/marketing/campaigns/${savedId}/launch`, force ? { force: true } : {});
      toast.success(res.data.message || 'Campaign launched');
      navigate(`/workspace/marketing/campaigns/${savedId}`);
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.requires_confirmation) {
        setLaunchWarning(err.response.data.message);
      } else {
        toast.error(err.response?.data?.message || 'Failed to launch campaign');
      }
    } finally {
      setLaunching(false);
    }
  };

  if (isEditingExisting && loadingExisting) {
    return (
      <MarketingLayout title="Campaign">
        <PageLoader label="Loading campaign..." />
      </MarketingLayout>
    );
  }

  if (existing && !['draft', 'scheduled'].includes(existing.status)) {
    return (
      <MarketingLayout title="Campaign">
        <div className="text-center py-16">
          <p className="text-[13px] text-brand-subtle">This campaign is {existing.status} and can no longer be edited.</p>
          <Button variant="outline" className="mt-4 text-[13px]" onClick={() => navigate(`/workspace/marketing/campaigns/${existing.id}`)}>
            View Campaign
          </Button>
        </div>
      </MarketingLayout>
    );
  }

  return (
    <MarketingLayout
      title={isEditingExisting ? 'Edit Campaign' : 'New Campaign'}
      actions={
        <Button variant="outline" onClick={() => navigate('/workspace/marketing/campaigns')} className="h-9 text-[13px] gap-1.5">
          <ArrowLeft size={14} /> Back to Campaigns
        </Button>
      }
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <button
              onClick={() => campaignId && setStep(i)}
              disabled={!campaignId && i > 0}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-medium transition-colors ${
                i === step ? 'bg-brand-accent text-white' : i < step ? 'bg-brand-accent-light text-brand-accent' : 'bg-brand-surface text-brand-subtle'
              }`}
            >
              {i < step ? <CheckCircle2 size={13} /> : <span>{i + 1}</span>}
              {label}
            </button>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-brand-border" />}
          </div>
        ))}
      </div>

      <div className="max-w-4xl">
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[12px]">Campaign name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Q3 Promotional Blast" className="h-9 text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">Start from a template (optional)</Label>
              <Select value={form.template_id ? String(form.template_id) : 'none'} onValueChange={(v) => applyTemplate(v === 'none' ? undefined : Number(v))}>
                <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Blank campaign" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-[13px]">Blank campaign</SelectItem>
                  {templates.map((t) => <SelectItem key={t.id} value={String(t.id)} className="text-[13px]">{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-brand-subtle">Combine multiple sources. Recipients are automatically deduplicated by email and suppressed contacts are excluded.</p>
              <div className="flex gap-1.5">
                {(['segment', 'customers', 'leads', 'contacts', 'manual'] as const).map((type) => (
                  <Button key={type} variant="outline" size="sm" onClick={() => addSource(type)} className="h-8 text-[11px] gap-1">
                    <Plus size={12} /> {SOURCE_LABELS[type]}
                  </Button>
                ))}
              </div>
            </div>

            {sources.length === 0 && (
              <div className="border border-dashed border-brand-border rounded-xl p-8 text-center text-[13px] text-brand-subtle">
                Add an audience source above to get started.
              </div>
            )}

            <div className="space-y-3">
              {sources.map((source, index) => (
                <div key={index} className="border border-brand-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[13px] font-semibold text-brand-primary">{SOURCE_LABELS[source.type]}</p>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-brand-danger" onClick={() => removeSource(index)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>

                  {source.type === 'segment' && (
                    <Select value={source.id ? String(source.id) : ''} onValueChange={(v) => setSources((prev) => prev.map((s, i) => (i === index ? { ...s, id: Number(v) } : s)))}>
                      <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Choose a segment" /></SelectTrigger>
                      <SelectContent>
                        {segments.map((seg) => <SelectItem key={seg.id} value={String(seg.id)} className="text-[13px]">{seg.name} ({seg.cached_count ?? '?'})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}

                  {(source.type === 'customers' || source.type === 'leads' || source.type === 'contacts') && (
                    <AudienceFilterPanel
                      source={source.type}
                      filters={source.filters || {}}
                      onChange={(filters) => setSources((prev) => prev.map((s, i) => (i === index ? { ...s, filters } : s)))}
                    />
                  )}

                  {source.type === 'manual' && (
                    <div className="space-y-1.5">
                      <Label className="text-[12px]">One recipient per line: email, name</Label>
                      <Textarea
                        placeholder={'john@example.com, John Carter\njane@example.com, Jane Doe'}
                        defaultValue={(source.recipients || []).map((r) => `${r.email}${r.name ? ', ' + r.name : ''}`).join('\n')}
                        onBlur={(e) => {
                          const recipients = e.target.value
                            .split('\n')
                            .map((line) => line.trim())
                            .filter(Boolean)
                            .map((line) => {
                              const [email, ...rest] = line.split(',');
                              return { email: email.trim(), name: rest.join(',').trim() || undefined };
                            });
                          setSources((prev) => prev.map((s, i) => (i === index ? { ...s, recipients } : s)));
                        }}
                        className="min-h-[100px] text-[13px] font-mono"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border border-brand-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-brand-primary flex items-center gap-1.5"><FileUp size={14} /> CSV Import</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[11px]"
                  disabled={csvImporting}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {csvImporting ? 'Importing…' : 'Upload CSV'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadCsv(file);
                  }}
                />
              </div>
              <p className="text-[11px] text-brand-subtle">Must contain an "email" column. Optional "name" column and any other columns become <code>{'{{csv.column_name}}'}</code> variables. Imported rows are added directly to this campaign, independent of the sources above.</p>
              {csvResult && <p className="text-[12px] text-brand-accent font-medium">{csvResult}</p>}
            </div>

            <div className="flex items-center justify-between bg-brand-surface/50 border border-brand-border rounded-lg px-3 py-2">
              <div className="text-[12px] text-brand-secondary flex items-center gap-1.5">
                <Users2 size={14} />
                {audiencePreview ? <span className="font-semibold text-brand-primary">{audiencePreview.count} recipients</span> : 'Preview not run yet'}
              </div>
              <Button variant="outline" size="sm" onClick={runAudiencePreview} disabled={previewing} className="h-7 text-[11px]">
                {previewing ? 'Calculating…' : 'Preview Audience Count'}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[12px]">Subject line</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="h-9 text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">Preheader (optional)</Label>
              <Input value={form.preheader} onChange={(e) => setForm({ ...form, preheader: e.target.value })} className="h-9 text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[12px]">Content</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => setPreviewOpen(true)}><Eye size={12} /> Preview</Button>
                  {campaignId && <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => setTestOpen(true)}><Send size={12} /> Test Send</Button>}
                </div>
              </div>
              <RichTextEditor value={form.body_html} onChange={(html) => setForm({ ...form, body_html: html })} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[12px]">When should this campaign send?</Label>
              <Select value={form.schedule_type} onValueChange={(v) => setForm({ ...form, schedule_type: v as any })}>
                <SelectTrigger className="h-9 text-[13px] w-64"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate" className="text-[13px]">Send immediately on launch</SelectItem>
                  <SelectItem value="scheduled" className="text-[13px]">Schedule for later</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.schedule_type === 'scheduled' && (
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <div className="space-y-1.5">
                  <Label className="text-[12px]">Send date &amp; time</Label>
                  <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} className="h-9 text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px]">Timezone (optional override)</Label>
                  <Input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} placeholder="Asia/Dubai" className="h-9 text-[13px]" />
                </div>
              </div>
            )}
            <p className="text-[11px] text-brand-subtle max-w-md">
              Actual pacing (business hours, rate limits, per-domain throttling, randomized intervals) is governed by your Marketing Settings and applies regardless of this choice.
            </p>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-brand-white border border-brand-border rounded-xl divide-y divide-brand-border">
              <SummaryRow label="Campaign name" value={form.name} />
              <SummaryRow label="Subject" value={form.subject || '—'} />
              <SummaryRow label="Sources" value={sources.length ? sources.map((s) => SOURCE_LABELS[s.type]).join(', ') : 'None'} />
              <SummaryRow label="Estimated recipients" value={audiencePreview ? `${audiencePreview.count}` : 'Run a preview in the Audience step'} />
              <SummaryRow label="Schedule" value={form.schedule_type === 'immediate' ? 'Sends immediately on launch' : `Scheduled for ${form.scheduled_at || '—'}`} />
            </div>
            {launchWarning && (
              <div className="border border-amber-300 bg-amber-50 text-amber-800 rounded-lg p-3 text-[12px]">
                {launchWarning}
                <div className="mt-2">
                  <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => launch(true)}>Launch Anyway</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-brand-border">
          <Button variant="outline" onClick={goBack} disabled={step === 0} className="h-9 text-[13px] gap-1.5">
            <ArrowLeft size={14} /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={goNext} disabled={saving} className="h-9 text-[13px] gap-1.5 bg-brand-primary">
              {saving ? 'Saving…' : 'Save & Continue'} <ArrowRight size={14} />
            </Button>
          ) : (
            <Button onClick={() => launch(false)} disabled={launching} className="h-9 text-[13px] gap-1.5 bg-brand-primary">
              <Rocket size={14} /> {launching ? 'Launching…' : 'Launch Campaign'}
            </Button>
          )}
        </div>
      </div>

      <TemplatePreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} subject={form.subject} bodyHtml={form.body_html} />
      {campaignId && <TestSendDialog open={testOpen} onOpenChange={setTestOpen} endpoint={`/admin/marketing/campaigns/${campaignId}/test-send`} />}
    </MarketingLayout>
  );
};

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between px-4 py-3">
    <span className="text-[12px] text-brand-subtle">{label}</span>
    <span className="text-[13px] font-medium text-brand-primary text-right">{value}</span>
  </div>
);
