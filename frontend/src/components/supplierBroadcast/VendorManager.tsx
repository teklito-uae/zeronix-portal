import { useState } from 'react';
import { Plus, Store } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ActionGroup } from '@/components/shared/ActionGroup';
import { PageLoader } from '@/components/shared/PageLoader';
import { useDeleteSbVendor, useSbVendors } from '@/hooks/useSupplierBroadcast';
import { VendorFormDialog } from './VendorFormDialog';
import type { SbVendor } from '@/types';

interface VendorManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export const VendorManager = ({ open, onOpenChange, canEdit, canDelete }: VendorManagerProps) => {
  const { data: vendors = [], isLoading } = useSbVendors();
  const deleteVendor = useDeleteSbVendor();

  const [formOpen, setFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<SbVendor | null>(null);

  const openAdd = () => {
    setEditingVendor(null);
    setFormOpen(true);
  };

  const openEdit = (vendor: SbVendor) => {
    setEditingVendor(vendor);
    setFormOpen(true);
  };

  const handleDelete = (vendor: SbVendor) => {
    if (!window.confirm(`Delete vendor "${vendor.name}"? This cannot be undone.`)) return;
    deleteVendor.mutate(vendor.id);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-brand-white border-brand-border/50 p-0 flex flex-col gap-0">
          <div className="bg-brand-surface p-6 border-b border-brand-border/50 flex-shrink-0">
            <SheetHeader className="space-y-0 text-left">
              <SheetTitle className="text-[16px] font-semibold text-brand-primary flex items-center gap-3 pr-6">
                <div className="h-10 w-10 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                  <Store size={20} />
                </div>
                Manage Vendors
              </SheetTitle>
              <SheetDescription className="text-[13px] font-medium text-brand-subtle mt-0.5">
                Suppliers whose broadcasts are imported into this module.
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {canEdit && (
              <Button onClick={openAdd} className="w-full h-9 rounded-lg text-[13px] font-medium mb-3">
                <Plus size={15} className="mr-1.5" /> Add Vendor
              </Button>
            )}

            {isLoading ? (
              <PageLoader label="Loading vendors..." iconSize={24} className="min-h-[200px] gap-2" />
            ) : vendors.length === 0 ? (
              <p className="text-[13px] text-brand-subtle text-center py-8">No vendors yet.</p>
            ) : (
              <div className="space-y-2">
                {vendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-brand-border/50 bg-brand-white"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold text-brand-primary truncate">{vendor.name}</p>
                        {!vendor.is_active && (
                          <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-brand-subtle truncate mt-0.5">
                        {vendor.phone_e164 || vendor.phone_raw}
                        {vendor.category?.name ? ` · ${vendor.category.name}` : ''}
                      </p>
                    </div>
                    <ActionGroup
                      onEdit={canEdit ? () => openEdit(vendor) : undefined}
                      onDelete={canDelete ? () => handleDelete(vendor) : undefined}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <VendorFormDialog open={formOpen} onOpenChange={setFormOpen} vendor={editingVendor} />
    </>
  );
};
