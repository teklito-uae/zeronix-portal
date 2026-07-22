import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Building2, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import api from '@/lib/axios';

export interface PartyOption {
  id: number;
  name: string;
  company?: string | null;
  contact_person?: string | null;
  outstanding_balance?: number | null;
}

interface PartySearchProps {
  kind: 'customer' | 'supplier';
  endpoint: string;
  searchMode: 'server' | 'client';
  value?: number;
  selected?: PartyOption | null;
  onSelect: (party: PartyOption) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Searchable customer/supplier picker. Customers use server-side `?search=`
 * (CustomerController@index supports it); suppliers have no search endpoint
 * so they fall back to a capped list filtered client-side.
 */
export const PartySearch = ({ kind, endpoint, searchMode, value, selected, onSelect, disabled, placeholder, className }: PartySearchProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: clientList = [] } = useQuery({
    queryKey: [endpoint, 'all'],
    queryFn: async () => (await api.get(`${endpoint}?per_page=100`)).data.data as PartyOption[],
    enabled: searchMode === 'client',
    staleTime: 60_000,
  });

  const { data: serverList = [], isFetching } = useQuery({
    queryKey: [endpoint, 'search', debounced],
    queryFn: async () => (await api.get(`${endpoint}?search=${encodeURIComponent(debounced)}&per_page=20`)).data.data as PartyOption[],
    enabled: searchMode === 'server' && open,
    staleTime: 15_000,
  });

  const options = searchMode === 'server' ? serverList : clientList;

  const activeOption = useMemo(() => {
    if (!value) return undefined;
    return options.find((o) => o.id === value) || (selected && selected.id === value ? selected : undefined);
  }, [options, value, selected]);

  const Icon = kind === 'customer' ? Building2 : Truck;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          aria-expanded={open}
          className={cn("w-full justify-between h-11 bg-admin-bg border-admin-border text-sm text-left rounded-xl shadow-sm font-normal", className)}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
            <Icon className={cn("shrink-0", activeOption ? "text-zeronix-blue" : "text-admin-text-muted")} size={15} />
            <span className="flex-1 truncate text-sm text-admin-text-primary">
              {activeOption ? activeOption.name : (placeholder || `Search ${kind}s…`)}
            </span>
            {activeOption?.company && (
              <span className="text-[11px] text-admin-text-muted opacity-60 truncate hidden sm:inline">{activeOption.company}</span>
            )}
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-admin-surface border-admin-border shadow-md rounded-md overflow-hidden" align="start">
        <Command shouldFilter={searchMode === 'client'} className="bg-admin-surface">
          <CommandInput
            placeholder={`Type to search ${kind}s…`}
            value={search}
            onValueChange={setSearch}
            className="h-9 border-none text-sm"
          />
          <CommandList className="max-h-[280px]">
            <CommandEmpty className="py-4 text-center text-sm text-admin-text-muted">
              {searchMode === 'server' && isFetching ? 'Searching…' : `No ${kind}s found.`}
            </CommandEmpty>
            <CommandGroup className="px-1">
              {options.map((opt) => (
                <CommandItem
                  key={opt.id}
                  value={opt.name}
                  onSelect={() => { onSelect(opt); setOpen(false); setSearch(''); }}
                  className="flex items-center gap-2 px-2 py-2 rounded cursor-pointer text-sm"
                >
                  <Icon size={13} className={cn(value === opt.id ? "text-zeronix-blue" : "text-admin-text-muted")} />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium text-admin-text-primary truncate">{opt.name}</span>
                    {(opt.company || opt.contact_person) && (
                      <span className="text-[11px] text-admin-text-muted mt-0.5 truncate">{opt.company || opt.contact_person}</span>
                    )}
                  </div>
                  {!!opt.outstanding_balance && Number(opt.outstanding_balance) > 0 && (
                    <span className="text-[10px] font-mono text-amber-600 shrink-0">{Number(opt.outstanding_balance).toLocaleString()} due</span>
                  )}
                  <Check className={cn("h-3.5 w-3.5 shrink-0", value === opt.id ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
