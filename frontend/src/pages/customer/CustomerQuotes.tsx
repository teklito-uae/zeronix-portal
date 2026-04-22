import { useState } from 'react';
import { mockQuotes } from '@/lib/mockData';
import type { Quote } from '@/types';
import { DataTable } from '@/components/shared/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { FileText, CheckCircle, XCircle } from 'lucide-react';

export const CustomerQuotes = () => {
  const customerId = 3; // Mock
  const [data, setData] = useState<Quote[]>(mockQuotes.filter(q => q.customer_id === customerId));

  const handleAction = (id: number, action: 'accept' | 'reject') => {
    setData(prev => prev.map(q => {
      if (q.id === id) {
        return { ...q, status: action === 'accept' ? 'accepted' : 'rejected' };
      }
      return q;
    }));
    // Real implementation would call API
    alert(`Quote ${action}ed!`);
  };

  const columns: ColumnDef<Quote>[] = [
    {
      accessorKey: 'quote_number',
      header: 'Quote #',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium text-zeronix-blue">
          {row.getValue('quote_number')}
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
        const quote = row.original;
        const isPending = quote.status === 'sent';
        
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-admin-text-secondary hover:text-zeronix-blue">
              <FileText size={16} />
            </Button>
            {isPending && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-success border-success hover:bg-success hover:text-white h-8 w-8 p-0"
                  onClick={() => handleAction(quote.id, 'accept')}
                  title="Accept Quote"
                >
                  <CheckCircle size={16} />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-danger border-danger hover:bg-danger hover:text-white h-8 w-8 p-0"
                  onClick={() => handleAction(quote.id, 'reject')}
                  title="Reject Quote"
                >
                  <XCircle size={16} />
                </Button>
              </>
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
          searchColumn="quote_number"
          searchPlaceholder="Search by quote number..."
        />
      </div>
    </div>
  );
};
