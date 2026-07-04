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
import { Plus, Search, Filter, X, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Mail, Calendar, Bell, Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import { cn } from '@/lib/utils';
import { SEO } from './SEO';
import { PageLoader } from './PageLoader';
import { EmptyState } from './EmptyState';

interface FilterConfig {
  name: string;
  label: string;
  placeholder: string;
  options: { label: string; value: string }[];
}

interface ResourceListingPageProps<T> {
  resource: string;
  title: string;
  subtitle?: string; // Kept for SEO/legacy compat but not rendered in the main UI
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
  extraActions?: React.ReactNode;
  leftActions?: React.ReactNode; // For module-specific left buttons like 'Table View'
  tabs?: { id: string; label: string }[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  baseFilters?: Record<string, any>;
  customContent?: React.ReactNode;
  topContent?: React.ReactNode;
  enableRowSelection?: boolean;
  floatingBulkActions?: (selectedIds: number[], clearSelection: () => void) => React.ReactNode;
}

export function ResourceListingPage<T extends { id: number }>({
  resource,
  title,
  columns,
  onRowClick,
  createPath,
  createLabel = 'Add New',
  filters = [],
  searchPlaceholder = 'Search...',
  onBulkUpdate,
  selectedIds = [],
  setSelectedIds,
  onCreateClick,
  extraActions,
  leftActions,
  icon,
  tabs,
  activeTab,
  onTabChange,
  baseFilters = {},
  customContent,
  topContent,
  enableRowSelection = false,
  floatingBulkActions,
}: ResourceListingPageProps<T>) {
  const navigate = useNavigate();
  const { theme, toggle } = useThemeStore();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState('10');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [goToPageInput, setGoToPageInput] = useState('');

  // Sync search input with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch data
  const queryParams = {
    page,
    search: search || undefined,
    per_page: Number(perPage),
    ...activeFilters,
    ...baseFilters,
  };

  const { data: resourceData, isLoading } = useResourceList<T>(resource, queryParams);

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

  // Pagination helpers
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(lastPage, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          variant="ghost"
          onClick={() => setPage(i)}
          className={cn(
            "h-8 w-8 p-0 rounded-md text-sm font-semibold transition-colors",
            page === i
              ? "bg-zeronix-blue text-white hover:bg-zeronix-blue-hover hover:text-white"
              : "text-admin-text-secondary hover:bg-admin-surface-hover"
          )}
        >
          {i}
        </Button>
      );
    }
    return buttons;
  };

  const handleGoToPage = () => {
    const p = parseInt(goToPageInput);
    if (!isNaN(p) && p >= 1 && p <= lastPage) {
      setPage(p);
      setGoToPageInput('');
    }
  };


  return (
    <div className="bg-brand-white md:border border-brand-border md:rounded-xl shadow-sm flex flex-col h-full overflow-hidden animate-in fade-in duration-200">
      <SEO title={title} />

      {/* Header Inside Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-5 py-3 md:py-4 gap-3 md:gap-0 border-b border-brand-border bg-brand-white flex-shrink-0">
        
        {/* Top Row on Mobile: Title + Notification Icons */}
        <div className="flex items-center justify-between w-full md:w-auto">
          {/* Left: Title */}
          <div className="flex items-center gap-4 md:gap-6">
            <h1 className="text-[16px] md:text-[18px] font-bold text-brand-primary flex items-center gap-2">
              {icon && React.cloneElement(icon as React.ReactElement, { size: 18, className: "text-brand-subtle" } as any)}
              {title}
            </h1>
          </div>

          {/* Mobile Right: Notification Icons */}
          <div className="flex md:hidden items-center gap-3">
            <button className="text-brand-subtle hover:text-brand-primary transition-colors" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { 'key': 'k', 'metaKey': true }))}>
              <Search size={18} />
            </button>
            <button onClick={() => toggle()} className="text-brand-subtle hover:text-brand-primary transition-colors relative">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="text-brand-subtle hover:text-brand-primary transition-colors relative">
              <Bell size={18} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand-danger rounded-full border border-brand-white"></span>
            </button>
          </div>
        </div>

        {/* Desktop Search */}
        <div className="hidden md:flex relative w-80 items-center mx-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-subtle" size={14} />
          <div className="w-full h-[34px] bg-brand-surface border border-brand-border rounded-lg flex items-center pl-9 pr-3 text-[13px] text-brand-subtle cursor-pointer hover:bg-brand-bg transition-colors" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { 'key': 'k', 'metaKey': true }))}>
            <span className="flex-1 text-left truncate min-w-0">Search {title.toLowerCase()} globally...</span>
            <kbd className="hidden sm:inline-block flex-shrink-0 text-[10px] bg-brand-white border border-brand-border rounded px-1.5 py-0.5 ml-2 font-mono text-brand-muted">⌘K</kbd>
          </div>
        </div>

        {/* Right Section: Buttons + Desktop Icons */}
        <div className="flex flex-col md:flex-row md:items-center w-full md:w-auto gap-3 md:gap-4 mt-1 md:mt-0">
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            {extraActions}
            {createPath && (
              <Button
                onClick={() => onCreateClick ? onCreateClick() : navigate(createPath)}
                className="w-full md:w-auto text-[13px] font-medium px-4 h-[34px] rounded-lg transition-all shadow-sm"
              >
                {createLabel}
              </Button>
            )}
          </div>

          {/* Desktop Notification Icons */}
          <div className="hidden md:flex items-center gap-3 border-l border-brand-border/50 pl-4">
            <button className="text-brand-subtle hover:text-brand-primary transition-colors" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { 'key': 'k', 'metaKey': true }))}>
              <Search size={18} />
            </button>
            <button onClick={() => toggle()} className="text-brand-subtle hover:text-brand-primary transition-colors relative">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="text-brand-subtle hover:text-brand-primary transition-colors">
              <Mail size={18} />
            </button>
            <button className="text-brand-subtle hover:text-brand-primary transition-colors">
              <Calendar size={18} />
            </button>
            <button className="text-brand-subtle hover:text-brand-primary transition-colors relative">
              <Bell size={18} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand-danger rounded-full border border-brand-white"></span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {tabs && tabs.length > 0 && (
        <div className="px-5 border-b border-brand-border bg-brand-white flex items-center gap-6 flex-shrink-0 overflow-x-auto no-scrollbar">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={cn(
                  "py-3.5 text-[13px] whitespace-nowrap transition-colors border-b-2",
                  isActive
                    ? "font-semibold text-brand-primary border-brand-accent"
                    : "font-medium text-brand-subtle hover:text-brand-primary border-transparent"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Toolbar */}
      {!customContent && (
        <div className="px-4 md:px-5 py-3 flex flex-col xl:flex-row xl:items-center justify-between border-b border-brand-border/50 bg-brand-white gap-3 flex-shrink-0">
          
          {/* Left Side: Search & Default Filters */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 w-full xl:w-auto">
            
            <div className="relative w-full sm:w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-subtle" size={14} />
              <Input
                placeholder={searchPlaceholder}
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="pl-8 h-[32px] text-[12px] bg-brand-white border-brand-border rounded-lg shadow-sm w-full"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">

              {filters.length > 0 && filters.map((filter) => (
                <Select
                  key={filter.name}
                  value={activeFilters[filter.name] || 'all'}
                  onValueChange={(val) => handleFilterChange(filter.name, val)}
                >
                  <SelectTrigger className="h-[32px] w-auto text-[12px] bg-brand-white border-brand-border rounded-lg hover:bg-brand-bg px-3 min-w-[140px] max-w-[200px] font-medium text-brand-secondary shadow-sm">
                    <SelectValue placeholder={filter.label} />
                  </SelectTrigger>
                  <SelectContent className="bg-brand-white border-brand-border rounded-xl shadow-sm">
                    <SelectItem value="all" className="text-[12px] font-medium">All {filter.label}</SelectItem>
                    {filter.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-[12px]">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}

              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="h-[32px] px-2 text-brand-danger hover:text-brand-danger text-[12px]">
                  <X size={13} className="mr-1" /> Clear
                </Button>
              )}
            </div>
          </div>

          {/* Right Side: Custom Actions (leftActions) & Bulk Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full xl:w-auto mt-2 xl:mt-0">
            {leftActions && (
              <div className="w-full xl:w-auto">
                {leftActions}
              </div>
            )}
            
            {selectedIds.length > 0 && onBulkUpdate && (
              <Button
                variant="outline"
                className="w-full sm:w-auto h-[32px] text-[12px] text-brand-danger border-brand-border hover:bg-brand-danger-bg shadow-sm"
                onClick={() => onBulkUpdate(selectedIds)}
              >
                Delete Selected ({selectedIds.length})
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Top Content */}
      {topContent && (
        <div className="px-5 pt-4 pb-2 bg-brand-white flex-shrink-0">
          {topContent}
        </div>
      )}

      {/* Table Body / Custom Content */}
      <div className="flex-1 overflow-auto bg-brand-white px-5 pb-5 pt-2 relative">
        {selectedIds.length > 0 && floatingBulkActions && (
          <div className="absolute bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-5 fade-in duration-200">
            {floatingBulkActions(selectedIds, () => setSelectedIds?.([]))}
          </div>
        )}
        
        {customContent ? (
          customContent
        ) : isLoading && page === 1 ? (
          <PageLoader label="Loading data..." iconSize={32} className="h-full min-h-[300px] gap-3" />
        ) : data.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No results found"
            description={
              search || Object.values(activeFilters).some(v => v !== '')
                ? "We couldn't find any results matching your filters. Try adjusting your search."
                : `Start by creating your first ${title}.`
            }
            actionLabel={hasActiveFilters ? 'Clear all filters' : undefined}
            onAction={hasActiveFilters ? clearFilters : undefined}
          />
        ) : (
          <DataTable
            columns={columns}
            data={data}
            onRowClick={onRowClick}
            hidePagination={true}
            enableRowSelection={enableRowSelection || !!onBulkUpdate}
            onSelectionChange={(rows) => setSelectedIds?.(rows.map(r => r.id))}
          />
        )}
      </div>

      {/* Pagination */}
      {!customContent && data.length > 0 && (
        <div className="px-5 py-3 border-t border-brand-border bg-brand-white flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
          <div className="text-[12px] text-brand-subtle font-medium">
            Showing <span className="text-brand-primary">{(page - 1) * Number(perPage) + 1}</span> to <span className="text-brand-primary">{Math.min(page * Number(perPage), total)}</span> of <span className="text-brand-primary">{total}</span> results
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-brand-subtle">Rows:</span>
              <Select value={perPage} onValueChange={(v) => { setPerPage(v); setPage(1); }}>
                <SelectTrigger className="h-[30px] w-16 text-[12px] bg-brand-white border-brand-border shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-brand-white border-brand-border">
                  <SelectItem value="10" className="text-[12px]">10</SelectItem>
                  <SelectItem value="25" className="text-[12px]">25</SelectItem>
                  <SelectItem value="50" className="text-[12px]">50</SelectItem>
                  <SelectItem value="100" className="text-[12px]">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-[30px] w-[30px] rounded-lg border-brand-border shadow-sm" onClick={() => setPage(1)} disabled={page === 1}>
                <ChevronsLeft size={14} className="text-brand-secondary" />
              </Button>
              <Button variant="outline" size="icon" className="h-[30px] w-[30px] rounded-lg border-brand-border shadow-sm" onClick={() => setPage(prev => Math.max(1, prev - 1))} disabled={page === 1}>
                <ChevronLeft size={14} className="text-brand-secondary" />
              </Button>
              <div className="flex items-center gap-1 px-2">
                {renderPaginationButtons()}
              </div>
              <Button variant="outline" size="icon" className="h-[30px] w-[30px] rounded-lg border-brand-border shadow-sm" onClick={() => setPage(prev => Math.min(lastPage, prev + 1))} disabled={page === lastPage || lastPage === 0}>
                <ChevronRight size={14} className="text-brand-secondary" />
              </Button>
              <Button variant="outline" size="icon" className="h-[30px] w-[30px] rounded-lg border-brand-border shadow-sm" onClick={() => setPage(lastPage)} disabled={page === lastPage || lastPage === 0}>
                <ChevronsRight size={14} className="text-brand-secondary" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
