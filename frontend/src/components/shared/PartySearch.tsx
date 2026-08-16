import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Building2, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/shared/Avatar';
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
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { CurrencyAmount } from '@/components/shared/CurrencyAmount';

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
  const currency = useCurrencyStore((s) => s.currency);
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
  // Customers are companies first — show a letter avatar + company name only,
  // no secondary contact-person line (the person is already covered by the Contacts module).
  const isCompanyStyle = kind === 'customer';
  const labelFor = (opt: PartyOption) => (isCompanyStyle ? (opt.company || opt.name) : opt.name);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          aria-expanded={open}
          className={cn("w-full justify-between h-11 bg-brand-bg border-brand-border text-sm text-left rounded-xl shadow-sm font-normal", className)}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
            {isCompanyStyle ? (
              activeOption ? (
                <Avatar name={labelFor(activeOption)} className="h-6 w-6 text-[10px] shrink-0" />
              ) : (
                <Icon className="shrink-0 text-brand-subtle" size={15} />
              )
            ) : (
              <Icon className={cn("shrink-0", activeOption ? "text-brand-accent" : "text-brand-subtle")} size={15} />
            )}
            <span className="flex-1 truncate text-sm text-brand-primary">
              {activeOption ? labelFor(activeOption) : (placeholder || `Search ${kind}s…`)}
            </span>
            {!isCompanyStyle && activeOption?.company && (
              <span className="text-[11px] text-brand-subtle opacity-60 truncate hidden sm:inline">{activeOption.company}</span>
            )}
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-brand-white border-brand-border shadow-md rounded-md overflow-hidden" align="start">
        <Command shouldFilter={searchMode === 'client'} className="bg-brand-white">
          <CommandInput
            placeholder={`Type to search ${kind}s…`}
            value={search}
            onValueChange={setSearch}
            className="h-9 border-none text-sm"
          />
          <CommandList className="max-h-[280px]">
            <CommandEmpty className="py-4 text-center text-sm text-brand-subtle">
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
                  {isCompanyStyle ? (
                    <Avatar name={labelFor(opt)} className="h-7 w-7 text-[11px] shrink-0" />
                  ) : (
                    <Icon size={13} className={cn(value === opt.id ? "text-brand-accent" : "text-brand-subtle")} />
                  )}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium text-brand-primary truncate">{labelFor(opt)}</span>
                    {!isCompanyStyle && (opt.company || opt.contact_person) && (
                      <span className="text-[11px] text-brand-subtle mt-0.5 truncate">{opt.company || opt.contact_person}</span>
                    )}
                  </div>
                  {!!opt.outstanding_balance && Number(opt.outstanding_balance) > 0 && (
                    <span className="text-[10px] font-mono text-amber-600 shrink-0 inline-flex items-center gap-0.5">
                      <CurrencyAmount amount={opt.outstanding_balance} currency={currency} /> due
                    </span>
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
