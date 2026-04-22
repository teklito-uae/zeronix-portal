import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { mockProducts, mockBrands, mockCategories } from '@/lib/mockData';
import type { Product } from '@/types';
import { Plus, Trash2, MoreHorizontal, Pencil } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

export const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: '',
    part_number: '',
    model_number: '',
    brand_id: '',
    category_id: '',
    description: '',
  });
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([]);

  const openAdd = () => {
    setEditingProduct(null);
    setForm({ name: '', part_number: '', model_number: '', brand_id: '', category_id: '', description: '' });
    setSpecs([{ key: '', value: '' }]);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      part_number: product.part_number || '',
      model_number: product.model_number || '',
      brand_id: String(product.brand_id || ''),
      category_id: String(product.category_id || ''),
      description: product.description || '',
    });
    setSpecs(
      product.specs
        ? Object.entries(product.specs).map(([key, value]) => ({ key, value }))
        : [{ key: '', value: '' }]
    );
    setDialogOpen(true);
  };

  const handleSave = () => {
    const specsObj = specs
      .filter((s) => s.key.trim())
      .reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);

    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                ...form,
                brand_id: form.brand_id ? Number(form.brand_id) : null,
                category_id: form.category_id ? Number(form.category_id) : null,
                specs: specsObj,
                brand: mockBrands.find((b) => b.id === Number(form.brand_id)),
                category: mockCategories.find((c) => c.id === Number(form.category_id)),
              }
            : p
        )
      );
    } else {
      const newProduct: Product = {
        id: Math.max(...products.map((p) => p.id)) + 1,
        ...form,
        brand_id: form.brand_id ? Number(form.brand_id) : null,
        category_id: form.category_id ? Number(form.category_id) : null,
        specs: specsObj,
        brand: mockBrands.find((b) => b.id === Number(form.brand_id)),
        category: mockCategories.find((c) => c.id === Number(form.category_id)),
        created_at: new Date().toISOString(),
        suppliers_count: 0,
      };
      setProducts((prev) => [newProduct, ...prev]);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingId) {
      setProducts((prev) => prev.filter((p) => p.id !== deletingId));
      setDeleteOpen(false);
      setDeletingId(null);
    }
  };

  const addSpecRow = () => setSpecs([...specs, { key: '', value: '' }]);
  const removeSpecRow = (index: number) => setSpecs(specs.filter((_, i) => i !== index));
  const updateSpec = (index: number, field: 'key' | 'value', val: string) => {
    setSpecs(specs.map((s, i) => (i === index ? { ...s, [field]: val } : s)));
  };

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'part_number',
      header: 'Part Number',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-zeronix-blue">
          {row.original.part_number || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Product Name',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-admin-text-primary">{row.original.name}</p>
          {row.original.model_number && (
            <p className="font-mono text-xs text-admin-text-muted mt-0.5">{row.original.model_number}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'brand',
      header: 'Brand',
      cell: ({ row }) => (
        <Badge variant="secondary" className="bg-zeronix-blue/10 text-zeronix-blue border-0 text-xs">
          {row.original.brand?.name || '—'}
        </Badge>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <span className="text-admin-text-secondary text-sm">{row.original.category?.name || '—'}</span>
      ),
    },
    {
      accessorKey: 'suppliers_count',
      header: 'Suppliers',
      cell: ({ row }) => (
        <span className="text-admin-text-secondary">{row.original.suppliers_count || 0}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-surface-hover"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-admin-surface border-admin-border">
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); openEdit(row.original); }}
              className="text-admin-text-secondary hover:bg-admin-surface-hover cursor-pointer"
            >
              <Pencil size={14} className="mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); setDeletingId(row.original.id); setDeleteOpen(true); }}
              className="text-danger hover:bg-admin-surface-hover cursor-pointer"
            >
              <Trash2 size={14} className="mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={products}
        searchColumn="name"
        searchPlaceholder="Search products..."
        onRowClick={(row) => navigate(`/admin/products/${row.id}`)}
        headerAction={
          <Button
            onClick={openAdd}
            className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover h-[38px] rounded-lg text-sm font-medium w-full sm:w-auto"
          >
            <Plus size={16} className="mr-1" /> Add Product
          </Button>
        }
      />

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-admin-surface border-admin-border sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-admin-text-primary">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
            <DialogDescription className="text-admin-text-secondary">
              {editingProduct ? 'Update product details.' : 'Enter product information.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-admin-text-secondary text-sm">Product Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary focus:border-zeronix-blue"
                  placeholder="Product name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-admin-text-secondary text-sm">Part Number</Label>
                  <Input
                    value={form.part_number}
                    onChange={(e) => setForm({ ...form, part_number: e.target.value })}
                    className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary font-mono focus:border-zeronix-blue"
                    placeholder="e.g. S7-1500-CPU"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-admin-text-secondary text-sm">Model Number</Label>
                  <Input
                    value={form.model_number}
                    onChange={(e) => setForm({ ...form, model_number: e.target.value })}
                    className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary font-mono focus:border-zeronix-blue"
                    placeholder="e.g. 6ES7 515-2AM02-0AB0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-admin-text-secondary text-sm">Brand</Label>
                  <Select value={form.brand_id} onValueChange={(val) => setForm({ ...form, brand_id: val })}>
                    <SelectTrigger className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary">
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent className="bg-admin-surface border-admin-border">
                      {mockBrands.map((brand) => (
                        <SelectItem key={brand.id} value={String(brand.id)} className="text-admin-text-primary hover:bg-admin-surface-hover">
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-admin-text-secondary text-sm">Category</Label>
                  <Select value={form.category_id} onValueChange={(val) => setForm({ ...form, category_id: val })}>
                    <SelectTrigger className="h-[38px] bg-admin-bg border-admin-border text-admin-text-primary">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-admin-surface border-admin-border">
                      {mockCategories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)} className="text-admin-text-primary hover:bg-admin-surface-hover">
                          {cat.parent_id ? `  └ ${cat.name}` : cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-admin-text-secondary text-sm">Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="bg-admin-bg border-admin-border text-admin-text-primary focus:border-zeronix-blue resize-none"
                  placeholder="Product description..."
                  rows={3}
                />
              </div>
            </div>

            {/* Specs Builder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-admin-text-primary font-semibold">Specifications</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addSpecRow}
                  className="text-zeronix-blue hover:bg-zeronix-blue/10 h-7 text-xs"
                >
                  <Plus size={14} className="mr-1" /> Add Spec
                </Button>
              </div>
              <div className="space-y-2">
                {specs.map((spec, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      value={spec.key}
                      onChange={(e) => updateSpec(i, 'key', e.target.value)}
                      placeholder="Key (e.g. Power)"
                      className="h-[34px] bg-admin-bg border-admin-border text-admin-text-primary text-sm focus:border-zeronix-blue flex-1"
                    />
                    <Input
                      value={spec.value}
                      onChange={(e) => updateSpec(i, 'value', e.target.value)}
                      placeholder="Value (e.g. 4 kW)"
                      className="h-[34px] bg-admin-bg border-admin-border text-admin-text-primary text-sm focus:border-zeronix-blue flex-1"
                    />
                    {specs.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSpecRow(i)}
                        className="h-[34px] w-[34px] text-admin-text-muted hover:text-danger hover:bg-admin-surface-hover flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-admin-text-secondary hover:bg-admin-surface-hover">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.name}
              className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover"
            >
              {editingProduct ? 'Save Changes' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Product"
        description="Are you sure you want to delete this product?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
};
