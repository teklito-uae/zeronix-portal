import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { mockQuotes } from '@/lib/mockData';
import type { Quote } from '@/types';
import { Plus, FileText, Building2 } from 'lucide-react';

export const Quotes = () => {
  const navigate = useNavigate();
  const [quotes] = useState<Quote[]>(mockQuotes);

  const columns: ColumnDef<Quote>[] = [
    {
      accessorKey: 'id',
      header: 'Quote #',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-zeronix-blue font-medium">
          QT-{String(row.original.id).padStart(4, '0')}
        </span>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-admin-text-primary">{row.original.customer?.name || '—'}</p>
          {row.original.customer?.company && (
            <p className="text-xs text-admin-text-muted flex items-center gap-1 mt-0.5">
              <Building2 size={11} /> {row.original.customer.company}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'total',
      header: 'Total Amount',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium text-admin-text-primary">
          {row.original.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-admin-text-muted text-xs">
          {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'valid_until',
      header: 'Valid Until',
      cell: ({ row }) => (
        <span className="text-admin-text-muted text-xs">
          {row.original.valid_until ? new Date(row.original.valid_until).toLocaleDateString() : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={quotes}
        searchColumn="customer"
        searchPlaceholder="Search quotes..."
        onRowClick={(row) => navigate(`/admin/quotes/${row.id}`)}
        headerAction={
          <Button
            onClick={() => navigate('/admin/quotes/create')}
            className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover h-[38px] rounded-lg text-sm font-medium w-full sm:w-auto"
          >
            <Plus size={16} className="mr-1" /> Create Quote
          </Button>
        }
      />

      {quotes.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-admin-border rounded-xl bg-admin-surface">
          <FileText size={40} className="text-admin-text-muted mb-3" />
          <h3 className="text-lg font-semibold text-admin-text-primary mb-1">No Quotes Found</h3>
          <p className="text-admin-text-secondary">Create a new quote to get started.</p>
        </div>
      )}
    </div>
  );
};
