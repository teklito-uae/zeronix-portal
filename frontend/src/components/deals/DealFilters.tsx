import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal } from 'lucide-react';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

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

  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);

  const activeFilterCount = useMemo(
    () => [filters.ownerId, filters.companyId, filters.tagId, filters.priority].filter(Boolean).length,
    [filters.ownerId, filters.companyId, filters.tagId, filters.priority]
  );

  // width/size passed in so the same controls can render as fixed-width
  // inline selects (desktop row) or full-width stacked selects (mobile sheet).
  const ownerSelect = (widthClass: string) => (
    <Select
      value={filters.ownerId ? String(filters.ownerId) : ALL}
      onValueChange={(v) => onChange('ownerId', v === ALL ? null : Number(v))}
    >
      <SelectTrigger className={`h-[34px] ${widthClass} text-[12px] rounded-lg font-medium`}>
        <SelectValue placeholder="Owner" />
      </SelectTrigger>
      <SelectContent className="max-h-[260px]">
        <SelectItem value={ALL}>All Owners</SelectItem>
        {users.map((u) => (
          <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const companySelect = (widthClass: string) => (
    <Select
      value={filters.companyId ? String(filters.companyId) : ALL}
      onValueChange={(v) => onChange('companyId', v === ALL ? null : Number(v))}
    >
      <SelectTrigger className={`h-[34px] ${widthClass} text-[12px] rounded-lg font-medium`}>
        <SelectValue placeholder="Company" />
      </SelectTrigger>
      <SelectContent className="max-h-[260px]">
        <SelectItem value={ALL}>All Companies</SelectItem>
        {companies.map((c) => (
          <SelectItem key={c.id} value={String(c.id)}>{c.company || c.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const pipelineStub = (widthClass: string) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Deliberate stub per the approved plan: multi-pipeline support
              isn't built yet, but the filter slot is reserved so the row
              layout doesn't shift once it lands. */}
          <div className="inline-block">
            <Select value="default" disabled>
              <SelectTrigger className={`h-[34px] ${widthClass} text-[12px] rounded-lg font-medium opacity-60 cursor-not-allowed`}>
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
  );

  const tagSelect = (widthClass: string) => (
    <Select
      value={filters.tagId ? String(filters.tagId) : ALL}
      onValueChange={(v) => onChange('tagId', v === ALL ? null : Number(v))}
    >
      <SelectTrigger className={`h-[34px] ${widthClass} text-[12px] rounded-lg font-medium`}>
        <SelectValue placeholder="Tag" />
      </SelectTrigger>
      <SelectContent className="max-h-[260px]">
        <SelectItem value={ALL}>All Tags</SelectItem>
        {tags.map((t) => (
          <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const prioritySelect = (widthClass: string) => (
    <Select
      value={filters.priority ?? ALL}
      onValueChange={(v) => onChange('priority', v === ALL ? null : v)}
    >
      <SelectTrigger className={`h-[34px] ${widthClass} text-[12px] rounded-lg font-medium`}>
        <SelectValue placeholder="Priority" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All Priorities</SelectItem>
        {PRIORITIES.map((p) => (
          <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

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

      {/* Inline filter row — unchanged, md and up */}
      <div className="hidden md:flex md:flex-wrap md:items-center gap-2">
        {ownerSelect('w-36')}
        {isSuperAdmin && companySelect('w-40')}
        {pipelineStub('w-40')}
        {tagSelect('w-36')}
        {prioritySelect('w-32')}
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

      {/* Collapsed "Filters" trigger — below md */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setFiltersSheetOpen(true)}
        className="md:hidden h-[34px] text-[12px] rounded-lg font-medium gap-1.5"
      >
        <SlidersHorizontal size={13} />
        Filters
        {activeFilterCount > 0 && (
          <span className="flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-brand-accent text-white text-[10px] font-bold">
            {activeFilterCount}
          </span>
        )}
      </Button>

      <Sheet open={filtersSheetOpen} onOpenChange={setFiltersSheetOpen}>
        <SheetContent
          side="bottom"
          className="md:hidden rounded-t-2xl border-t border-brand-border p-0 flex flex-col gap-0"
          style={{ maxHeight: '85dvh' }}
        >
          <SheetHeader className="shrink-0 gap-0 space-y-0">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-brand-border rounded-full" />
            </div>
            <div className="px-5 pb-3">
              <SheetTitle className="text-base font-bold text-brand-primary text-left">Filters</SheetTitle>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-3">
            {ownerSelect('w-full')}
            {isSuperAdmin && companySelect('w-full')}
            {pipelineStub('w-full')}
            {tagSelect('w-full')}
            {prioritySelect('w-full')}
          </div>

          <div className="px-5 py-3 border-t border-brand-border/60 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onReset();
                setFiltersSheetOpen(false);
              }}
              className="w-full h-10 text-[13px] rounded-lg text-brand-subtle font-medium"
            >
              Reset filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
