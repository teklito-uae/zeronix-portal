import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getBasePath } from '@/hooks/useBasePath';
import api from '@/lib/axios';
import { PartySearch } from '@/components/shared/PartySearch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TRANSACTION_CONFIGS, type TransactionType } from '@/lib/transactionTypes';
import type { Customer, CustomerContact, User } from '@/types';
import { MapPin, Mail, Phone, User as UserIcon, MoreHorizontal, UserPlus } from 'lucide-react';

interface CustomerPanelProps {
  type: TransactionType;
  docData: any;
  onUpdate: (patch: any) => void;
  disabled?: boolean;
}

const getInitials = (name?: string | null) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name.slice(0, 2).toUpperCase();
};

export const CustomerPanel = ({ type, docData, onUpdate, disabled }: CustomerPanelProps) => {
  const navigate = useNavigate();
  const config = TRANSACTION_CONFIGS[type];
  const [searching, setSearching] = useState(false);

  const partyId = docData[config.party.idField];

  // Full customer detail — reused when the doc fetch already embedded the
  // `customer` relation, otherwise fetched once a party is (re)selected.
  const { data: fetchedCustomer } = useQuery({
    queryKey: ['customers', partyId, 'detail'],
    queryFn: async () => (await api.get(`/admin/customers/${partyId}`)).data.customer as Customer,
    enabled: !!partyId && !docData.customer,
  });
  const customer: Customer | undefined = docData.customer || fetchedCustomer;

  const { data: contactsList = [] } = useQuery({
    queryKey: ['customers', partyId, 'contacts'],
    queryFn: async () => (await api.get(`/admin/customers/${partyId}/contacts?active=1`)).data as CustomerContact[],
    enabled: config.party.hasContacts && !!partyId,
  });

  // Auto-select a primary contact once contacts load and none is set yet —
  // ported verbatim from TransactionEditor.tsx.
  useEffect(() => {
    if (!config.party.hasContacts || !config.party.contactIdField) return;
    const contactField = config.party.contactIdField;
    if (!docData[contactField] && contactsList.length > 0) {
      const primary = contactsList.find((c) => c.is_primary) || contactsList[0];
      onUpdate({ [contactField]: primary.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactsList]);

  const { data: dealsResponse } = useQuery({
    queryKey: ['deals', partyId, 'for-doc'],
    queryFn: async () => (await api.get('/admin/deals', { params: { customer_id: partyId, per_page: 100 } })).data,
    enabled: !!partyId,
  });
  const dealOptions = dealsResponse?.data || [];

  const { data: usersList = [] } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () => (await api.get('/admin/users?per_page=100')).data.data as User[],
  });

  const primaryContact = useMemo(
    () => contactsList.find((c) => c.id === docData[config.party.contactIdField!]),
    [contactsList, docData, config.party.contactIdField]
  );

  const handleSelectCustomer = (party: { id: number; name: string; company?: string | null; contact_person?: string | null }) => {
    onUpdate({
      [config.party.idField]: party.id,
      customer: undefined,
      ...(config.party.contactIdField ? { [config.party.contactIdField]: undefined } : {}),
    });
    setSearching(false);
  };

  if (!partyId || searching) {
    return (
      <div className="bg-brand-white border border-brand-border rounded-lg p-4 space-y-3">
        <p className="text-[13px] font-semibold text-brand-primary">Customer</p>
        <PartySearch
          kind={config.party.kind}
          endpoint={config.party.endpoint}
          searchMode={config.party.searchMode}
          value={partyId}
          placeholder="Select customer…"
          onSelect={handleSelectCustomer}
        />
        <Button
          variant="outline"
          size="sm"
          className="w-full rounded-lg h-9 text-[12px] border-brand-border"
          onClick={() => navigate(`${getBasePath()}/companies`)}
        >
          <UserPlus size={13} className="mr-1.5" /> New Customer
        </Button>
      </div>
    );
  }

  const displayName = customer?.company || customer?.name || 'Customer';

  return (
    <div className="space-y-4">
      <div className="bg-brand-white border border-brand-border rounded-lg p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full bg-brand-accent-light text-brand-accent flex items-center justify-center font-bold text-[13px] flex-shrink-0">
              {getInitials(displayName)}
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="text-[13px] font-bold text-brand-primary truncate">{customer?.company || customer?.name || '—'}</p>
              {customer?.company && customer?.name && (
                <p className="text-[12px] text-brand-muted truncate">{customer.name}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSearching(true)}
            className="h-7 w-7 flex-shrink-0 inline-flex items-center justify-center text-brand-subtle hover:text-brand-primary hover:bg-brand-bg rounded-lg"
            title="Change customer"
          >
            <MoreHorizontal size={15} />
          </button>
        </div>

        {customer && (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              customer.is_portal_active
                ? 'text-brand-success bg-brand-success-bg'
                : 'text-brand-subtle bg-brand-surface'
            }`}
          >
            {customer.is_portal_active ? 'Active' : 'Inactive'}
          </span>
        )}

        <div className="space-y-1.5 pt-1">
          {customer?.address && (
            <p className="flex items-start gap-2 text-[12px] text-brand-muted">
              <MapPin size={13} className="mt-0.5 flex-shrink-0 text-brand-subtle" />
              <span>{customer.address}</span>
            </p>
          )}
          <p className="flex items-center gap-2 text-[12px] text-brand-muted">
            <UserIcon size={13} className="flex-shrink-0 text-brand-subtle" />
            <span>{primaryContact?.full_name || customer?.name || '—'}</span>
          </p>
          {customer?.email && (
            <p className="flex items-center gap-2 text-[12px] text-brand-muted truncate">
              <Mail size={13} className="flex-shrink-0 text-brand-subtle" />
              <span className="truncate">{customer.email}</span>
            </p>
          )}
          {customer?.phone && (
            <p className="flex items-center gap-2 text-[12px] text-brand-muted">
              <Phone size={13} className="flex-shrink-0 text-brand-subtle" />
              <span>{customer.phone}</span>
            </p>
          )}
        </div>

        {config.party.hasContacts && config.party.contactIdField && (
          <div className="space-y-1 pt-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle">Attention (Contact)</label>
            <Select
              value={String(docData[config.party.contactIdField] || '')}
              onValueChange={(v) => onUpdate({ [config.party.contactIdField!]: Number(v) })}
              disabled={disabled || contactsList.length === 0}
            >
              <SelectTrigger className="h-9 bg-brand-bg border-brand-border rounded-lg text-[12px]">
                <SelectValue placeholder="Select contact…" />
              </SelectTrigger>
              <SelectContent className="bg-brand-white border-brand-border rounded-lg">
                {contactsList.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)} className="text-[12px]">
                    {c.full_name}
                    {c.designation && <span className="text-brand-subtle ml-1.5">[{c.designation}]</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1 pt-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle">Project</label>
          <Select
            value={docData.deal_id ? String(docData.deal_id) : ''}
            onValueChange={(v) => onUpdate({ deal_id: v ? Number(v) : null })}
            disabled={disabled || !partyId || dealOptions.length === 0}
          >
            <SelectTrigger className="h-9 bg-brand-bg border-brand-border rounded-lg text-[12px]">
              <SelectValue placeholder={dealOptions.length === 0 ? 'No projects' : 'Select project…'} />
            </SelectTrigger>
            <SelectContent className="bg-brand-white border-brand-border rounded-lg">
              {dealOptions.map((d: any) => (
                <SelectItem key={d.id} value={String(d.id)} className="text-[12px]">{d.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 pt-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle">Currency</label>
          <div className="h-9 flex items-center px-3 bg-brand-bg border border-brand-border rounded-lg text-[12px] text-brand-muted">
            AED — UAE Dirham
          </div>
        </div>

        <div className="space-y-1 pt-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle">Sales Person</label>
          <Select
            value={docData.user_id ? String(docData.user_id) : ''}
            onValueChange={(v) => onUpdate({ user_id: v ? Number(v) : null })}
            disabled={disabled}
          >
            <SelectTrigger className="h-9 bg-brand-bg border-brand-border rounded-lg text-[12px]">
              <SelectValue placeholder="Select sales person…" />
            </SelectTrigger>
            <SelectContent className="bg-brand-white border-brand-border rounded-lg">
              {usersList.map((u) => (
                <SelectItem key={u.id} value={String(u.id)} className="text-[12px]">{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rounded-lg h-9 text-[12px] border-brand-border"
            onClick={() => navigate(`${getBasePath()}/companies`)}
          >
            New Customer
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rounded-lg h-9 text-[12px] border-brand-border"
            disabled={!partyId}
            onClick={() => partyId && navigate(`${getBasePath()}/companies/${partyId}`)}
          >
            View Customer
          </Button>
        </div>
      </div>
    </div>
  );
};
