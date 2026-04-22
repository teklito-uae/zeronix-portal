import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { mockEnquiries, mockProducts } from '@/lib/mockData';
import type { Enquiry } from '@/types';
import { Filter, X, Building2, Mail, Phone, Calendar, FileText, Package } from 'lucide-react';

export const Enquiries = () => {
  const [enquiries] = useState<Enquiry[]>(mockEnquiries);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredEnquiries = enquiries.filter((e) => {
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    if (filterPriority !== 'all' && e.priority !== filterPriority) return false;
    if (filterSource !== 'all' && e.source !== filterSource) return false;
    return true;
  });

  const openDetail = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setSheetOpen(true);
  };

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterSource('all');
  };

  const hasActiveFilters = filterStatus !== 'all' || filterPriority !== 'all' || filterSource !== 'all';

  // Mock items for detail view
  const enquiryItems = selectedEnquiry
    ? mockProducts.slice(0, selectedEnquiry.items_count || 2).map((p, i) => ({
        id: i + 1,
        product: p,
        quantity: Math.floor(Math.random() * 10) + 1,
        description: p.description,
      }))
    : [];

  const columns: ColumnDef<Enquiry>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-zeronix-blue font-medium">
          ENQ-{String(row.original.id).padStart(3, '0')}
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
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => <StatusBadge status={row.original.priority} />,
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ row }) => (
        <span className="text-admin-text-secondary text-sm capitalize">{row.original.source}</span>
      ),
    },
    {
      accessorKey: 'items_count',
      header: 'Items',
      cell: ({ row }) => (
        <span className="text-admin-text-secondary">{row.original.items_count || 0}</span>
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
  ];

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={filteredEnquiries}
        searchColumn="customer"
        searchPlaceholder="Search enquiries..."
        onRowClick={openDetail}
        headerAction={
          <Button
            variant="ghost"
            onClick={() => setShowFilters(!showFilters)}
            className={`h-[38px] text-sm font-medium border border-admin-border rounded-lg w-full sm:w-auto ${
              hasActiveFilters
                ? 'bg-zeronix-blue/10 text-zeronix-blue border-zeronix-blue/30'
                : 'text-admin-text-secondary hover:bg-admin-surface-hover'
            }`}
          >
            <Filter size={16} className="mr-1" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 bg-zeronix-blue text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {[filterStatus, filterPriority, filterSource].filter((f) => f !== 'all').length}
              </span>
            )}
          </Button>
        }
      />

      {/* Filters Bar */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-admin-surface border border-admin-border rounded-xl">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-[34px] w-36 bg-admin-bg border-admin-border text-admin-text-primary text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-admin-surface border-admin-border">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="quoted">Quoted</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="h-[34px] w-36 bg-admin-bg border-admin-border text-admin-text-primary text-sm">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent className="bg-admin-surface border-admin-border">
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="h-[34px] w-36 bg-admin-bg border-admin-border text-admin-text-primary text-sm">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent className="bg-admin-surface border-admin-border">
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="portal">Portal</SelectItem>
              <SelectItem value="chat">Chat</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-admin-text-muted hover:text-admin-text-primary h-[34px] text-xs"
            >
              <X size={14} className="mr-1" /> Clear
            </Button>
          )}
        </div>
      )}

      <DataTable
        columns={columns}
        data={filteredEnquiries}
        searchColumn="customer"
        searchPlaceholder="Search enquiries..."
        onRowClick={openDetail}
      />

      {/* Enquiry Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-admin-surface border-l border-admin-border overflow-y-auto">
          {selectedEnquiry && (
            <>
              <SheetHeader className="pb-4">
                <SheetTitle className="text-admin-text-primary flex items-center gap-2">
                  <span className="font-mono text-zeronix-blue">ENQ-{String(selectedEnquiry.id).padStart(3, '0')}</span>
                </SheetTitle>
                <SheetDescription className="text-admin-text-secondary">
                  Enquiry details and management
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6">
                {/* Status & Priority Controls */}
                <div className="flex gap-3">
                  <div className="flex-1 space-y-2">
                    <Label className="text-admin-text-muted text-xs uppercase font-medium">Status</Label>
                    <Select defaultValue={selectedEnquiry.status}>
                      <SelectTrigger className="h-[34px] bg-admin-bg border-admin-border text-admin-text-primary text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-admin-surface border-admin-border">
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="quoted">Quoted</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label className="text-admin-text-muted text-xs uppercase font-medium">Priority</Label>
                    <Select defaultValue={selectedEnquiry.priority}>
                      <SelectTrigger className="h-[34px] bg-admin-bg border-admin-border text-admin-text-primary text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-admin-surface border-admin-border">
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator className="bg-admin-border" />

                {/* Customer Info */}
                <div>
                  <h4 className="text-xs font-medium uppercase text-admin-text-muted mb-3">Customer</h4>
                  <div className="bg-admin-bg rounded-lg p-4 space-y-2">
                    <p className="font-medium text-admin-text-primary">{selectedEnquiry.customer?.name}</p>
                    {selectedEnquiry.customer?.company && (
                      <p className="text-sm text-admin-text-secondary flex items-center gap-2">
                        <Building2 size={14} className="text-admin-text-muted" />
                        {selectedEnquiry.customer.company}
                      </p>
                    )}
                    <p className="text-sm text-admin-text-secondary flex items-center gap-2">
                      <Mail size={14} className="text-admin-text-muted" />
                      {selectedEnquiry.customer?.email}
                    </p>
                    {selectedEnquiry.customer?.phone && (
                      <p className="text-sm text-admin-text-secondary flex items-center gap-2">
                        <Phone size={14} className="text-admin-text-muted" />
                        {selectedEnquiry.customer.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-admin-bg rounded-lg p-3">
                    <p className="text-[10px] uppercase text-admin-text-muted font-medium mb-1">Source</p>
                    <p className="text-sm text-admin-text-primary capitalize">{selectedEnquiry.source}</p>
                  </div>
                  <div className="bg-admin-bg rounded-lg p-3">
                    <p className="text-[10px] uppercase text-admin-text-muted font-medium mb-1">Date</p>
                    <p className="text-sm text-admin-text-primary flex items-center gap-1">
                      <Calendar size={12} />
                      {selectedEnquiry.created_at ? new Date(selectedEnquiry.created_at).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>

                <Separator className="bg-admin-border" />

                {/* Items */}
                <div>
                  <h4 className="text-xs font-medium uppercase text-admin-text-muted mb-3">
                    Items ({enquiryItems.length})
                  </h4>
                  <div className="space-y-2">
                    {enquiryItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-admin-bg rounded-lg"
                      >
                        <div className="p-2 rounded-lg bg-zeronix-blue/10 flex-shrink-0">
                          <Package size={16} className="text-zeronix-blue" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-admin-text-primary truncate">
                            {item.product.name}
                          </p>
                          {item.product.part_number && (
                            <p className="text-xs font-mono text-admin-text-muted">{item.product.part_number}</p>
                          )}
                        </div>
                        <span className="text-sm text-admin-text-secondary flex-shrink-0">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-admin-border" />

                {/* Notes */}
                <div>
                  <h4 className="text-xs font-medium uppercase text-admin-text-muted mb-2">Notes</h4>
                  <Textarea
                    defaultValue={selectedEnquiry.notes || ''}
                    className="bg-admin-bg border-admin-border text-admin-text-primary focus:border-zeronix-blue resize-none"
                    rows={3}
                    placeholder="Add internal notes..."
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 bg-zeronix-blue text-white hover:bg-zeronix-blue-hover h-[38px]">
                    <FileText size={16} className="mr-1" /> Create Quote
                  </Button>
                  <Button
                    variant="ghost"
                    className="border border-admin-border text-admin-text-secondary hover:bg-admin-surface-hover h-[38px]"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
