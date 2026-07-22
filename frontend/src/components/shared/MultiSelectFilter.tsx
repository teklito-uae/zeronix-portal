import { useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';

export interface MultiSelectOption {
  label: string;
  value: string;
  count?: number;
}

interface MultiSelectFilterProps {
  title: string;
  icon: ReactNode;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  className?: string;
}

/** Standalone faceted-filter dropdown: icon + title + selection-count badge,
 * a searchable checklist of options, and a clear action — the shadcn
 * data-table filter pattern (Popover + Command + Checkbox), reused so each
 * filter dimension (Tags, Owner, Status, Industry) renders as its own
 * button in the toolbar instead of being nested inside one shared popover. */
export const MultiSelectFilter = ({ title, icon, options, selected, onChange, className }: MultiSelectFilterProps) => {
  const [open, setOpen] = useState(false);
  const selectedSet = new Set(selected);

  const toggle = (value: string) => {
    onChange(selectedSet.has(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'h-[32px] text-[12px] font-medium rounded-lg border-dashed shadow-sm gap-1.5 px-3',
            selectedSet.size > 0
              ? 'text-brand-accent border-brand-accent/40 bg-brand-accent-light hover:bg-brand-accent-light'
              : 'text-brand-secondary border-brand-border bg-brand-white hover:bg-brand-bg',
            className
          )}
        >
          <span className="[&>svg]:size-[13px] flex items-center">{icon}</span>
          {title}
          {selectedSet.size > 0 && (
            <>
              <span className="h-3.5 w-px bg-brand-border" />
              <Badge variant="secondary" className="h-[18px] px-1.5 text-[10px] rounded">
                {selectedSet.size}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-0 bg-brand-white border-brand-border rounded-xl shadow-lg overflow-hidden">
        <Command>
          <CommandInput placeholder={`Search ${title.toLowerCase()}...`} className="h-9 text-[12px] border-none" />
          <CommandList className="max-h-[260px]">
            <CommandEmpty className="py-4 text-center text-[12px] text-brand-subtle">No results.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const isSelected = selectedSet.has(opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => toggle(opt.value)}
                    className="flex items-center gap-2 px-2 py-1.5 text-[12px] cursor-pointer"
                  >
                    <Checkbox checked={isSelected} className="pointer-events-none" />
                    <span className="flex-1 truncate">{opt.label}</span>
                    {typeof opt.count === 'number' && (
                      <span className="text-[10px] text-brand-subtle font-mono">{opt.count}</span>
                    )}
                    {isSelected && <Check size={12} className="text-brand-accent shrink-0" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedSet.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onChange([])}
                    className="justify-center text-center text-[12px] text-brand-danger cursor-pointer"
                  >
                    Clear filter
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
