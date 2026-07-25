import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import api from '@/lib/axios';
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
    mutationFn: async () => (await api.get('/admin/google-contacts/connect')).data,
    onSuccess: (data) => {
      window.location.href = data.auth_url;
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to start Google connection'),
  });

  const syncMutation = useMutation({
    mutationFn: async () => (await api.post('/admin/google-contacts/sync')).data,
    onSuccess: (data) => {
      toast.success(data.message || 'Sync started');
      queryClient.invalidateQueries({ queryKey: ['google-contacts-status'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to start sync'),
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => (await api.post('/admin/google-contacts/disconnect')).data,
    onSuccess: (data) => {
      toast.success(data.message || 'Google account disconnected');
      queryClient.invalidateQueries({ queryKey: ['google-contacts-status'] });
      setDisconnectOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to disconnect'),
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
      <div className="flex justify-between items-center bg-admin-surface/90 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-xl">
        <div>
          <h3 className="text-lg font-bold text-admin-text-primary">Google Contacts</h3>
          <p className="text-sm text-admin-text-muted">Sync your Google Contacts into Leads automatically.</p>
        </div>
      </div>

      <Card className="bg-admin-surface/80 backdrop-blur-xl border-white/5 rounded-2xl overflow-hidden shadow-xl max-w-2xl">
        <CardHeader className="bg-admin-bg/30 border-b border-white/5 pb-4">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-admin-text-muted flex items-center gap-2">
            <Contact2 size={14} /> Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {isLoading ? (
            <div className="flex items-center gap-2 text-admin-text-muted text-sm">
              <Spinner size={16} /> Loading connection status...
            </div>
          ) : !connected ? (
            <div className="space-y-4">
              <p className="text-sm text-admin-text-secondary max-w-md">
                Connect your Google account to sync Contacts as Leads. New and updated contacts will
                appear in your Leads list, tagged with the <span className="font-semibold">Google Contacts</span> source.
              </p>
              <Button
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending}
                className="bg-gradient-to-r from-zeronix-blue to-blue-600 hover:from-blue-600 hover:to-zeronix-blue text-white rounded-xl shadow-lg shadow-zeronix-blue/30 gap-2 h-10 px-6 transition-all duration-300"
              >
                {connectMutation.isPending ? <Spinner size={16} /> : <Mail size={16} />}
                Connect Google Account
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-admin-text-primary">{status?.google_account_email}</p>
                  <p className="text-[11px] text-admin-text-muted">
                    Last synced:{' '}
                    {status?.last_synced_at
                      ? formatDistanceToNow(new Date(status.last_synced_at), { addSuffix: true })
                      : 'never'}
                  </p>
                </div>
                {renderStatusPill()}
              </div>

              <div className="flex flex-wrap gap-3 pt-2 border-t border-white/5">
                <Button
                  variant="outline"
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending || syncStatus === 'syncing'}
                  className="border-zeronix-blue text-zeronix-blue hover:bg-zeronix-blue/10 rounded-xl h-10 px-4 gap-2"
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
        <div className="max-w-2xl flex items-center justify-between gap-4 p-4 bg-zeronix-blue/5 border border-zeronix-blue/20 rounded-xl">
          <p className="text-sm text-admin-text-secondary">
            <span className="font-bold text-admin-text-primary">{status?.pending_leads_count}</span> new lead
            {status?.pending_leads_count === 1 ? '' : 's'} from Google — review them in Leads.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate(`${getBasePath()}/leads?source=google_contacts`)}
            className="border-zeronix-blue text-zeronix-blue hover:bg-zeronix-blue/10 rounded-xl h-9 px-4 gap-1.5 flex-shrink-0"
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
