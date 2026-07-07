import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { StatCard } from '@/components/shared/StatCard';
import { PageLoader } from '@/components/shared/PageLoader';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, RefreshCw, X, ListOrdered, Clock, AlertTriangle, Ban } from 'lucide-react';

const STATUS_TABS = ['all', 'pending', 'queued', 'sending', 'deferred', 'failed', 'bounced'];

export const MarketingQueue = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['marketing/queue', status, search, page],
    queryFn: async () =>
      (
        await api.get('/admin/marketing/queue', {
          params: { status: status === 'all' ? undefined : status, search: search || undefined, page, per_page: 25 },
        })
      ).data,
    refetchInterval: 15000,
  });

  const rows = data?.data || [];
  const stats = data?.stats || {};

  const act = async (recipientId: number, action: 'retry' | 'cancel') => {
    try {
      await api.post(`/admin/marketing/queue/${recipientId}/${action}`);
      toast.success(action === 'retry' ? 'Queued for retry' : 'Message cancelled');
      queryClient.invalidateQueries({ queryKey: ['marketing/queue'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <MarketingLayout title="Email Queue">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard title="Pending" value={stats.pending ?? 0} icon={<Clock size={16} />} />
        <StatCard title="Queued" value={stats.queued ?? 0} icon={<ListOrdered size={16} />} />
        <StatCard title="Deferred" value={stats.deferred ?? 0} icon={<AlertTriangle size={16} />} />
        <StatCard title="Failed / Bounced" value={(stats.failed ?? 0) + (stats.bounced ?? 0)} icon={<Ban size={16} />} />
      </div>

      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`h-8 px-3 rounded-md text-[12px] font-medium border capitalize transition-colors ${
                status === s ? 'bg-brand-accent text-white border-brand-accent' : 'bg-brand-white text-brand-secondary border-brand-border'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-subtle" size={14} />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search email..." className="pl-8 h-9 text-[13px]" />
        </div>
      </div>

      {isLoading ? (
        <PageLoader label="Loading queue..." />
      ) : rows.length === 0 ? (
        <EmptyState icon={ListOrdered} title="Queue is empty" description="No messages match this filter." />
      ) : (
        <div className="bg-brand-white border border-brand-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[12px]">Recipient</TableHead>
                <TableHead className="text-[12px]">Campaign</TableHead>
                <TableHead className="text-[12px]">Status</TableHead>
                <TableHead className="text-[12px]">SMTP Account</TableHead>
                <TableHead className="text-[12px]">Attempts</TableHead>
                <TableHead className="text-[12px]">Updated</TableHead>
                <TableHead className="text-[12px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="text-[13px] font-medium">{r.name || r.email}</p>
                    <p className="text-[11px] text-brand-subtle">{r.email}</p>
                    {r.last_error && <p className="text-[10px] text-brand-danger truncate max-w-[220px]">{r.last_error}</p>}
                  </TableCell>
                  <TableCell>
                    <button
                      className="text-[12px] text-brand-accent hover:underline"
                      onClick={() => navigate(`/workspace/marketing/campaigns/${r.campaign?.id}`)}
                    >
                      {r.campaign?.name}
                    </button>
                  </TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-[12px] text-brand-subtle">{r.smtp_account?.label || '—'}</TableCell>
                  <TableCell className="text-[12px]">{r.attempts}</TableCell>
                  <TableCell className="text-[12px] text-brand-subtle">{new Date(r.updated_at).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {['failed', 'deferred', 'bounced'].includes(r.status) && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => act(r.id, 'retry')}><RefreshCw size={13} /></Button>
                      )}
                      {['pending', 'queued', 'deferred'].includes(r.status) && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-brand-danger" onClick={() => act(r.id, 'cancel')}><X size={13} /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {data?.last_page > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="h-8 text-[12px]">Previous</Button>
          <span className="text-[12px] text-brand-subtle self-center">Page {page} of {data.last_page}</span>
          <Button variant="outline" size="sm" disabled={page === data.last_page} onClick={() => setPage((p) => p + 1)} className="h-8 text-[12px]">Next</Button>
        </div>
      )}
    </MarketingLayout>
  );
};
