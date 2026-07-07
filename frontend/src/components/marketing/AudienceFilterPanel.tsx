import { useResourceList } from '@/hooks/useApi';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User } from '@/types';

interface AudienceFilterPanelProps {
  source: 'customers' | 'leads' | 'contacts';
  filters: Record<string, any>;
  onChange: (filters: Record<string, any>) => void;
}

const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'unresponsive', 'converted', 'lost'];

/**
 * Filter builder shared by Saved Segments and the campaign wizard's
 * audience step. Field set depends on the selected source.
 */
export const AudienceFilterPanel = ({ source, filters, onChange }: AudienceFilterPanelProps) => {
  const { data: usersData } = useResourceList<User>('users', { per_page: 100 });
  const { data: labelsData } = useResourceList<{ id: number; name: string; color: string }>('customer-labels', { per_page: 100 });

  const users: User[] = usersData?.data || [];
  const labels = labelsData?.data || [];

  const set = (key: string, value: any) => {
    const next = { ...filters };
    if (value === '' || value === undefined || value === null || value === 'all' || (Array.isArray(value) && value.length === 0)) {
      delete next[key];
    } else {
      next[key] = value;
    }
    onChange(next);
  };

  const toggleArrayValue = (key: string, value: any) => {
    const current: any[] = filters[key] || [];
    set(key, current.includes(value) ? current.filter((v) => v !== value) : [...current, value]);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Salesperson — all sources */}
      <div className="space-y-1.5">
        <Label className="text-[12px]">Salesperson</Label>
        <Select value={filters.salesperson_id ? String(filters.salesperson_id) : 'all'} onValueChange={(v) => set('salesperson_id', v === 'all' ? '' : Number(v))}>
          <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Any salesperson" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-[13px]">Any salesperson</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={String(u.id)} className="text-[13px]">{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Created between — all sources */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-[12px]">Created after</Label>
          <Input type="date" value={filters.created_after || ''} onChange={(e) => set('created_after', e.target.value)} className="h-9 text-[13px]" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[12px]">Created before</Label>
          <Input type="date" value={filters.created_before || ''} onChange={(e) => set('created_before', e.target.value)} className="h-9 text-[13px]" />
        </div>
      </div>

      {source === 'leads' && (
        <>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-[12px]">Lead status</Label>
            <div className="flex flex-wrap gap-3 pt-1">
              {LEAD_STATUSES.map((status) => (
                <label key={status} className="flex items-center gap-1.5 text-[12px] text-brand-secondary cursor-pointer capitalize">
                  <Checkbox
                    checked={(filters.status || []).includes(status)}
                    onCheckedChange={() => toggleArrayValue('status', status)}
                  />
                  {status}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px]">Lead source</Label>
            <Input value={filters.source || ''} onChange={(e) => set('source', e.target.value)} placeholder="e.g. website" className="h-9 text-[13px]" />
          </div>
          <label className="flex items-center gap-2 text-[12px] text-brand-secondary cursor-pointer pt-6">
            <Checkbox checked={!!filters.exclude_converted} onCheckedChange={(v) => set('exclude_converted', v ? true : '')} />
            Exclude converted leads
          </label>
        </>
      )}

      {(source === 'customers' || source === 'contacts') && labels.length > 0 && (
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-[12px]">Customer labels</Label>
          <div className="flex flex-wrap gap-3 pt-1">
            {labels.map((label: any) => (
              <label key={label.id} className="flex items-center gap-1.5 text-[12px] text-brand-secondary cursor-pointer">
                <Checkbox
                  checked={(filters.label_ids || []).includes(label.id)}
                  onCheckedChange={() => toggleArrayValue('label_ids', label.id)}
                />
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: label.color }} />
                {label.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {source === 'customers' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-[12px]">Min outstanding balance</Label>
              <Input type="number" value={filters.min_outstanding_balance ?? ''} onChange={(e) => set('min_outstanding_balance', e.target.value)} className="h-9 text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">Max outstanding balance</Label>
              <Input type="number" value={filters.max_outstanding_balance ?? ''} onChange={(e) => set('max_outstanding_balance', e.target.value)} className="h-9 text-[13px]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-[12px]">Last purchase after</Label>
              <Input type="date" value={filters.last_purchase_after || ''} onChange={(e) => set('last_purchase_after', e.target.value)} className="h-9 text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">Last purchase before</Label>
              <Input type="date" value={filters.last_purchase_before || ''} onChange={(e) => set('last_purchase_before', e.target.value)} className="h-9 text-[13px]" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-[12px] text-brand-secondary cursor-pointer">
            <Checkbox checked={!!filters.never_purchased} onCheckedChange={(v) => set('never_purchased', v ? true : '')} />
            Never purchased (no invoices)
          </label>
          <div className="space-y-1.5">
            <Label className="text-[12px]">Active since (activity log)</Label>
            <Input type="date" value={filters.active_after || ''} onChange={(e) => set('active_after', e.target.value)} className="h-9 text-[13px]" />
          </div>
        </>
      )}

      {source === 'contacts' && (
        <label className="flex items-center gap-2 text-[12px] text-brand-secondary cursor-pointer pt-6">
          <Checkbox checked={!!filters.primary_only} onCheckedChange={(v) => set('primary_only', v ? true : '')} />
          Primary contacts only
        </label>
      )}
    </div>
  );
};
