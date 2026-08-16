import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import api from '@/lib/axios';
import type { AxiosError } from 'axios';
import { toast } from 'sonner';
import { getBasePath } from '@/hooks/useBasePath';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/shared/Spinner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { GoogleContactConnectionStatus } from '@/types';
import {
  Contact2,
  RefreshCw,
  Unlink,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Mail,
} from 'lucide-react';

export const GoogleContactsSettings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [disconnectOpen, setDisconnectOpen] = useState(false);

  const { data: status, isLoading } = useQuery<GoogleContactConnectionStatus>({
    queryKey: ['google-contacts-status'],
    queryFn: async () => (await api.get('/admin/google-contacts/status')).data,
    refetchInterval: (query) => (query.state.data?.sync_status === 'syncing' ? 5000 : false),
  });

  const connectMutation = useMutation({
    mutationFn: async () => (await api.get<{ auth_url: string }>('/admin/google-contacts/connect')).data,
    onSuccess: (data) => {
      window.location.href = data.auth_url;
    },
    onError: (err: AxiosError<{ message?: string }>) => toast.error(err.response?.data?.message || 'Failed to start Google connection'),
  });

  const syncMutation = useMutation({
    mutationFn: async () => (await api.post<{ message?: string }>('/admin/google-contacts/sync')).data,
    onSuccess: (data) => {
      toast.success(data.message || 'Sync started');
      queryClient.invalidateQueries({ queryKey: ['google-contacts-status'] });
    },
    onError: (err: AxiosError<{ message?: string }>) => toast.error(err.response?.data?.message || 'Failed to start sync'),
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => (await api.post<{ message?: string }>('/admin/google-contacts/disconnect')).data,
    onSuccess: (data) => {
      toast.success(data.message || 'Google account disconnected');
      queryClient.invalidateQueries({ queryKey: ['google-contacts-status'] });
      setDisconnectOpen(false);
    },
    onError: (err: AxiosError<{ message?: string }>) => toast.error(err.response?.data?.message || 'Failed to disconnect'),
  });

  const connected = status?.connected;
  const syncStatus = status?.sync_status;

  const renderStatusPill = () => {
    if (syncStatus === 'syncing') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20 animate-pulse">
          <Loader2 size={11} className="animate-spin" /> Syncing…
        </span>
      );
    }
    if (syncStatus === 'error') {
      const pill = (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/10 text-red-600 border border-red-500/20">
          <AlertTriangle size={11} /> Needs attention
        </span>
      );
      if (status?.last_error) {
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>{pill}</span>
            </TooltipTrigger>
            <TooltipContent>{status.last_error}</TooltipContent>
          </Tooltip>
        );
      }
      return pill;
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
        <CheckCircle2 size={11} /> Synced
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-brand-white border border-brand-border p-6 rounded-xl shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-brand-primary">Google Contacts</h3>
          <p className="text-sm text-brand-subtle">Sync your Google Contacts into Leads automatically.</p>
        </div>
      </div>

      <Card className="bg-brand-white border border-brand-border rounded-xl overflow-hidden shadow-sm max-w-2xl">
        <CardHeader className="bg-brand-bg border-b border-brand-border pb-4">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-brand-subtle flex items-center gap-2">
            <Contact2 size={14} /> Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {isLoading ? (
            <div className="flex items-center gap-2 text-brand-subtle text-sm">
              <Spinner size={16} /> Loading connection status...
            </div>
          ) : !connected ? (
            <div className="space-y-4">
              <p className="text-sm text-brand-secondary max-w-md">
                Connect your Google account to sync Contacts as Leads. New and updated contacts will
                appear in your Leads list, tagged with the <span className="font-semibold">Google Contacts</span> source.
              </p>
              <Button
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending}
                className="bg-brand-accent hover:bg-brand-accent-hover text-white rounded-xl gap-2 h-10 px-6 transition-colors"
              >
                {connectMutation.isPending ? <Spinner size={16} /> : <Mail size={16} />}
                Connect Google Account
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-brand-primary">{status?.google_account_email}</p>
                  <p className="text-[11px] text-brand-subtle">
                    Last synced:{' '}
                    {status?.last_synced_at
                      ? formatDistanceToNow(new Date(status.last_synced_at), { addSuffix: true })
                      : 'never'}
                  </p>
                </div>
                {renderStatusPill()}
              </div>

              <div className="flex flex-wrap gap-3 pt-2 border-t border-brand-border">
                <Button
                  variant="outline"
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending || syncStatus === 'syncing'}
                  className="border-brand-accent text-brand-accent hover:bg-brand-accent/10 rounded-xl h-10 px-4 gap-2"
                >
                  {syncMutation.isPending || syncStatus === 'syncing' ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                  Sync Now
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDisconnectOpen(true)}
                  className="border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-xl h-10 px-4 gap-2"
                >
                  <Unlink size={16} /> Disconnect
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {connected && (status?.pending_leads_count ?? 0) > 0 && (
        <div className="max-w-2xl flex items-center justify-between gap-4 p-4 bg-brand-accent/5 border border-brand-accent/20 rounded-xl">
          <p className="text-sm text-brand-secondary">
            <span className="font-bold text-brand-primary">{status?.pending_leads_count}</span> new lead
            {status?.pending_leads_count === 1 ? '' : 's'} from Google — review them in Leads.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate(`${getBasePath()}/leads?source=google_contacts`)}
            className="border-brand-accent text-brand-accent hover:bg-brand-accent/10 rounded-xl h-9 px-4 gap-1.5 flex-shrink-0"
          >
            Review in Leads <ArrowRight size={14} />
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={disconnectOpen}
        onOpenChange={setDisconnectOpen}
        title="Disconnect Google account?"
        description="Leads already synced will remain, but new Google Contacts will no longer sync until you reconnect."
        confirmLabel="Yes, Disconnect"
        onConfirm={() => disconnectMutation.mutate()}
        variant="destructive"
      />
    </div>
  );
};
