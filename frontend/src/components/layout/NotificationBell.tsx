import { getBasePath } from '@/hooks/useBasePath';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Bell, Mail, MailOpen, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'end' | 'center';
  triggerClassName?: string;
}

export const NotificationBell = ({ side = 'bottom', align = 'end', triggerClassName }: NotificationBellProps) => {
  const admin = useAuthStore((s) => s.admin);
  const customer = useAuthStore((s) => s.customer);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const isCustomer = location.pathname.startsWith('/portal');
  const user = isCustomer ? customer : admin;
  const parts = location.pathname.split('/');
  const companySlug = isCustomer && parts.length > 2 ? parts[2] : 'company';

  const [lastNotifCount, setLastNotifCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: unreadNotifs } = useQuery({
    queryKey: ['unread-notifications', isCustomer ? 'customer' : 'admin'],
    queryFn: async () => {
      const endpoint = isCustomer ? '/customer/notifications/unread' : `${getBasePath()}/notifications/unread`;
      return (await api.get(endpoint)).data;
    },
    enabled: !!user,
    refetchInterval: 600000, // Poll every 10 minutes to reduce DB load
    staleTime: 600000, // Consider data fresh for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch when switching tabs
    refetchOnMount: false, // Don't refetch every time the component remounts
  });

  const { data: allNotifs } = useQuery({
    queryKey: ['topbar-notifications', isCustomer ? 'customer' : 'admin'],
    queryFn: async () => {
      const endpoint = isCustomer ? '/customer/notifications' : `${getBasePath()}/notifications`;
      return (await api.get(endpoint)).data;
    },
    enabled: !!user && notifOpen,
    staleTime: 30000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => {
      const endpoint = isCustomer ? '/customer/notifications/mark-read' : `${getBasePath()}/notifications/mark-read`;
      return api.post(endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['topbar-notifications'] });
      toast.success('All notifications marked as read');
    },
  });

  const markOneReadMutation = useMutation({
    mutationFn: (id: string) => {
      const endpoint = isCustomer ? `/customer/notifications/${id}/mark-read` : `${getBasePath()}/notifications/${id}/mark-read`;
      return api.post(endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['topbar-notifications'] });
    },
  });

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />;
      case 'error':   return <AlertTriangle size={14} className="text-red-500 shrink-0" />;
      case 'warning': return <AlertTriangle size={14} className="text-amber-500 shrink-0" />;
      default:        return <Bell size={14} className="text-brand-accent shrink-0" />;
    }
  };

  useEffect(() => {
    if (unreadNotifs && unreadNotifs.length > lastNotifCount) {
      const newNotif = unreadNotifs[0];
      const notifUrl = isCustomer ? `/portal/${companySlug}/notifications` : `${getBasePath()}/notifications`;

      toast(newNotif.data?.title || 'New Notification', {
        description: newNotif.data?.message || 'You have a new message.',
        position: 'bottom-right',
        action: {
          label: 'View',
          onClick: () => navigate(newNotif.data?.action_url || notifUrl)
        }
      });
      setLastNotifCount(unreadNotifs.length);
    } else if (unreadNotifs) {
      setLastNotifCount(unreadNotifs.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadNotifs, lastNotifCount, navigate]);

  return (
    <Popover open={notifOpen} onOpenChange={setNotifOpen}>
      <PopoverTrigger asChild>
        <button className={cn('p-2 rounded-lg hover:bg-brand-white border border-transparent hover:border-brand-border transition-colors text-brand-muted hover:text-brand-secondary relative', triggerClassName)}>
          <Mail size={16} />
          {user && (unreadNotifs?.length || 0) > 0 && (
            <span className="absolute top-1 right-1 h-3 w-3 text-[8px] font-bold text-brand-white flex items-center justify-center rounded-full bg-brand-danger shadow-sm">
              {unreadNotifs.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent side={side} align={align} className="w-[360px] p-0 bg-brand-white border border-brand-border shadow-xl rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border bg-brand-surface">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-brand-accent" />
            <span className="text-[13px] font-bold text-brand-primary">Notifications</span>
            {(unreadNotifs?.length || 0) > 0 && (
              <span className="bg-brand-danger text-brand-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                {unreadNotifs.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {(unreadNotifs?.length || 0) > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                className="text-[11px] font-bold text-brand-accent hover:opacity-70 transition-opacity flex items-center gap-1"
              >
                <MailOpen size={12} /> Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Notification List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-brand-border">
          {!allNotifs?.notifications?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center mb-3">
                <Bell size={22} className="text-brand-subtle/40" />
              </div>
              <p className="text-[12px] font-bold text-brand-subtle">No notifications yet</p>
              <p className="text-[11px] text-brand-muted mt-0.5">You're all caught up!</p>
            </div>
          ) : (
            allNotifs.notifications.slice(0, 5).map((notif: any) => (
              <div
                key={notif.id}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-brand-surface transition-colors group ${
                  !notif.read_at ? 'bg-brand-accent/5 border-l-2 border-l-brand-accent' : ''
                }`}
              >
                <div className="mt-0.5">{getNotifIcon(notif.data?.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[12px] font-semibold truncate ${
                    !notif.read_at ? 'text-brand-primary' : 'text-brand-secondary'
                  }`}>
                    {notif.data?.title || 'Notification'}
                  </p>
                  <p className="text-[11px] text-brand-muted leading-snug mt-0.5 line-clamp-2">
                    {notif.data?.message}
                  </p>
                  <p className="text-[10px] text-brand-subtle mt-1">
                    {new Date(notif.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {notif.data?.action_url && (
                    <button
                      onClick={() => { navigate(notif.data.action_url); setNotifOpen(false); }}
                      className="text-brand-accent hover:opacity-70 transition-opacity"
                      title="View"
                    >
                      <ExternalLink size={13} />
                    </button>
                  )}
                  {!notif.read_at && (
                    <button
                      onClick={() => markOneReadMutation.mutate(notif.id)}
                      className="text-[9px] font-bold text-brand-subtle hover:text-brand-primary transition-colors opacity-0 group-hover:opacity-100"
                      title="Mark as read"
                    >
                      <CheckCircle2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-brand-border bg-brand-surface">
          <button
            onClick={() => { navigate(isCustomer ? `/portal/${companySlug}/notifications` : `${getBasePath()}/notifications`); setNotifOpen(false); }}
            className="w-full text-[12px] font-bold text-brand-accent hover:opacity-70 transition-opacity flex items-center justify-center gap-1.5"
          >
            View more <ExternalLink size={12} />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
