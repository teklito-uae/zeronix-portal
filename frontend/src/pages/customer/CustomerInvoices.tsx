import { useState } from 'react';
import { mockInvoices } from '@/lib/mockData';
import type { Invoice } from '@/types';
import { DataTable } from '@/components/shared/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Receipt, CheckSquare } from 'lucide-react';

export const CustomerInvoices = () => {
  const customerId = 3; // Mock
  const [data, setData] = useState<Invoice[]>(mockInvoices.filter(i => i.customer_id === customerId));

  const handleConfirmDelivery = (id: number) => {
    if(confirm('Are you sure you have received the delivery for this invoice? This will notify the admin for final verification.')) {
      setData(prev => prev.map(i => {
        if (i.id === id) {
          return { ...i, status: 'delivered' };
        }
        return i;
      }));
      alert('Delivery receipt submitted. Awaiting admin verification.');
    }
  };

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'invoice_number',
      header: 'Invoice #',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium text-zeronix-blue">
          {row.getValue('invoice_number')}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => {
        const date = row.getValue('created_at') as string;
        return <span className="text-sm text-admin-text-secondary">{new Date(date).toLocaleDateString()}</span>;
      },
    },
    {
      accessorKey: 'due_date',
      header: 'Due Date',
      cell: ({ row }) => {
        const date = row.getValue('due_date') as string;
        const isOverdue = new Date(date) < new Date() && row.original.status === 'sent';
        return (
          <span className={`text-sm ${isOverdue ? 'text-danger font-medium' : 'text-admin-text-secondary'}`}>
            {new Date(date).toLocaleDateString()}
          </span>
        );
      },
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('total'));
        return <div className="font-medium text-admin-text-primary text-right">${amount.toFixed(2)}</div>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const invoice = row.original;
        // Assume 'paid' or 'shipped' (if we had such status) are candidates for delivery.
        // For demonstration, any paid invoice can be marked delivered if not already.
        const canConfirmDelivery = invoice.status === 'paid';
        
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-admin-text-secondary hover:text-zeronix-blue">
              <Receipt size={16} />
            </Button>
            {canConfirmDelivery && (
              <Button 
                variant="outline" 
                size="sm" 
                className="text-success border-success hover:bg-success hover:text-white h-8"
                onClick={() => handleConfirmDelivery(invoice.id)}
              >
                <CheckSquare size={14} className="mr-2" /> Confirm Delivery
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-admin-surface border border-admin-border rounded-xl shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          searchColumn="invoice_number"
          searchPlaceholder="Search by invoice number..."
        />
      </div>
    </div>
  );
};
