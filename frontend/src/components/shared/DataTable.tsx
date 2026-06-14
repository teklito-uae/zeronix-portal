import type { ColumnDef, SortingState } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState, Fragment, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  searchColumn?: string;
  onRowClick?: (row: TData) => void;
  pageSize?: number;
  renderRowDetails?: (row: TData) => React.ReactNode;
  headerAction?: React.ReactNode;
  hidePagination?: boolean;
  enableRowSelection?: boolean;
  onSelectionChange?: (selectedRows: TData[]) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  searchColumn,
  onRowClick,
  pageSize = 10,
  renderRowDetails,
  headerAction,
  hidePagination = false,
  enableRowSelection = false,
  onSelectionChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => {
    if (onSelectionChange && table) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(r => r.original);
      onSelectionChange(selectedRows);
    }
  }, [rowSelection]);

  // Inject checkbox column if enabled
  const finalColumns = enableRowSelection
    ? [
        {
          id: 'select',
          header: ({ table }) => (
            <div className="px-2">
              <Checkbox
                checked={
                  table.getIsAllPageRowsSelected()
                    ? true
                    : table.getIsSomePageRowsSelected()
                    ? 'indeterminate'
                    : false
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
              />
            </div>
          ),
          cell: ({ row }) => (
            <div className="px-2" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
              />
            </div>
          ),
          enableSorting: false,
          enableHiding: false,
        } as ColumnDef<TData, TValue>,
        ...columns,
      ]
    : columns;

  const table = useReactTable({
    data,
    columns: finalColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: enableRowSelection,
    state: {
      sorting,
      globalFilter,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Search & Actions */}
      {searchColumn !== undefined && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-subtle" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 h-[30px] text-[12px] bg-brand-white border-brand-border text-brand-primary placeholder:text-brand-subtle focus:border-brand-accent focus:ring-brand-accent/20"
            />
          </div>
          {headerAction && <div className="w-full sm:w-auto">{headerAction}</div>}
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto bg-brand-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-brand-border/50 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                     key={header.id}
                     className="h-10 px-4 text-[12px] font-semibold text-brand-subtle uppercase tracking-wider bg-brand-surface border border-brand-border/50 whitespace-nowrap"
                  >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? 'flex items-center gap-1 cursor-pointer select-none hover:text-admin-text-primary transition-colors'
                              : ''
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <ArrowUpDown size={12} className="text-brand-subtle" />
                          )}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <Fragment key={row.id}>
                    <TableRow
                      data-state={row.getIsSelected() && 'selected'}
                      onClick={() => {
                        if (renderRowDetails) {
                          toggleRow(row.id);
                        }
                        onRowClick?.(row.original);
                      }}
                      className={`border-b border-brand-border/50 last:border-0 bg-brand-white hover:bg-brand-bg transition-colors duration-100 ${
                        (onRowClick || renderRowDetails) ? 'cursor-pointer' : ''
                      } ${expandedRows[row.id] ? 'bg-brand-bg' : ''} ${
                        row.getIsSelected() ? 'bg-brand-accent/5' : ''
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-4 py-2.5 text-[13px] font-medium text-brand-secondary whitespace-nowrap border border-brand-border/50">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    {renderRowDetails && expandedRows[row.id] && (
                      <TableRow className="bg-brand-bg/50 border-b border-brand-border/50 hover:bg-brand-bg/50">
                        <TableCell colSpan={row.getVisibleCells().length} className="p-0">
                          <div className="p-4 border-l-2 border-l-brand-accent animate-in slide-in-from-top-1 duration-200">
                            {renderRowDetails(row.original)}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (enableRowSelection ? 1 : 0)}
                    className="h-24 text-center text-[13px] text-brand-subtle"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

      {/* Pagination */}
      {!hidePagination && table.getPageCount() > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-brand-subtle">
            {table.getFilteredRowModel().rows.length} total rows
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="h-8 w-8 text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-surface-hover disabled:opacity-30"
            >
              <ChevronsLeft size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 w-8 text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-surface-hover disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="px-3 text-sm text-admin-text-secondary">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 w-8 text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-surface-hover disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="h-8 w-8 text-admin-text-muted hover:text-admin-text-primary hover:bg-admin-surface-hover disabled:opacity-30"
            >
              <ChevronsRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
