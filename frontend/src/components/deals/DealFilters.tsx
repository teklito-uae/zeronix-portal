import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import type { DealsFilters } from '@/store/useDealsFiltersStore';
import type { Customer, Tag, User } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DealFiltersProps {
  filters: DealsFilters;
  onChange: <K extends keyof DealsFilters>(key: K, value: DealsFilters[K]) => void;
  onReset: () => void;
}

const PRIORITIES: { id: string; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'high', label: 'High' },
  { id: 'urgent', label: 'Urgent' },
];

const ALL = 'all';

export const DealFilters = ({ filters, onChange, onReset }: DealFiltersProps) => {
  const admin = useAuthStore((s) => s.admin);
  const isSuperAdmin = admin?.role === 'super_admin';

  // Debounce the search box locally (~300ms) before pushing into the
  // shared filters store, so every keystroke doesn't trigger a refetch.
  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput !== filters.search) onChange('search', searchInput);
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const { data: users = [] } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () => (await api.get('/admin/users?per_page=100')).data.data as User[],
    staleTime: 5 * 60 * 1000,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: async () => (await api.get('/admin/customers?per_page=100')).data.data as Customer[],
    enabled: isSuperAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => (await api.get('/admin/tags')).data as Tag[],
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 md:px-5 py-2.5 border-b border-brand-border bg-brand-white flex-shrink-0">
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-subtle" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search deals..."
          className="h-[34px] pl-8 text-[12px] rounded-lg"
        />
      </div>

      <Select
        value={filters.ownerId ? String(filters.ownerId) : ALL}
        onValueChange={(v) => onChange('ownerId', v === ALL ? null : Number(v))}
      >
        <SelectTrigger className="h-[34px] w-36 text-[12px] rounded-lg font-medium">
          <SelectValue placeholder="Owner" />
        </SelectTrigger>
        <SelectContent className="max-h-[260px]">
          <SelectItem value={ALL}>All Owners</SelectItem>
          {users.map((u) => (
            <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isSuperAdmin && (
        <Select
          value={filters.companyId ? String(filters.companyId) : ALL}
          onValueChange={(v) => onChange('companyId', v === ALL ? null : Number(v))}
        >
          <SelectTrigger className="h-[34px] w-40 text-[12px] rounded-lg font-medium">
            <SelectValue placeholder="Company" />
          </SelectTrigger>
          <SelectContent className="max-h-[260px]">
            <SelectItem value={ALL}>All Companies</SelectItem>
            {companies.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.company || c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {/* Deliberate stub per the approved plan: multi-pipeline support
                isn't built yet, but the filter slot is reserved so the row
                layout doesn't shift once it lands. */}
            <div className="inline-block">
              <Select value="default" disabled>
                <SelectTrigger className="h-[34px] w-40 text-[12px] rounded-lg font-medium opacity-60 cursor-not-allowed">
                  <SelectValue placeholder="Default Pipeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Pipeline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TooltipTrigger>
          <TooltipContent>Multiple pipelines coming soon</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Select
        value={filters.tagId ? String(filters.tagId) : ALL}
        onValueChange={(v) => onChange('tagId', v === ALL ? null : Number(v))}
      >
        <SelectTrigger className="h-[34px] w-36 text-[12px] rounded-lg font-medium">
          <SelectValue placeholder="Tag" />
        </SelectTrigger>
        <SelectContent className="max-h-[260px]">
          <SelectItem value={ALL}>All Tags</SelectItem>
          {tags.map((t) => (
            <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.priority ?? ALL}
        onValueChange={(v) => onChange('priority', v === ALL ? null : v)}
      >
        <SelectTrigger className="h-[34px] w-32 text-[12px] rounded-lg font-medium">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All Priorities</SelectItem>
          {PRIORITIES.map((p) => (
            <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="h-[34px] text-[12px] rounded-lg text-brand-subtle font-medium"
      >
        Reset
      </Button>
    </div>
  );
};
