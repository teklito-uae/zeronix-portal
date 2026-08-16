import { useMemo, useState } from 'react';
import type { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { getBasePath } from '@/hooks/useBasePath';
import { ResourceListingPage } from '@/components/shared/ResourceListingPage';
import { MultiSelectFilter } from '@/components/shared/MultiSelectFilter';
import { ActionGroup } from '@/components/shared/ActionGroup';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Avatar } from '@/components/shared/Avatar';
import { ContactDetailPanel } from '@/components/shared/ContactDetailPanel';
import { ContactFormSheet } from '@/components/shared/ContactFormSheet';
import { Users, Star, Building2, ShieldCheck, Layers, Tag as TagIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useResourceList } from '@/hooks/useApi';
import type { CustomerContact, Customer, Tag, PaginatedResponse } from '@/types';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { CurrencyAmount } from '@/components/shared/CurrencyAmount';
import { toTitleCase } from '@/lib/utils';

/**
 * Standalone, cross-company Contacts directory.
 * Backed by GET /admin/contacts (CustomerContactController@indexAll).
 * There is no flat /admin/contacts/{id} CRUD surface by design — every
 * create/update/delete/set-primary mutation targets the existing nested
 * /admin/customers/{customer_id}/contacts... endpoints.
 */
export const Contacts = () => {
  const currency = useCurrencyStore((s) => s.currency);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerContact | null>(null);
  const [deletingContact, setDeletingContact] = useState<CustomerContact | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);

  // Companies for the Company filter dropdown
  const { data: companiesData } = useResourceList<PaginatedResponse<Customer>>('customers', { per_page: 100 });
  const companies = companiesData?.data || [];

  // Tags for the Tags filter dropdown (`/admin/tags` returns a plain array)
  const { data: tagsData } = useResourceList<Tag[]>('tags', {});
  const allTags: Tag[] = tagsData || [];

  // Distinct departments for the Department filter
  const { data: departmentsData } = useResourceList<string[]>('contacts/departments', {});
  const departments: string[] = departmentsData || [];

  // Multi-select filter state
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const filterParams = useMemo(() => {
    const f: Record<string, string> = {};
    if (selectedCompanyIds.length) f.customer_id = selectedCompanyIds.join(',');
    if (selectedTagIds.length) f.tag_id = selectedTagIds.join(',');
    if (selectedDepartments.length) f.department = selectedDepartments.join(',');
    if (selectedStatuses.length) f.is_active = selectedStatuses.join(',');
    return f;
  }, [selectedCompanyIds, selectedTagIds, selectedDepartments, selectedStatuses]);

  // Invalidate both this page's own list and the company detail page's contacts panel.
  const invalidateAll = (customerId?: number) => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    if (customerId) {
      queryClient.invalidateQueries({ queryKey: ['customers', customerId, 'contacts'] });
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (contact: CustomerContact) => api.delete(`/admin/customers/${contact.customer_id}/contacts/${contact.id}`),
    onSuccess: (_res, contact) => { invalidateAll(contact.customer_id); toast.success('Contact deleted'); },
    onError: (e: AxiosError<{ message?: string }>) => toast.error(e.response?.data?.message || 'Failed to delete contact'),
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (contact: CustomerContact) => api.post(`/admin/customers/${contact.customer_id}/contacts/${contact.id}/set-primary`),
    onSuccess: (_res, contact) => { invalidateAll(contact.customer_id); toast.success('Primary contact updated'); },
    onError: (e: AxiosError<{ message?: string }>) => toast.error(e.response?.data?.message || 'Failed to update primary contact'),
  });

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (contact: CustomerContact) => {
    setEditing(contact);
    setDialogOpen(true);
  };

  const columns: ColumnDef<CustomerContact>[] = [
    {
      accessorKey: 'full_name',
      header: 'Contact',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.original.full_name} className="h-8 w-8 text-[11px] flex-shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-sm font-bold text-brand-primary truncate">{toTitleCase(row.original.full_name)}</p>
            {row.original.is_primary && (
              <span className="text-[10px] font-bold text-brand-accent bg-brand-accent-light px-1.5 py-0.5 rounded flex items-center gap-1 flex-shrink-0">
                <Star size={10} /> PRIMARY
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'designation',
      header: 'Designation',
      cell: ({ row }) => <span className="text-xs text-brand-secondary">{row.original.designation || '—'}</span>,
    },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: ({ row }) => <span className="text-xs text-brand-secondary">{row.original.department || '—'}</span>,
    },
    {
      id: 'company',
      header: 'Company',
      cell: ({ row }) => {
        const customer = row.original.customer;
        const label = toTitleCase(customer?.company || customer?.name || '—');
        return (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); navigate(`${getBasePath()}/companies/${row.original.customer_id}`); }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-accent hover:underline"
          >
            <Building2 size={12} /> {label}
          </button>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => <span className="text-xs text-brand-secondary">{row.original.email || '—'}</span>,
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => <span className="text-xs text-brand-secondary">{row.original.phone || row.original.mobile || '—'}</span>,
    },
    {
      accessorKey: 'deals_count',
      header: 'Total Deals',
      cell: ({ row }) => <span className="text-xs font-bold text-brand-secondary">{row.original.deals_count ?? 0}</span>,
    },
    {
      accessorKey: 'lifetime_value',
      header: 'Lifetime Value',
      cell: ({ row }) => (
        <span className="text-xs font-bold text-brand-primary">
          <CurrencyAmount amount={row.original.lifetime_value ?? 0} currency={currency} />
        </span>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        row.original.is_active ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            ACTIVE
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider bg-brand-bg text-brand-subtle border border-brand-border">
            INACTIVE
          </span>
        )
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {!row.original.is_primary && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPrimaryMutation.mutate(row.original)}
              className="h-8 px-2 text-[11px] rounded-lg"
            >
              Set Primary
            </Button>
          )}
          <ActionGroup
            onEdit={() => openEdit(row.original)}
            onDelete={() => { setDeletingContact(row.original); setDeleteOpen(true); }}
          />
        </div>
      ),
    },
  ];

  // Faceted filter toolbar (Company, Tags, Department, Status), mirrors Companies.tsx
  const customFilters = (
    <div className="flex flex-wrap items-center gap-2">
      <MultiSelectFilter
        title="Company"
        icon={<Building2 />}
        options={companies.map((c: Customer) => ({ label: c.company || c.name, value: String(c.id) }))}
        selected={selectedCompanyIds}
        onChange={setSelectedCompanyIds}
      />
      <MultiSelectFilter
        title="Tags"
        icon={<TagIcon />}
        options={allTags.map((t: Tag) => ({ label: t.name, value: String(t.id) }))}
        selected={selectedTagIds}
        onChange={setSelectedTagIds}
      />
      <MultiSelectFilter
        title="Department"
        icon={<Layers />}
        options={departments.map((d: string) => ({ label: d, value: d }))}
        selected={selectedDepartments}
        onChange={setSelectedDepartments}
      />
      <MultiSelectFilter
        title="Status"
        icon={<ShieldCheck />}
        options={[{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }]}
        selected={selectedStatuses}
        onChange={setSelectedStatuses}
      />
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <ResourceListingPage<CustomerContact>
        resource="contacts"
        title="Contacts Directory"
        subtitle="Every contact person across all companies, in one place."
        icon={<Users size={20} />}
        columns={columns}
        createLabel="Add Contact"
        createPath="#"
        onCreateClick={openAdd}
        onRowClick={(contact) => setSelectedContactId(contact.id)}
        searchPlaceholder="Search by name, email, designation, company..."
        filters={[]}
        customFilters={customFilters}
        baseFilters={filterParams}
      />

      {/* Add / Edit Sheet — shared with the company profile's own Contacts tab */}
      <ContactFormSheet open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Contact?"
        description="This will permanently remove this contact person. This action is irreversible."
        confirmLabel="Yes, Delete"
        onConfirm={() => { if (deletingContact) deleteMutation.mutate(deletingContact); }}
        variant="destructive"
      />

      <ContactDetailPanel contactId={selectedContactId} onClose={() => setSelectedContactId(null)} />
    </div>
  );
};
