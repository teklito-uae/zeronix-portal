import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { MarketingVariableGroup } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Braces } from 'lucide-react';
import { useState } from 'react';

interface VariableMenuProps {
  onInsert: (token: string) => void;
}

export const VariableMenu = ({ onInsert }: VariableMenuProps) => {
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['marketing-variables'],
    queryFn: async () => {
      const res = await api.get('/admin/marketing/variables');
      return res.data.data as MarketingVariableGroup[];
    },
    staleTime: Infinity,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" type="button" className="h-8 text-[12px] gap-1.5">
          <Braces size={13} />
          Insert Variable
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[300px]" align="end">
        <Command>
          <CommandInput placeholder="Search variables..." className="text-[13px]" />
          <CommandList className="max-h-[320px]">
            <CommandEmpty>No variables found.</CommandEmpty>
            {(data || []).map((group) => (
              <CommandGroup key={group.group} heading={group.group}>
                {group.variables.map((variable) => (
                  <CommandItem
                    key={variable.token}
                    value={`${group.group} ${variable.token} ${variable.label}`}
                    onSelect={() => {
                      onInsert(variable.token);
                      setOpen(false);
                    }}
                    className="text-[12px] flex justify-between gap-2"
                  >
                    <span>{variable.label}</span>
                    <code className="text-[10px] text-brand-subtle">{variable.token}</code>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
