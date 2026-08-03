import { useState } from 'react';
import { ClipboardPaste } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/shared/Spinner';
import { useCreateSbBroadcast, useSbCategories, useSbVendors } from '@/hooks/useSupplierBroadcast';

const NONE = 'none';

interface PasteImportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PasteImportDrawer = ({ open, onOpenChange }: PasteImportDrawerProps) => {
  const [vendorId, setVendorId] = useState<string>(NONE);
  const [categoryId, setCategoryId] = useState<string>(NONE);
  const [rawText, setRawText] = useState('');

  const { data: vendors = [] } = useSbVendors();
  const { data: categories = [] } = useSbCategories();
  const createBroadcast = useCreateSbBroadcast();

  const reset = () => {
    setVendorId(NONE);
    setCategoryId(NONE);
    setRawText('');
  };

  const handleImport = () => {
    createBroadcast.mutate(
      {
        vendor_id: vendorId === NONE ? null : Number(vendorId),
        category_id: categoryId === NONE ? null : Number(categoryId),
        raw_text: rawText,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl bg-brand-white border-brand-border/50 p-0 flex flex-col gap-0">
        <div className="bg-brand-surface p-6 border-b border-brand-border/50 flex-shrink-0">
          <SheetHeader className="space-y-0 text-left">
            <SheetTitle className="text-[16px] font-semibold text-brand-primary flex items-center gap-3 pr-6">
              <div className="h-10 w-10 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                <ClipboardPaste size={20} />
              </div>
              Import Broadcast
            </SheetTitle>
            <SheetDescription className="text-[13px] font-medium text-brand-subtle mt-0.5">
              Paste a supplier's WhatsApp price-list text below. It will be parsed into individual product rows.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Vendor</Label>
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger className="h-[36px] text-[13px] rounded-lg">
                  <SelectValue placeholder="Select vendor (optional)" />
                </SelectTrigger>
                <SelectContent className="max-h-[260px]">
                  <SelectItem value={NONE}>Unassigned</SelectItem>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <Label className="text-[12px] font-medium text-brand-secondary ml-1">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="h-[36px] text-[13px] rounded-lg">
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent className="max-h-[260px]">
                  <SelectItem value={NONE}>Unassigned</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-brand-secondary ml-1">Broadcast Text *</Label>
            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={'Paste the WhatsApp message here, e.g.\n\niPhone 13 128GB - AED 1800\nSamsung S22 8/128 - AED 1400'}
              className="min-h-[280px] font-mono text-[12px] resize-none rounded-xl"
            />
            <p className="text-[11px] text-brand-subtle">
              The parser never fails — rows it can't confidently read still get imported with a
              low-confidence flag so you can review and edit them afterwards.
            </p>
          </div>
        </div>

        <div className="p-6 pt-2 flex-shrink-0">
          <SheetFooter className="gap-2 sm:justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-lg text-[13px] font-medium">
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!rawText.trim() || createBroadcast.isPending}
              className="flex-1 bg-brand-primary text-brand-white hover:opacity-90 h-[36px] rounded-lg font-medium text-[13px] shadow-sm transition-all"
            >
              {createBroadcast.isPending ? <Spinner size={16} className="mr-2" /> : null}
              Import Broadcast
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
};
