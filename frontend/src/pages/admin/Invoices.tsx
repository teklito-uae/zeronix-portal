import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DownloadButton } from '@/components/shared/DownloadButton';
import { mockInvoices } from '@/lib/mockData';
import type { Invoice } from '@/types';
import { Receipt, Building2 } from 'lucide-react';

export const Invoices = () => {
  const navigate = useNavigate();
  const [invoices] = useState<Invoice[]>(mockInvoices);

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'id',
      header: 'Invoice #',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-zeronix-blue font-medium">
          INV-{String(row.original.id).padStart(4, '0')}
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
      accessorKey: 'due_date',
      header: 'Due Date',
      cell: ({ row }) => (
        <span className={`text-xs ${
          row.original.status === 'overdue' ? 'text-danger font-medium' : 'text-admin-text-muted'
        }`}>
          {row.original.due_date ? new Date(row.original.due_date).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-admin-text-muted text-xs">
          {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DownloadButton type="invoice" id={row.original.id} variant="ghost" size="sm" />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={invoices}
        searchColumn="customer"
        searchPlaceholder="Search invoices..."
        onRowClick={(row) => navigate(`/admin/invoices/${row.id}`)}
      />

      {invoices.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-admin-border rounded-xl bg-admin-surface">
          <Receipt size={40} className="text-admin-text-muted mb-3" />
          <h3 className="text-lg font-semibold text-admin-text-primary mb-1">No Invoices Found</h3>
          <p className="text-admin-text-secondary">Converted quotes will appear here as invoices.</p>
        </div>
      )}
    </div>
  );
};
