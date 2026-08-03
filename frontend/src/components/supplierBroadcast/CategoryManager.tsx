import { useState } from 'react';
import { Plus, Tag } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ActionGroup } from '@/components/shared/ActionGroup';
import { PageLoader } from '@/components/shared/PageLoader';
import { useDeleteSbCategory, useSbCategories } from '@/hooks/useSupplierBroadcast';
import { CategoryFormDialog } from './CategoryFormDialog';
import type { SbCategory } from '@/types';

interface CategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export const CategoryManager = ({ open, onOpenChange, canEdit, canDelete }: CategoryManagerProps) => {
  const { data: categories = [], isLoading } = useSbCategories();
  const deleteCategory = useDeleteSbCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SbCategory | null>(null);

  const openAdd = () => {
    setEditingCategory(null);
    setFormOpen(true);
  };

  const openEdit = (category: SbCategory) => {
    setEditingCategory(category);
    setFormOpen(true);
  };

  const handleDelete = (category: SbCategory) => {
    if (!window.confirm(`Delete category "${category.name}"? This cannot be undone.`)) return;
    deleteCategory.mutate(category.id);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-brand-white border-brand-border/50 p-0 flex flex-col gap-0">
          <div className="bg-brand-surface p-6 border-b border-brand-border/50 flex-shrink-0">
            <SheetHeader className="space-y-0 text-left">
              <SheetTitle className="text-[16px] font-semibold text-brand-primary flex items-center gap-3 pr-6">
                <div className="h-10 w-10 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                  <Tag size={20} />
                </div>
                Manage Categories
              </SheetTitle>
              <SheetDescription className="text-[13px] font-medium text-brand-subtle mt-0.5">
                Group vendors and products for easier filtering.
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {canEdit && (
              <Button onClick={openAdd} className="w-full h-9 rounded-lg text-[13px] font-medium mb-3">
                <Plus size={15} className="mr-1.5" /> Add Category
              </Button>
            )}

            {isLoading ? (
              <PageLoader label="Loading categories..." iconSize={24} className="min-h-[200px] gap-2" />
            ) : categories.length === 0 ? (
              <p className="text-[13px] text-brand-subtle text-center py-8">No categories yet.</p>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-brand-border/50 bg-brand-white"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-brand-primary truncate">{category.name}</p>
                      {category.description && (
                        <p className="text-[11px] text-brand-subtle truncate mt-0.5">{category.description}</p>
                      )}
                    </div>
                    <ActionGroup
                      onEdit={canEdit ? () => openEdit(category) : undefined}
                      onDelete={canDelete ? () => handleDelete(category) : undefined}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <CategoryFormDialog open={formOpen} onOpenChange={setFormOpen} category={editingCategory} />
    </>
  );
};
