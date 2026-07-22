import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { PageLoader } from '@/components/shared/PageLoader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Send, Save } from 'lucide-react';
import type { MarketingSettings as MarketingSettingsType, MarketingSmtpAccount } from '@/types';

const DAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
];

const EMPTY_SMTP_FORM = {
  label: '',
  host: '',
  port: 587,
  encryption: 'tls' as 'tls' | 'ssl' | 'none',
  username: '',
  password: '',
  from_email: '',
  from_name: '',
  reply_to: '',
  per_minute_limit: '',
  hourly_limit: '',
  daily_limit: '',
  priority: 0,
  is_active: true,
};

export const MarketingSettings = () => {
  return (
    <MarketingLayout title="Settings">
      <Tabs defaultValue="sending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="sending" className="text-[13px]">Sending Rules</TabsTrigger>
          <TabsTrigger value="smtp" className="text-[13px]">SMTP Accounts</TabsTrigger>
          <TabsTrigger value="tracking" className="text-[13px]">Tracking &amp; Unsubscribe</TabsTrigger>
        </TabsList>
        <TabsContent value="sending"><SendingRulesTab /></TabsContent>
        <TabsContent value="smtp"><SmtpAccountsTab /></TabsContent>
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

const SmtpAccountsTab = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['marketing-smtp-accounts'],
    queryFn: async () => {
      const res = await api.get('/admin/marketing/smtp-accounts');
      return res.data;
    },
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MarketingSmtpAccount | null>(null);
  const [form, setForm] = useState<any>(EMPTY_SMTP_FORM);
  const [saving, setSaving] = useState(false);
  const [testDialog, setTestDialog] = useState<MarketingSmtpAccount | null>(null);
  const [testTo, setTestTo] = useState('');
  const [testing, setTesting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MarketingSmtpAccount | null>(null);

  const accounts: MarketingSmtpAccount[] = data?.data || [];

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_SMTP_FORM);
    setDialogOpen(true);
  };

  const openEdit = (account: MarketingSmtpAccount) => {
    setEditing(account);
    setForm({ ...EMPTY_SMTP_FORM, ...account, password: '' });
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password;
      if (editing) {
        await api.put(`/admin/marketing/smtp-accounts/${editing.id}`, payload);
        toast.success('SMTP account updated');
      } else {
        await api.post('/admin/marketing/smtp-accounts', payload);
        toast.success('SMTP account added');
      }
      queryClient.invalidateQueries({ queryKey: ['marketing-smtp-accounts'] });
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save SMTP account');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/marketing/smtp-accounts/${deleteTarget.id}`);
      queryClient.invalidateQueries({ queryKey: ['marketing-smtp-accounts'] });
      toast.success('SMTP account deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete SMTP account');
    } finally {
      setDeleteTarget(null);
    }
  };

  const sendTest = async () => {
    if (!testDialog || !testTo) return;
    setTesting(true);
    try {
      const res = await api.post(`/admin/marketing/smtp-accounts/${testDialog.id}/test`, { to: testTo });
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ['marketing-smtp-accounts'] });
      setTestDialog(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Test email failed');
    } finally {
      setTesting(false);
    }
  };

  if (isLoading) return <PageLoader label="Loading SMTP accounts..." />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-[12px] text-brand-subtle">Accounts rotate by priority, then least-recently-used. Failing accounts are automatically deprioritized.</p>
        <Button onClick={openCreate} className="h-9 text-[13px] gap-1.5 bg-brand-primary">
          <Plus size={14} /> Add SMTP Account
        </Button>
      </div>

      <div className="bg-brand-white border border-brand-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[12px]">Label</TableHead>
              <TableHead className="text-[12px]">Host</TableHead>
              <TableHead className="text-[12px]">From</TableHead>
              <TableHead className="text-[12px]">Priority</TableHead>
              <TableHead className="text-[12px]">Sent</TableHead>
              <TableHead className="text-[12px]">Status</TableHead>
              <TableHead className="text-[12px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-[13px] text-brand-subtle py-8">No SMTP accounts configured yet.</TableCell></TableRow>
            )}
            {accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="text-[13px] font-medium">{account.label}</TableCell>
                <TableCell className="text-[12px] text-brand-subtle">{account.host}:{account.port}</TableCell>
                <TableCell className="text-[12px] text-brand-subtle">{account.from_email}</TableCell>
                <TableCell className="text-[12px]">{account.priority}</TableCell>
                <TableCell className="text-[12px]">{account.total_sent}</TableCell>
                <TableCell><StatusBadge status={account.is_active ? account.health_status : 'cancelled'} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setTestDialog(account); setTestTo(''); }}>
                      <Send size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(account)}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-brand-danger" onClick={() => setDeleteTarget(account)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col gap-0">
          <div className="p-6 border-b border-brand-border/50 flex-shrink-0">
            <SheetHeader className="space-y-1 text-left">
              <SheetTitle className="text-[15px] pr-6">{editing ? 'Edit SMTP Account' : 'Add SMTP Account'}</SheetTitle>
              <SheetDescription className="text-[12px]">Used for outgoing marketing campaign emails.</SheetDescription>
            </SheetHeader>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 p-6">
            <Field label="Label">
              <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="h-9 text-[13px]" />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Field label="Host">
                  <Input value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} className="h-9 text-[13px]" />
                </Field>
              </div>
              <Field label="Port">
                <Input type="number" value={form.port} onChange={(e) => setForm({ ...form, port: Number(e.target.value) })} className="h-9 text-[13px]" />
              </Field>
            </div>
            <Field label="Username">
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="h-9 text-[13px]" />
            </Field>
            <Field label={editing ? 'Password (leave blank to keep existing)' : 'Password'}>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-9 text-[13px]" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="From email">
                <Input type="email" value={form.from_email} onChange={(e) => setForm({ ...form, from_email: e.target.value })} className="h-9 text-[13px]" />
              </Field>
              <Field label="From name">
                <Input value={form.from_name} onChange={(e) => setForm({ ...form, from_name: e.target.value })} className="h-9 text-[13px]" />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Per minute limit">
                <Input type="number" value={form.per_minute_limit} onChange={(e) => setForm({ ...form, per_minute_limit: e.target.value })} className="h-9 text-[13px]" />
              </Field>
              <Field label="Hourly limit">
                <Input type="number" value={form.hourly_limit} onChange={(e) => setForm({ ...form, hourly_limit: e.target.value })} className="h-9 text-[13px]" />
              </Field>
              <Field label="Daily limit">
                <Input type="number" value={form.daily_limit} onChange={(e) => setForm({ ...form, daily_limit: e.target.value })} className="h-9 text-[13px]" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <Field label="Priority (higher = preferred)">
                <Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} className="h-9 text-[13px]" />
              </Field>
              <div className="flex items-center justify-between pb-2">
                <Label className="text-[12px]">Active</Label>
                <Switch checked={!!form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              </div>
            </div>
          </div>
          <div className="p-6 pt-4 border-t border-brand-border/50 flex-shrink-0">
            <SheetFooter className="sm:justify-end">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-[13px]">Cancel</Button>
              <Button onClick={save} disabled={saving} className="text-[13px] bg-brand-primary">{saving ? 'Saving…' : 'Save'}</Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={!!testDialog} onOpenChange={(v) => !v && setTestDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Test "{testDialog?.label}"</DialogTitle>
          </DialogHeader>
          <Field label="Send test to">
            <Input type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} className="h-9 text-[13px]" />
          </Field>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTestDialog(null)} className="text-[13px]">Cancel</Button>
            <Button onClick={sendTest} disabled={testing || !testTo} className="text-[13px] bg-brand-primary">{testing ? 'Sending…' : 'Send Test'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete SMTP account?"
        description={`"${deleteTarget?.label}" will be removed from the sending pool.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={remove}
      />
    </div>
  );
};
