import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { useState, Fragment } from 'react';
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

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  searchColumn?: string;
  onRowClick?: (row: TData) => void;
  pageSize?: number;
  renderRowDetails?: (row: TData) => React.ReactNode;
  headerAction?: React.ReactNode;
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

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      globalFilter,
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
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 h-[38px] bg-admin-surface border-admin-border text-admin-text-primary placeholder:text-admin-text-muted focus:border-zeronix-blue focus:ring-zeronix-blue/20"
            />
          </div>
          {headerAction && <div className="w-full sm:w-auto">{headerAction}</div>}
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-xl border border-admin-border bg-admin-surface overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b border-admin-border hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="h-11 px-4 text-[13px] font-semibold uppercase tracking-wider text-admin-text-secondary bg-admin-surface whitespace-nowrap"
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
                            <ArrowUpDown size={14} className="text-admin-text-muted" />
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
                      className={`border-b border-admin-border last:border-0 bg-admin-surface hover:bg-admin-surface-hover transition-colors duration-100 ${
                        (onRowClick || renderRowDetails) ? 'cursor-pointer' : ''
                      } ${expandedRows[row.id] ? 'bg-admin-surface-hover' : ''}`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-4 py-3 text-sm text-admin-text-primary whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    {renderRowDetails && expandedRows[row.id] && (
                      <TableRow className="bg-admin-bg/50 border-b border-admin-border animate-in fade-in slide-in-from-top-1 duration-200">
                        <TableCell colSpan={columns.length} className="p-0">
                          <div className="p-4 bg-admin-bg/30 border-l-4 border-l-zeronix-blue whitespace-normal">
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
                    colSpan={columns.length}
                    className="h-24 text-center text-admin-text-muted"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-admin-text-muted">
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
