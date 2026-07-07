import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { PageLoader } from '@/components/shared/PageLoader';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Pause,
  Play,
  Ban,
  Copy,
  ArrowLeft,
  Send,
  Radio,
  MousePointerClick,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { MarketingCampaign, MarketingRecipient } from '@/types';

export const MarketingCampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<'pause' | 'resume' | 'cancel' | null>(null);
  const [recipientStatus, setRecipientStatus] = useState('all');

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['marketing/campaigns', id],
    queryFn: async () => (await api.get(`/admin/marketing/campaigns/${id}`)).data as MarketingCampaign,
    refetchInterval: (query) => (['sending', 'scheduled'].includes(query.state.data?.status || '') ? 8000 : false),
  });

  const { data: report } = useQuery({
    queryKey: ['marketing/reports/campaign', id],
    queryFn: async () => (await api.get(`/admin/marketing/reports/campaigns/${id}`)).data,
    enabled: !!campaign,
  });

  const { data: recipientsData, isLoading: loadingRecipients } = useQuery({
    queryKey: ['marketing/campaigns', id, 'recipients', recipientStatus],
    queryFn: async () =>
      (
        await api.get(`/admin/marketing/campaigns/${id}/recipients`, {
          params: { status: recipientStatus === 'all' ? undefined : recipientStatus, per_page: 25 },
        })
      ).data,
  });

  const doAction = async (action: 'pause' | 'resume' | 'cancel' | 'duplicate') => {
    try {
      const res = await api.post(`/admin/marketing/campaigns/${id}/${action}`);
      if (action === 'duplicate') {
        toast.success('Campaign duplicated');
        navigate(`/workspace/marketing/campaigns/${res.data.id}/edit`);
        return;
      }
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ['marketing/campaigns', id] });
      queryClient.invalidateQueries({ queryKey: ['marketing/campaigns'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setConfirmAction(null);
    }
  };

  const retryRecipient = async (recipientId: number) => {
    try {
      await api.post(`/admin/marketing/queue/${recipientId}/retry`);
      toast.success('Queued for retry');
      queryClient.invalidateQueries({ queryKey: ['marketing/campaigns', id, 'recipients'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to retry');
    }
  };

  if (isLoading || !campaign) {
    return (
      <MarketingLayout title="Campaign">
        <PageLoader label="Loading campaign..." />
      </MarketingLayout>
    );
  }

  const rates = report?.rates || {};
  const timeline = (report?.timeline || []).map((row: any) => ({ ...row, hour: row.hour?.slice(5, 16) }));
  const recipients: MarketingRecipient[] = recipientsData?.data || [];

  return (
    <MarketingLayout
      title={campaign.name}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/workspace/marketing/campaigns')} className="h-9 text-[13px] gap-1.5">
            <ArrowLeft size={14} /> Back
          </Button>
          {['sending', 'scheduled'].includes(campaign.status) && (
            <Button variant="outline" onClick={() => setConfirmAction('pause')} className="h-9 text-[13px] gap-1.5">
              <Pause size={14} /> Pause
            </Button>
          )}
          {campaign.status === 'paused' && (
            <Button variant="outline" onClick={() => doAction('resume')} className="h-9 text-[13px] gap-1.5">
              <Play size={14} /> Resume
            </Button>
          )}
          {['sending', 'scheduled', 'paused'].includes(campaign.status) && (
            <Button variant="outline" onClick={() => setConfirmAction('cancel')} className="h-9 text-[13px] gap-1.5 text-brand-danger">
              <Ban size={14} /> Cancel
            </Button>
          )}
          <Button variant="outline" onClick={() => doAction('duplicate')} className="h-9 text-[13px] gap-1.5">
            <Copy size={14} /> Duplicate
          </Button>
        </div>
      }
    >
      <div className="flex items-center gap-3 mb-5">
        <StatusBadge status={campaign.status} />
        <span className="text-[12px] text-brand-subtle">
          {campaign.launched_at ? `Launched ${new Date(campaign.launched_at).toLocaleString()}` : 'Not launched yet'}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard title="Recipients" value={campaign.total_recipients} icon={<Send size={16} />} />
        <StatCard title="Sent" value={campaign.sent_count} icon={<Send size={16} />} />
        <StatCard title="Open Rate" value={`${rates.open_rate ?? 0}%`} icon={<Radio size={16} />} />
        <StatCard title="Click Rate" value={`${rates.click_rate ?? 0}%`} icon={<MousePointerClick size={16} />} />
        <StatCard title="Bounce Rate" value={`${rates.bounce_rate ?? 0}%`} icon={<AlertTriangle size={16} />} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="text-[13px]">Overview</TabsTrigger>
          <TabsTrigger value="recipients" className="text-[13px]">Recipients</TabsTrigger>
          <TabsTrigger value="report" className="text-[13px]">Report</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="bg-brand-white border border-brand-border rounded-xl p-4">
            <h3 className="text-[13px] font-semibold text-brand-primary mb-3">Send Progress</h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
              {[
                ['Pending', campaign.pending_count],
                ['Sent', campaign.sent_count],
                ['Deferred', campaign.deferred_count],
                ['Failed', campaign.failed_count],
                ['Bounced', campaign.bounced_count],
                ['Skipped', campaign.skipped_count],
              ].map(([label, value]) => (
                <div key={label as string} className="border border-brand-border rounded-lg py-3">
                  <p className="text-[16px] font-semibold text-brand-primary">{value}</p>
                  <p className="text-[11px] text-brand-subtle">{label}</p>
                </div>
              ))}
            </div>
            {report?.skip_breakdown && Object.keys(report.skip_breakdown).length > 0 && (
              <div className="mt-4 text-[12px] text-brand-subtle">
                Skip reasons: {Object.entries(report.skip_breakdown).map(([reason, count]) => `${reason} (${count})`).join(', ')}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="recipients">
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {['all', 'pending', 'queued', 'sent', 'deferred', 'failed', 'bounced', 'skipped', 'unsubscribed'].map((status) => (
              <button
                key={status}
                onClick={() => setRecipientStatus(status)}
                className={`h-8 px-3 rounded-md text-[12px] font-medium border capitalize transition-colors ${
                  recipientStatus === status ? 'bg-brand-accent text-white border-brand-accent' : 'bg-brand-white text-brand-secondary border-brand-border'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="bg-brand-white border border-brand-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[12px]">Recipient</TableHead>
                  <TableHead className="text-[12px]">Status</TableHead>
                  <TableHead className="text-[12px]">Sent</TableHead>
                  <TableHead className="text-[12px]">Opens</TableHead>
                  <TableHead className="text-[12px]">Clicks</TableHead>
                  <TableHead className="text-[12px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingRecipients && <TableRow><TableCell colSpan={6} className="text-center py-6 text-[13px] text-brand-subtle">Loading…</TableCell></TableRow>}
                {!loadingRecipients && recipients.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-6 text-[13px] text-brand-subtle">No recipients in this status.</TableCell></TableRow>
                )}
                {recipients.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="text-[13px] font-medium">{r.name || r.email}</p>
                      <p className="text-[11px] text-brand-subtle">{r.email}</p>
                    </TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-[12px] text-brand-subtle">{r.sent_at ? new Date(r.sent_at).toLocaleString() : '—'}</TableCell>
                    <TableCell className="text-[12px]">{r.open_count}</TableCell>
                    <TableCell className="text-[12px]">{r.click_count}</TableCell>
                    <TableCell className="text-right">
                      {['failed', 'deferred', 'bounced', 'skipped'].includes(r.status) && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => retryRecipient(r.id)}>
                          <RefreshCw size={13} />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="report">
          <div className="bg-brand-white border border-brand-border rounded-xl p-4">
            <h3 className="text-[13px] font-semibold text-brand-primary mb-3">Send Timeline</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 6, fontSize: 12 }} />
                <Area type="monotone" dataKey="sent" stroke="#10B981" fillOpacity={0.1} fill="#10B981" strokeWidth={2} name="Sent" />
                <Area type="monotone" dataKey="opens" stroke="#6366F1" fillOpacity={0} strokeWidth={2} name="Opens" />
                <Area type="monotone" dataKey="clicks" stroke="#F59E0B" fillOpacity={0} strokeWidth={2} name="Clicks" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {report?.top_links?.length > 0 && (
            <div className="bg-brand-white border border-brand-border rounded-xl p-4 mt-4">
              <h3 className="text-[13px] font-semibold text-brand-primary mb-3">Top Clicked Links</h3>
              <div className="space-y-2">
                {report.top_links.map((link: any) => (
                  <div key={link.url} className="flex items-center justify-between text-[12px]">
                    <span className="text-brand-secondary truncate max-w-[70%]">{link.url}</span>
                    <span className="font-semibold text-brand-primary">{link.clicks}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(v) => !v && setConfirmAction(null)}
        title={confirmAction === 'cancel' ? 'Cancel campaign?' : 'Pause campaign?'}
        description={
          confirmAction === 'cancel'
            ? 'Remaining unsent recipients will be skipped. This cannot be undone.'
            : 'Sending will stop immediately. You can resume later.'
        }
        confirmLabel={confirmAction === 'cancel' ? 'Cancel Campaign' : 'Pause'}
        variant={confirmAction === 'cancel' ? 'destructive' : 'default'}
        onConfirm={() => confirmAction && doAction(confirmAction)}
      />
    </MarketingLayout>
  );
};
