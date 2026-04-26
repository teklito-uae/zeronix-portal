import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from './DataTable';
import { useResourceList } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Loader2, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SEO } from './SEO';

interface FilterConfig {
  name: string;
  label: string;
  placeholder: string;
  options: { label: string; value: string }[];
}

interface ResourceListingPageProps<T> {
  resource: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  columns: ColumnDef<T>[];
  onRowClick?: (row: T) => void;
  createPath?: string;
  createLabel?: string;
  filters?: FilterConfig[];
  searchPlaceholder?: string;
  onBulkUpdate?: (ids: number[]) => void;
  selectedIds?: number[];
  setSelectedIds?: (ids: number[]) => void;
  onCreateClick?: () => void;
}

export function ResourceListingPage<T extends { id: number }>({
  resource,
  title,
  subtitle,
  icon,
  columns,
  onRowClick,
  createPath,
  createLabel = 'Create',
  filters = [],
  searchPlaceholder = 'Search...',
  onBulkUpdate,
  selectedIds = [],
  setSelectedIds,
  onCreateClick,
}: ResourceListingPageProps<T>) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  // Sync search input with debounce
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch data
  const { data: resourceData, isLoading } = useResourceList<T>(resource, {
    page,
    search,
    per_page: 15,
    ...activeFilters,
  });

  const data = resourceData?.data || [];
  const total = resourceData?.total || 0;
  const lastPage = resourceData?.last_page || 1;

  const handleFilterChange = (name: string, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [name]: value === 'all' ? '' : value
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setActiveFilters({});
    setPage(1);
  };

  const hasActiveFilters = search || Object.values(activeFilters).some(v => v !== '');

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <SEO title={title} />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-zeronix-blue/10 rounded-xl text-zeronix-blue">
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-bold text-admin-text-primary tracking-tight">{title}</h2>
            {subtitle && <p className="text-xs text-admin-text-muted mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {createPath && (
          <Button
            onClick={() => onCreateClick ? onCreateClick() : navigate(createPath)}
            className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover h-10 px-4 rounded-xl font-medium shadow-sm transition-all active:scale-95"
          >
            <Plus size={18} className="mr-1.5" /> {createLabel}
          </Button>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && onBulkUpdate && (
        <div className="flex items-center justify-between p-3 bg-zeronix-blue/5 border border-zeronix-blue/20 rounded-xl animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-zeronix-blue">{selectedIds.length} items selected</span>
            <div className="h-4 w-px bg-zeronix-blue/20" />
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkUpdate(selectedIds)}
              className="h-8 border-zeronix-blue/30 text-zeronix-blue hover:bg-zeronix-blue hover:text-white rounded-lg"
            >
              Bulk Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds?.([])}
              className="h-8 text-admin-text-muted hover:text-danger rounded-lg"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 group">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted group-focus-within:text-zeronix-blue transition-colors" />
            <Input
              placeholder={searchPlaceholder}
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="pl-10 h-11 bg-admin-surface border-admin-border text-admin-text-primary rounded-xl focus:ring-zeronix-blue/10 transition-all shadow-sm"
            />
          </div>
          {filters.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "h-11 px-4 rounded-xl border-admin-border transition-all",
                showFilters || Object.values(activeFilters).some(v => v !== '')
                  ? "bg-zeronix-blue/5 border-zeronix-blue text-zeronix-blue"
                  : "bg-admin-surface text-admin-text-secondary"
              )}
            >
              <Filter size={16} className="mr-2" />
              Filters
              {Object.values(activeFilters).filter(v => v !== '').length > 0 && (
                <span className="ml-2 w-5 h-5 rounded-full bg-zeronix-blue text-white text-[10px] flex items-center justify-center font-bold">
                  {Object.values(activeFilters).filter(v => v !== '').length}
                </span>
              )}
            </Button>
          )}
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} className="h-11 px-4 text-admin-text-muted hover:text-danger hover:bg-danger/5 rounded-xl">
              <X size={16} className="mr-1" /> Clear
            </Button>
          )}
        </div>

        {showFilters && filters.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-admin-surface border border-admin-border rounded-xl animate-in slide-in-from-top-2 duration-200 shadow-sm">
            {filters.map((f) => (
              <div key={f.name} className="space-y-1.5">
                <label className="text-[11px] font-bold text-admin-text-muted uppercase tracking-wider ml-1">{f.label}</label>
                <Select
                  value={activeFilters[f.name] || 'all'}
                  onValueChange={v => handleFilterChange(f.name, v)}
                >
                  <SelectTrigger className="h-10 bg-admin-bg border-admin-border text-sm rounded-lg focus:ring-zeronix-blue/10">
                    <SelectValue placeholder={f.placeholder} />
                  </SelectTrigger>
                  <SelectContent className="bg-admin-surface border-admin-border rounded-xl shadow-xl">
                    <SelectItem value="all">All {f.label}s</SelectItem>
                    {f.options.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shadow-sm transition-all">
        {isLoading && page === 1 ? (
          <div className="flex flex-col items-center justify-center h-96 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-zeronix-blue" />
            <p className="text-sm font-medium text-admin-text-muted animate-pulse">Loading {resource}...</p>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={data}
              onRowClick={onRowClick}
              hidePagination={true}
            />

            {/* Standardized Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-admin-border bg-admin-surface/50">
              <p className="text-xs font-medium text-admin-text-muted">
                Showing <span className="text-admin-text-primary">{(page - 1) * 15 + 1}</span> to <span className="text-admin-text-primary">{Math.min(page * 15, total)}</span> of <span className="text-admin-text-primary">{total}</span> {resource}
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-9 px-4 rounded-lg border-admin-border bg-admin-surface hover:bg-admin-surface-hover text-xs font-semibold shadow-sm transition-all"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-admin-text-primary">Page {page}</span>
                  <span className="text-xs text-admin-text-muted">/</span>
                  <span className="text-xs text-admin-text-muted">{lastPage}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= lastPage}
                  className="h-9 px-4 rounded-lg border-admin-border bg-admin-surface hover:bg-admin-surface-hover text-xs font-semibold shadow-sm transition-all"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {!isLoading && data.length === 0 && (
        <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-admin-border rounded-2xl bg-admin-surface/50 animate-in fade-in zoom-in duration-300">
          <div className="p-4 bg-admin-bg rounded-full mb-4 text-admin-text-muted/30">
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 40 }) : icon}
          </div>
          <h3 className="text-lg font-bold text-admin-text-primary mb-1">No {resource} found</h3>
          <p className="text-sm text-admin-text-secondary max-w-xs mx-auto">
            {search || Object.values(activeFilters).some(v => v !== '')
              ? "We couldn't find any results matching your filters. Try adjusting your search."
              : `Start by creating your first ${resource.slice(0, -1)}.`}
          </p>
          {hasActiveFilters && (
            <Button variant="link" onClick={clearFilters} className="mt-2 text-zeronix-blue">
              Clear all filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
