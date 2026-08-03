import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { PageLoader } from '@/components/shared/PageLoader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';
import type { MarketingSettings as MarketingSettingsType } from '@/types';

const DAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
];

export const MarketingSettings = () => {
  return (
    <MarketingLayout title="Settings">
      <Tabs defaultValue="sending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="sending" className="text-[13px]">Sending Rules</TabsTrigger>
          <TabsTrigger value="tracking" className="text-[13px]">Tracking &amp; Unsubscribe</TabsTrigger>
        </TabsList>
        <TabsContent value="sending"><SendingRulesTab /></TabsContent>
        <TabsContent value="tracking"><TrackingTab /></TabsContent>
      </Tabs>
    </MarketingLayout>
  );
};

function useSettingsQuery() {
  return useQuery({
    queryKey: ['marketing-settings'],
    queryFn: async () => {
      const res = await api.get('/admin/marketing/settings');
      return res.data as MarketingSettingsType;
    },
  });
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-[12px]">{label}</Label>
    {children}
  </div>
);

const SendingRulesTab = () => {
  const { data, isLoading } = useSettingsQuery();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Partial<MarketingSettingsType>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isLoading || !form.id) return <PageLoader label="Loading settings..." />;

  const set = (key: keyof MarketingSettingsType, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleDay = (day: number) => {
    const days = form.business_days || [];
    set('business_days', days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort());
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.put('/admin/marketing/settings', form);
      setForm(res.data);
      queryClient.setQueryData(['marketing-settings'], res.data);
      toast.success('Sending rules saved');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-xl p-4">
        <p className="text-[12px] text-brand-secondary">
          Campaigns send from each team member's own email account, configured under
          <span className="font-medium"> Settings &gt; Email</span>. A campaign can only be launched once its
          creator has SMTP details saved there.
        </p>
      </div>
      <div className="bg-brand-white border border-brand-border rounded-xl p-5 space-y-4">
        <h3 className="text-[13px] font-semibold text-brand-primary">Business Hours &amp; Window</h3>
        <div className="flex items-center justify-between">
          <Label className="text-[12px]">Enforce business hours</Label>
          <Switch checked={!!form.enforce_business_hours} onCheckedChange={(v) => set('enforce_business_hours', v)} />
        </div>
        <Field label="Timezone">
          <Input value={form.timezone || ''} onChange={(e) => set('timezone', e.target.value)} placeholder="Asia/Dubai" className="h-9 text-[13px]" />
        </Field>
        <Field label="Business days">
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={`h-8 px-3 rounded-md text-[12px] font-medium border transition-colors ${
                  (form.business_days || []).includes(d.value)
                    ? 'bg-brand-accent text-white border-brand-accent'
                    : 'bg-brand-white text-brand-secondary border-brand-border'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Send start time">
            <Input type="time" value={(form.send_start_time || '09:00:00').slice(0, 5)} onChange={(e) => set('send_start_time', e.target.value)} className="h-9 text-[13px]" />
          </Field>
          <Field label="Send end time">
            <Input type="time" value={(form.send_end_time || '18:00:00').slice(0, 5)} onChange={(e) => set('send_end_time', e.target.value)} className="h-9 text-[13px]" />
          </Field>
        </div>
      </div>

      <div className="bg-brand-white border border-brand-border rounded-xl p-5 space-y-4">
        <h3 className="text-[13px] font-semibold text-brand-primary">Rate Limits &amp; Pacing</h3>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Per minute">
            <Input type="number" value={form.rate_per_minute ?? ''} onChange={(e) => set('rate_per_minute', Number(e.target.value))} className="h-9 text-[13px]" />
          </Field>
          <Field label="Per hour">
            <Input type="number" value={form.rate_per_hour ?? ''} onChange={(e) => set('rate_per_hour', Number(e.target.value))} className="h-9 text-[13px]" />
          </Field>
          <Field label="Per day">
            <Input type="number" value={form.rate_per_day ?? ''} onChange={(e) => set('rate_per_day', Number(e.target.value))} className="h-9 text-[13px]" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Min interval (seconds)">
            <Input type="number" value={form.min_interval_seconds ?? ''} onChange={(e) => set('min_interval_seconds', Number(e.target.value))} className="h-9 text-[13px]" />
          </Field>
          <Field label="Max interval (seconds)">
            <Input type="number" value={form.max_interval_seconds ?? ''} onChange={(e) => set('max_interval_seconds', Number(e.target.value))} className="h-9 text-[13px]" />
          </Field>
        </div>
        <p className="text-[11px] text-brand-subtle">Each message is delayed a random number of seconds between these two values, to avoid sending bursts.</p>
      </div>

      <div className="bg-brand-white border border-brand-border rounded-xl p-5 space-y-4">
        <h3 className="text-[13px] font-semibold text-brand-primary">Recipient Protection</h3>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Cool-off (hours)">
            <Input type="number" value={form.cool_off_hours ?? ''} onChange={(e) => set('cool_off_hours', Number(e.target.value))} className="h-9 text-[13px]" />
          </Field>
          <Field label="Max emails / recipient / month">
            <Input type="number" value={form.max_emails_per_recipient_per_month ?? ''} onChange={(e) => set('max_emails_per_recipient_per_month', Number(e.target.value))} className="h-9 text-[13px]" />
          </Field>
          <Field label="Duplicate protection (days)">
            <Input type="number" value={form.duplicate_protection_days ?? ''} onChange={(e) => set('duplicate_protection_days', Number(e.target.value))} className="h-9 text-[13px]" />
          </Field>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="h-9 text-[13px] gap-1.5 bg-brand-primary">
          <Save size={14} /> {saving ? 'Saving…' : 'Save Sending Rules'}
        </Button>
      </div>
    </div>
  );
};

const TrackingTab = () => {
  const { data, isLoading } = useSettingsQuery();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Partial<MarketingSettingsType>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isLoading || !form.id) return <PageLoader label="Loading settings..." />;

  const set = (key: keyof MarketingSettingsType, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.put('/admin/marketing/settings', form);
      setForm(res.data);
      queryClient.setQueryData(['marketing-settings'], res.data);
      toast.success('Tracking settings saved');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-brand-white border border-brand-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-[12px]">Track opens</Label>
            <p className="text-[11px] text-brand-subtle">Embeds an invisible pixel in outgoing emails.</p>
          </div>
          <Switch checked={!!form.track_opens} onCheckedChange={(v) => set('track_opens', v)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-[12px]">Track clicks</Label>
            <p className="text-[11px] text-brand-subtle">Rewrites links to go through a tracking redirect.</p>
          </div>
          <Switch checked={!!form.track_clicks} onCheckedChange={(v) => set('track_clicks', v)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-[12px]">Append unsubscribe footer</Label>
            <p className="text-[11px] text-brand-subtle">Adds an unsubscribe link to every campaign email.</p>
          </div>
          <Switch checked={!!form.append_unsubscribe_footer} onCheckedChange={(v) => set('append_unsubscribe_footer', v)} />
        </div>
        <Field label="Custom unsubscribe footer HTML (optional)">
          <Textarea
            value={form.unsubscribe_footer_html || ''}
            onChange={(e) => set('unsubscribe_footer_html', e.target.value)}
            placeholder="Leave blank to use the default footer"
            className="text-[12px] font-mono min-h-[100px]"
          />
        </Field>
        <Field label="Default test email">
          <Input type="email" value={form.default_test_email || ''} onChange={(e) => set('default_test_email', e.target.value)} className="h-9 text-[13px]" />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="h-9 text-[13px] gap-1.5 bg-brand-primary">
          <Save size={14} /> {saving ? 'Saving…' : 'Save Tracking Settings'}
        </Button>
      </div>
    </div>
  );
};

