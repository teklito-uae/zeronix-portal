import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import api from '@/lib/axios';
import { parseSupplierData, type ParsedProduct } from '@/lib/parsingUtils';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle, Trash2, Send } from 'lucide-react';
import { toast } from 'sonner';

export const BulkImport = () => {
  const [rawData, setRawData] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [parsedItems, setParsedItems] = useState<ParsedProduct[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch Suppliers
  const { data: suppliersData, isLoading: loadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await api.get('/admin/suppliers');
      return res.data;
    }
  });

  const suppliers = suppliersData?.data || [];

  // Fetch Categories
  const { data: categoriesData, isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/admin/categories');
      return res.data;
    }
  });

  const categories = categoriesData?.data || [];

  const handleParse = () => {
    if (!rawData.trim()) return;
    if (!selectedCategory) {
      toast.error('Please select a category first');
      return;
    }
    
    const items = parseSupplierData(rawData, categories);
    // Apply global category to all items
    const itemsWithCategory = items.map(item => ({
      ...item,
      category_id: parseInt(selectedCategory)
    }));
    
    setParsedItems(itemsWithCategory);
    toast.success(`Analyzed ${itemsWithCategory.length} products`);
  };

  const handleUpdateItem = (index: number, field: keyof ParsedProduct, value: any) => {
    const updated = [...parsedItems];
    updated[index] = { ...updated[index], [field]: value };
    setParsedItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setParsedItems(parsedItems.filter((_, i) => i !== index));
  };

  const handleSync = async () => {
    if (!selectedSupplier) {
      toast.error('Please select a supplier first');
      return;
    }
    
    setIsSyncing(true);
    try {
      await api.post('/admin/bulk-import/sync', {
        supplier_id: parseInt(selectedSupplier),
        products: parsedItems
      });
      toast.success('Synchronization completed successfully!');
      setParsedItems([]);
      setRawData('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const columns: ColumnDef<ParsedProduct>[] = [
    {
      accessorKey: 'name',
      header: 'Product Name & Model',
      cell: ({ row }) => (
        <div className="flex flex-col gap-1 min-w-[300px]">
          <Input 
            value={row.original.name} 
            onChange={(e) => handleUpdateItem(row.index, 'name', e.target.value)}
            className="h-8 text-xs bg-transparent border-transparent hover:border-admin-border"
          />
          <div className="flex gap-2 items-center">
            <span className="text-[10px] text-admin-text-muted font-mono uppercase">Code:</span>
            <Input 
              value={row.original.model_code || ''} 
              onChange={(e) => handleUpdateItem(row.index, 'model_code', e.target.value)}
              placeholder="No code found"
              className="h-6 text-[10px] py-0 px-1 bg-transparent border-transparent hover:border-admin-border w-24"
            />
          </div>
        </div>
      )
    },
    {
      accessorKey: 'price',
      header: 'Price (AED)',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Input 
            type="number"
            value={row.original.price || ''} 
            onChange={(e) => handleUpdateItem(row.index, 'price', parseFloat(e.target.value))}
            className={`h-8 w-24 text-xs font-bold ${!row.original.price ? 'border-red-500 bg-red-500/10' : 'bg-transparent border-admin-border'}`}
          />
          {!row.original.price && <AlertCircle size={14} className="text-red-500" />}
        </div>
      )
    },
    {
      accessorKey: 'specs',
      header: 'Specs',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {Object.entries(row.original.specs).map(([key, val]: any) => (
            <Badge key={key} variant="outline" className="text-[10px] py-0 px-1 border-admin-border bg-admin-bg/50">
              {key}: {val}
            </Badge>
          ))}
          {Object.keys(row.original.specs).length === 0 && <span className="text-[10px] text-admin-text-muted italic">None</span>}
        </div>
      )
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(row.index)} className="h-8 w-8 text-admin-text-muted hover:text-red-500">
          <Trash2 size={16} />
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6 pt-2">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-admin-surface border border-admin-border rounded-xl p-6 shadow-sm space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-admin-text-primary">1. Select Supplier</label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger className="bg-admin-bg border-admin-border h-11">
                  <SelectValue placeholder={loadingSuppliers ? "Loading..." : "Choose Supplier"} />
                </SelectTrigger>
                <SelectContent className="bg-admin-surface border-admin-border">
                  {suppliers?.map((s: any) => (
                    <SelectItem key={s.id} value={s.id.toString()} className="hover:bg-admin-surface-hover cursor-pointer">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-admin-text-primary">2. Select Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-admin-bg border-admin-border h-11">
                  <SelectValue placeholder={loadingCategories ? "Loading..." : "Choose Category"} />
                </SelectTrigger>
                <SelectContent className="bg-admin-surface border-admin-border">
                  {categories?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id.toString()} className="hover:bg-admin-surface-hover cursor-pointer">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-admin-text-primary">3. Paste Data</label>
              <Textarea 
                placeholder="▪️ Dell Precision 5490 | 32 GB RAM | 1 TB SSD..." 
                className="min-h-[400px] font-mono text-xs bg-admin-bg border-admin-border focus:ring-zeronix-blue"
                value={rawData}
                onChange={(e) => setRawData(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleParse} 
              disabled={!rawData.trim() || loadingCategories || !selectedCategory}
              className="w-full bg-zeronix-blue hover:bg-zeronix-blue-hover text-white h-11 font-semibold"
            >
              Analyze & Preview
            </Button>
          </div>
        </div>

        <div className="lg:col-span-2">
          {parsedItems.length > 0 ? (
            <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
              <div className="p-4 border-b border-admin-border flex justify-between items-center bg-admin-bg/50">
                <div className="flex items-center gap-2">
                  <Badge className="bg-zeronix-blue text-white">{parsedItems.length}</Badge>
                  <span className="text-sm font-medium text-admin-text-primary">Products Ready to Sync</span>
                </div>
                <Button 
                  onClick={handleSync} 
                  disabled={isSyncing}
                  className="bg-success hover:bg-success-hover text-white px-6 font-bold"
                >
                  {isSyncing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Send size={16} className="mr-2" />}
                  Confirm & Sync to Database
                </Button>
              </div>
              
              <div className="flex-1 overflow-auto max-h-[600px]">
                <DataTable 
                  data={parsedItems} 
                  columns={columns} 
                  hidePagination={true}
                />
              </div>
            </div>
          ) : (
            <div className="bg-admin-surface border border-admin-border border-dashed rounded-xl h-full min-h-[500px] flex flex-col items-center justify-center p-12 text-center text-admin-text-muted">
              <div className="h-16 w-16 bg-admin-bg rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-lg font-semibold text-admin-text-primary mb-2">No Data Analyzed</h3>
              <p className="text-sm max-w-xs">
                Paste your supplier broadcast data or product list in the left panel and click "Analyze" to see the preview here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
