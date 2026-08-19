import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle2, Calendar, Link as LinkIcon, MailOpen, AlertTriangle } from 'lucide-react';
import { SEO } from '@/components/shared/SEO';
import { PageLoader } from '@/components/shared/PageLoader';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/apiError';

interface AppNotification {
  id: string;
  read_at: string | null;
  created_at: string;
  data: {
    type?: string;
    title?: string;
    message?: string;
    action_url?: string;
  };
}

interface NotificationsResponse {
  unread_count: number;
  notifications: AppNotification[];
}

export const Notifications = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => (await api.get<NotificationsResponse>(`/admin/notifications`)).data
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/notifications/${id}/mark-read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to mark notification as read'))
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.post(`/admin/notifications/mark-read`),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to mark notifications as read'))
  });

  const getIcon = (type?: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-emerald-500" size={18} />;
      case 'error': return <AlertTriangle className="text-red-500" size={18} />;
      case 'warning': return <AlertTriangle className="text-amber-500" size={18} />;
      default: return <Bell className="text-brand-accent" size={18} />;
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="System Notifications" description="View and manage system alerts." />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-accent/10 rounded-lg shrink-0">
            <Bell size={20} className="text-brand-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-brand-primary tracking-tight">NOTIFICATIONS</h2>
              {(notifications?.unread_count ?? 0) > 0 && (
                <span className="bg-red-500 text-white text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                  {notifications?.unread_count} NEW
                </span>
              )}
            </div>
            <p className="text-xs text-brand-subtle font-medium hidden sm:block">Stay updated with portal activities and system alerts.</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => markAllReadMutation.mutate()}
          className="h-9 text-xs font-bold border-brand-border text-brand-primary hover:bg-brand-white transition-all gap-2 shrink-0"
          disabled={!notifications?.notifications?.length}
        >
          <MailOpen size={14} /> <span className="hidden sm:inline">Mark All as Read</span><span className="sm:hidden">Read All</span>
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <PageLoader
            label="Loading Notifications..."
            iconSize={32}
            className="py-20 bg-brand-white border border-dashed border-brand-border rounded-xl"
          />
        ) : (notifications?.notifications?.length ?? 0) > 0 ? (
          notifications?.notifications.map((notif: AppNotification) => (
            <Card key={notif.id} className={`bg-brand-white border-brand-border shadow-sm transition-all hover:border-brand-accent/20 ${notif.read_at ? 'opacity-70' : 'border-l-4 border-l-brand-accent'}`}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className="mt-1">
                   {getIcon(notif.data.type)}
                </div>
                <div className="flex-1 space-y-1">
                   <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-brand-primary">{notif.data.title}</h4>
                      <p className="text-[10px] text-brand-subtle flex items-center gap-1 font-medium">
                        <Calendar size={10} /> {new Date(notif.created_at).toLocaleString()}
                      </p>
                   </div>
                   <p className="text-sm text-brand-secondary leading-relaxed">
                     {notif.data.message}
                   </p>
                   <div className="flex items-center gap-2 mt-3 pt-2 border-t border-brand-border/50">
                      {notif.data.action_url && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(notif.data.action_url as string)}
                          className="h-7 text-[10px] font-bold bg-brand-accent/10 text-brand-accent hover:bg-brand-accent hover:text-white"
                        >
                          <LinkIcon size={12} className="mr-1.5" /> View Related Record
                        </Button>
                      )}
                      {!notif.read_at && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => markReadMutation.mutate(notif.id)}
                          className="h-7 text-[10px] font-bold text-brand-subtle hover:text-brand-primary"
                        >
                          Mark as Read
                        </Button>
                      )}
                   </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
             <div className="w-16 h-16 bg-brand-bg rounded-full flex items-center justify-center mb-4 border border-brand-border">
                <Bell size={32} className="text-brand-subtle/20" />
             </div>
             <h3 className="text-lg font-bold text-brand-primary mb-1 tracking-tight">NO NOTIFICATIONS</h3>
             <p className="text-sm text-brand-secondary max-w-[250px] mx-auto">
                You're all caught up! New alerts will appear here when they arrive.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};
