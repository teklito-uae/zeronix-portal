import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { CustomerContact, Deal } from '@/types';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

interface DealContactsTabProps {
  deal: Deal;
  attachContact: UseMutationResult<Deal, unknown, { id: number | string; contactId: number }, unknown>;
  detachContact: UseMutationResult<Deal, unknown, { id: number | string; contactId: number }, unknown>;
}

/**
 * Primary contact + additional contacts, with an attach/detach picker
 * scoped to the deal's linked account — mirrors the customer-contacts
 * query Deals.tsx uses (`GET /admin/customers/{id}/contacts`).
 */
export const DealContactsTab = ({ deal, attachContact, detachContact }: DealContactsTabProps) => {
  const { data: accountContacts = [] } = useQuery({
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

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label className="text-[12px] font-medium text-brand-secondary ml-1">Primary Contact</Label>
        {deal.customerContact ? (
          <div className="bg-brand-surface border border-brand-border/50 rounded-xl p-4">
            <p className="text-[13px] font-semibold text-brand-primary">{deal.customerContact.full_name}</p>
            <p className="text-[12px] text-brand-subtle mt-0.5">
              {deal.customerContact.email || '—'} {deal.customerContact.phone ? `· ${deal.customerContact.phone}` : ''}
            </p>
          </div>
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
                <div>
                  <p className="text-[13px] font-medium text-brand-primary">{c.full_name}</p>
                  <p className="text-[11px] text-brand-subtle">{c.email || c.phone || '—'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => detachContact.mutate({ id: deal.id, contactId: c.id })}
                  className="text-brand-subtle hover:text-brand-danger p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-[12px] font-medium text-brand-secondary ml-1">Add Contact</Label>
        {!deal.customer_id ? (
          <p className="text-[11px] text-brand-subtle">Link this deal to an account to add contacts.</p>
        ) : (
          <Select onValueChange={(v) => attachContact.mutate({ id: deal.id, contactId: Number(v) })}>
            <SelectTrigger className="h-[38px] text-[13px] rounded-lg">
              <SelectValue placeholder="Select a contact to add..." />
            </SelectTrigger>
            <SelectContent>
              {availableContacts.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};
