import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { CustomerContact, Deal } from '@/types';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, Phone, Star, User as UserIcon, X } from 'lucide-react';

interface DealContactsTabProps {
  deal: Deal;
  attachContact: UseMutationResult<Deal, unknown, { id: number | string; contactId: number }, unknown>;
  detachContact: UseMutationResult<Deal, unknown, { id: number | string; contactId: number }, unknown>;
  setPrimaryContact: UseMutationResult<Deal, unknown, { id: number | string; data: Record<string, unknown> }, unknown>;
}

const ContactMeta = ({ contact }: { contact: CustomerContact }) => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
    {contact.designation && (
      <span className="text-[11px] text-brand-subtle">{contact.designation}</span>
    )}
    {contact.email && (
      <span className="flex items-center gap-1 text-[11px] text-brand-subtle">
        <Mail size={11} /> {contact.email}
      </span>
    )}
    {(contact.phone || contact.mobile) && (
      <span className="flex items-center gap-1 text-[11px] text-brand-subtle">
        <Phone size={11} /> {contact.phone || contact.mobile}
      </span>
    )}
    {!contact.is_active && (
      <span className="text-[10px] font-semibold text-brand-danger uppercase tracking-wide">Inactive</span>
    )}
  </div>
);

/**
 * Primary contact + additional contacts, with an attach/detach picker
 * scoped to the deal's linked account — mirrors the customer-contacts
 * query Deals.tsx uses (`GET /admin/customers/{id}/contacts`).
 */
export const DealContactsTab = ({ deal, attachContact, detachContact, setPrimaryContact }: DealContactsTabProps) => {
  const { data: accountContacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['customers', deal.customer_id, 'contacts'],
    queryFn: async () => (await api.get(`/admin/customers/${deal.customer_id}/contacts`)).data as CustomerContact[],
    enabled: !!deal.customer_id,
  });

  const availableContacts = useMemo(() => {
    const excluded = new Set<number>([
      ...(deal.customer_contact_id ? [deal.customer_contact_id] : []),
      ...(deal.additionalContacts ?? []).map((c) => c.id),
    ]);
    return accountContacts.filter((c) => !excluded.has(c.id));
  }, [accountContacts, deal.customer_contact_id, deal.additionalContacts]);

  const makePrimary = (contactId: number) => {
    setPrimaryContact.mutate({ id: deal.id, data: { customer_contact_id: contactId } });
    // Also drop it from additional contacts so it isn't listed twice.
    if ((deal.additionalContacts ?? []).some((c) => c.id === contactId)) {
      detachContact.mutate({ id: deal.id, contactId });
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label className="text-[12px] font-medium text-brand-secondary ml-1">Primary Contact</Label>
        {deal.customerContact ? (
          <div className="flex items-center justify-between gap-2 bg-brand-surface border border-brand-border/50 rounded-xl p-4">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-primary">
                <Star size={12} className="text-brand-accent fill-brand-accent shrink-0" />
                {deal.customerContact.full_name}
              </p>
              <ContactMeta contact={deal.customerContact} />
            </div>
          </div>
        ) : !deal.customer_id ? (
          <p className="text-[12px] text-brand-subtle">Link this deal to an account to set a primary contact.</p>
        ) : (
          <p className="text-[12px] text-brand-subtle">No primary contact set.</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-[12px] font-medium text-brand-secondary ml-1">Additional Contacts</Label>
        {(deal.additionalContacts ?? []).length === 0 ? (
          <p className="text-[12px] text-brand-subtle">No additional contacts.</p>
        ) : (
          <div className="space-y-2">
            {(deal.additionalContacts ?? []).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-2 bg-brand-surface border border-brand-border/50 rounded-lg px-3 py-2"
              >
                <div className="min-w-0 flex items-start gap-2">
                  <UserIcon size={13} className="text-brand-subtle mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-brand-primary truncate">{c.full_name}</p>
                    <ContactMeta contact={c} />
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => makePrimary(c.id)}
                    disabled={setPrimaryContact.isPending}
                    className="text-[11px] font-medium text-brand-subtle hover:text-brand-accent px-1.5 py-1 whitespace-nowrap"
                  >
                    Make primary
                  </button>
                  <button
                    type="button"
                    onClick={() => detachContact.mutate({ id: deal.id, contactId: c.id })}
                    disabled={detachContact.isPending}
                    className="text-brand-subtle hover:text-brand-danger p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-[12px] font-medium text-brand-secondary ml-1">Add Contact</Label>
        {!deal.customer_id ? (
          <p className="text-[11px] text-brand-subtle">Link this deal to an account to add contacts.</p>
        ) : contactsLoading ? (
          <Skeleton className="h-[38px] w-full rounded-lg" />
        ) : accountContacts.length === 0 ? (
          <p className="text-[11px] text-brand-subtle">This account has no contacts yet.</p>
        ) : availableContacts.length === 0 ? (
          <p className="text-[11px] text-brand-subtle">All of this account's contacts are already linked.</p>
        ) : (
          <Select
            value=""
            onValueChange={(v) => attachContact.mutate({ id: deal.id, contactId: Number(v) })}
          >
            <SelectTrigger className="h-[38px] text-[13px] rounded-lg">
              <SelectValue placeholder="Select a contact to add..." />
            </SelectTrigger>
            <SelectContent>
              {availableContacts.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.full_name}{c.designation ? ` · ${c.designation}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};
