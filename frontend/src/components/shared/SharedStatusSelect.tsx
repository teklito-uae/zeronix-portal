import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from './StatusBadge';

interface SharedStatusSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

export const SharedStatusSelect = ({ value, onChange, options }: SharedStatusSelectProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 bg-brand-white border-brand-border hover:border-brand-primary/30 transition-colors rounded-lg text-[12px] font-medium shadow-sm">
        <SelectValue placeholder="Select status…" />
      </SelectTrigger>
      <SelectContent className="bg-brand-white border-brand-border rounded-xl shadow-xl overflow-hidden p-1">
        {options.map((option) => (
          <SelectItem 
            key={option} 
            value={option} 
            className="text-[12px] flex items-center cursor-pointer rounded-lg py-2 px-2.5 hover:bg-brand-bg transition-colors focus:bg-brand-bg focus:text-brand-primary"
          >
            <StatusBadge status={option} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
