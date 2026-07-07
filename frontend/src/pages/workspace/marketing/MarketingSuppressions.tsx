import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useQueryClient } from '@tanstack/react-query';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { ResourceListingPage } from '@/components/shared/ResourceListingPage';
import { ActionGroup } from '@/components/shared/ActionGroup';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Ban } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import type { MarketingSuppression } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  unsubscribe: 'Unsubscribe',
  hard_bounce: 'Hard Bounce',
  spam: 'Spam Complaint',
  invalid: 'Invalid Address',
  blocked_domain: 'Blocked Domain',
  manual: 'Manual',
};

export const MarketingSuppressions = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [kind, setKind] = useState<'email' | 'domain'>('email');
  const [values, setValues] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const columns: ColumnDef<MarketingSuppression>[] = [
    { accessorKey: 'value', header: 'Value', cell: ({ row }) => <span className="text-[13px] font-medium text-brand-primary">{row.original.value}</span> },
    { accessorKey: 'kind', header: 'Kind', cell: ({ row }) => <span className="text-[12px] text-brand-subtle capitalize">{row.original.kind}</span> },
    { accessorKey: 'type', header: 'Reason', cell: ({ row }) => <StatusBadge status={row.original.type === 'unsubscribe' ? 'unsubscribed' : row.original.type === 'hard_bounce' ? 'bounced' : row.original.type} className="normal-case" /> },
    { accessorKey: 'creator', header: 'Added by', cell: ({ row }) => <span className="text-[12px] text-brand-subtle">{row.original.creator?.name || 'System'}</span> },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <ActionGroup
          onDelete={async () => {
            try {
              await api.delete(`/admin/marketing/suppressions/${row.original.id}`);
              queryClient.invalidateQueries({ queryKey: ['marketing/suppressions'] });
              toast.success('Suppression removed');
            } catch (err: any) {
              toast.error(err.response?.data?.message || 'Failed to remove suppression');
            }
          }}
        />
      ),
    },
  ];

  const save = async () => {
    const list = values.split(/[\n,]/).map((v) => v.trim()).filter(Boolean);
    if (list.length === 0) {
      toast.error('Enter at least one value');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/admin/marketing/suppressions', { kind, values: list, notes: notes || undefined });
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ['marketing/suppressions'] });
      setDialogOpen(false);
      setValues('');
      setNotes('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add suppressions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MarketingLayout title="Suppressions">
      <ResourceListingPage<MarketingSuppression>
        resource="marketing/suppressions"
        title="Suppression List"
        icon={<Ban />}
        columns={columns}
        searchPlaceholder="Search suppressed emails/domains..."
        onCreateClick={() => setDialogOpen(true)}
        createPath="#"
        createLabel="Add Suppression"
        filters={[
          { name: 'kind', label: 'Kind', placeholder: 'Kind', options: [{ label: 'Email', value: 'email' }, { label: 'Domain', value: 'domain' }] },
          {
            name: 'type', label: 'Reason', placeholder: 'Reason', options: Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })),
          },
        ]}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Add Suppressions</DialogTitle>
            <DialogDescription className="text-[12px]">Suppressed emails and domains are automatically excluded from every future campaign.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[12px]">Kind</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as any)}>
                <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email" className="text-[13px]">Email addresses</SelectItem>
                  <SelectItem value="domain" className="text-[13px]">Domains</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">{kind === 'email' ? 'Emails (one per line or comma-separated)' : 'Domains (one per line, e.g. spamtrap.com)'}</Label>
              <Textarea value={values} onChange={(e) => setValues(e.target.value)} placeholder={kind === 'email' ? 'john@example.com\njane@example.com' : 'spamtrap.com'} className="min-h-[120px] text-[13px] font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">Notes (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[60px] text-[13px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-[13px]">Cancel</Button>
            <Button onClick={save} disabled={saving} className="text-[13px] gap-1.5 bg-brand-primary">
              <Plus size={14} /> {saving ? 'Adding…' : 'Add to Suppression List'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MarketingLayout>
  );
};
