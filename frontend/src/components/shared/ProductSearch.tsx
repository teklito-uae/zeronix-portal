import * as React from "react"
import { Check, ChevronsUpDown, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Product } from "@/types"

interface ProductSearchProps {
  products: Product[];
  selectedProductId?: number;
  onSelect: (product: any) => void;
  className?: string;
}

export const ProductSearch = ({ products, selectedProductId, onSelect, className }: ProductSearchProps) => {
  const [open, setOpen] = React.useState(false);
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-auto min-h-[36px] py-1.5 bg-admin-bg border-admin-border text-sm text-left rounded-md", className)}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
            <Package className={cn("shrink-0", selectedProduct ? "text-zeronix-blue" : "text-admin-text-muted")} size={14} />
            <span className="flex-1 whitespace-normal break-words text-sm">
              {selectedProduct ? selectedProduct.name : "Search products…"}
            </span>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-admin-surface border-admin-border shadow-md rounded-md overflow-hidden" align="start">
        <Command className="bg-admin-surface">
          <CommandInput placeholder="Type to search…" className="h-9 border-none text-sm" />
          <CommandList className="max-h-[280px]">
            <CommandEmpty className="py-4 text-center text-sm text-admin-text-muted">No products found.</CommandEmpty>
            <CommandGroup className="px-1">
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => { onSelect(product); setOpen(false); }}
                  className="flex items-center gap-2 px-2 py-2 rounded cursor-pointer text-sm"
                >
                  <Package size={13} className={cn(selectedProductId === product.id ? "text-zeronix-blue" : "text-admin-text-muted")} />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium text-admin-text-primary whitespace-normal break-words leading-snug">{product.name}</span>
                    {product.price != null && (
                      <span className="text-[11px] text-admin-text-muted font-mono mt-0.5">{Number(product.price).toLocaleString()} AED</span>
                    )}
                  </div>
                  <Check className={cn("h-3.5 w-3.5 shrink-0", selectedProductId === product.id ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
