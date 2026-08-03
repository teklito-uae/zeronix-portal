import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SbCategory, SbVendor } from '@/types';

const ALL = 'all';

interface ProductFiltersProps {
  vendors: SbVendor[];
  categories: SbCategory[];
  vendorId: number | null;
  categoryId: number | null;
  onVendorChange: (id: number | null) => void;
  onCategoryChange: (id: number | null) => void;
  onClear: () => void;
}

export const ProductFilters = ({
  vendors,
  categories,
  vendorId,
  categoryId,
  onVendorChange,
  onCategoryChange,
  onClear,
}: ProductFiltersProps) => {
  const hasFilters = vendorId !== null || categoryId !== null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={vendorId ? String(vendorId) : ALL}
        onValueChange={(v) => onVendorChange(v === ALL ? null : Number(v))}
      >
        <SelectTrigger className="h-[34px] w-40 text-[12px] rounded-lg font-medium">
          <SelectValue placeholder="Vendor" />
        </SelectTrigger>
        <SelectContent className="max-h-[260px]">
          <SelectItem value={ALL}>All Vendors</SelectItem>
          {vendors.map((v) => (
            <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={categoryId ? String(categoryId) : ALL}
        onValueChange={(v) => onCategoryChange(v === ALL ? null : Number(v))}
      >
        <SelectTrigger className="h-[34px] w-40 text-[12px] rounded-lg font-medium">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent className="max-h-[260px]">
          <SelectItem value={ALL}>All Categories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-[34px] text-[12px] rounded-lg text-brand-subtle font-medium gap-1"
        >
          <X size={13} /> Clear
        </Button>
      )}
    </div>
  );
};
