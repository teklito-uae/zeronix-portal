import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getBasePath } from '@/hooks/useBasePath';
import api from '@/lib/axios';
import { PartySearch } from '@/components/shared/PartySearch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TRANSACTION_CONFIGS } from '@/lib/transactionTypes';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { CURRENCIES } from '@/lib/currency';
import type { Supplier, SupplierProduct, User } from '@/types';
import { MapPin, Mail, MoreHorizontal, UserPlus, Hash, UserCircle2 } from 'lucide-react';
import { PhoneFlag } from '@/components/shared/PhoneFlag';

interface SupplierPanelProps {
  docData: any;
  onUpdate: (patch: any) => void;
  onSupplierProductsChange: (products: SupplierProduct[]) => void;
  disabled?: boolean;
}

const getInitials = (name?: string | null) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name.slice(0, 2).toUpperCase();
};

const config = TRANSACTION_CONFIGS['purchase-bill'];

/**
 * Left-column party panel for the Purchase Bill editor — a sibling of
 * CustomerPanel.tsx for the supplier side. Suppliers have no contacts/deals,
 * so this is intentionally leaner: identity card, address/contact details,
 * a supplier reference # field, and (unlike CustomerPanel) it surfaces the
 * supplier's negotiated product costs upward for the items table's cost
 * prefill lookup.
 */
export const SupplierPanel = ({ docData, onUpdate, onSupplierProductsChange, disabled }: SupplierPanelProps) => {
  const navigate = useNavigate();
  const currency = useCurrencyStore((s) => s.currency);
  const [searching, setSearching] = useState(false);

  const partyId = docData.supplier_id;

  const { data: fetchedSupplier } = useQuery({
    queryKey: ['suppliers', partyId, 'detail'],
    queryFn: async () => (await api.get(`/admin/suppliers/${partyId}?per_page=100`)).data as { supplier: Supplier; products: { data: SupplierProduct[] } },
    enabled: !!partyId,
  });

  const supplier: Supplier | undefined = fetchedSupplier?.supplier || docData.supplier;

  useEffect(() => {
    onSupplierProductsChange(fetchedSupplier?.products?.data || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedSupplier]);

  const { data: usersList = [] } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () => (await api.get('/admin/users?per_page=100')).data.data as User[],
  });
  const recordedBy = usersList.find((u) => u.id === docData.user_id);

  const handleSelectSupplier = (party: { id: number }) => {
    onUpdate({ supplier_id: party.id, supplier: undefined });
    setSearching(false);
  };

  if (!partyId || searching) {
    return (
      <div className="p-4 md:p-5 space-y-3">
        <p className="text-[14px] font-semibold text-brand-primary">Supplier</p>
        <PartySearch
          kind={config.party.kind}
          endpoint={config.party.endpoint}
          searchMode={config.party.searchMode}
          value={partyId}
          placeholder="Select supplier…"
          onSelect={handleSelectSupplier}
        />
        <Button
          variant="outline"
          size="sm"
          className="w-full rounded-lg h-9 text-[12px] border-brand-border"
          onClick={() => navigate(`${getBasePath()}/suppliers`)}
        >
          <UserPlus size={13} className="mr-1.5" /> New Supplier
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full bg-brand-accent-light text-brand-accent flex items-center justify-center font-bold text-[13px] flex-shrink-0">
              {getInitials(supplier?.name)}
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="text-[13px] font-bold text-brand-primary truncate">{supplier?.name || '—'}</p>
              {supplier?.supplier_code && (
                <p className="text-[11px] text-brand-muted truncate flex items-center gap-1">
                  <Hash size={10} /> {supplier.supplier_code}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSearching(true)}
            className="h-7 w-7 flex-shrink-0 inline-flex items-center justify-center text-brand-subtle hover:text-brand-primary hover:bg-brand-bg rounded-lg"
            title="Change supplier"
          >
            <MoreHorizontal size={15} />
          </button>
        </div>

        <div className="space-y-1.5 pt-1">
          {supplier?.address && (
            <p className="flex items-start gap-2 text-[12px] text-brand-muted">
              <MapPin size={13} className="mt-0.5 flex-shrink-0 text-brand-subtle" />
              <span>{supplier.address}</span>
            </p>
          )}
          {supplier?.email && (
            <p className="flex items-center gap-2 text-[12px] text-brand-muted truncate">
              <Mail size={13} className="flex-shrink-0 text-brand-subtle" />
              <span className="truncate">{supplier.email}</span>
            </p>
          )}
          {supplier?.phone && (
            <p className="flex items-center gap-2.5 text-[12px] text-brand-primary">
              <PhoneFlag phone={supplier.phone} size="sm" showNumber={true} />
            </p>
          )}
        </div>

        <div className="space-y-1 pt-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle">Supplier Reference #</label>
          <Input
            value={docData.reference_id || ''}
            onChange={(e) => onUpdate({ reference_id: e.target.value })}
            disabled={disabled}
            placeholder="Supplier's invoice / reference #"
            className="h-9 bg-brand-bg border-brand-border rounded-lg text-[12px] text-brand-primary"
          />
        </div>

        <div className="space-y-1 pt-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle">Currency</label>
          <div className="h-9 flex items-center px-3 bg-brand-bg border border-brand-border rounded-lg text-[12px] text-brand-muted">
            {CURRENCIES[currency].code} — {CURRENCIES[currency].name}
          </div>
        </div>

        {recordedBy && (
          <div className="space-y-1 pt-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-subtle">Recorded By</label>
            <div className="h-9 flex items-center gap-2 px-3 bg-brand-bg border border-brand-border rounded-lg text-[12px] text-brand-muted">
              <UserCircle2 size={13} className="text-brand-subtle" />
              {recordedBy.name}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rounded-lg h-9 text-[12px] border-brand-border"
            onClick={() => navigate(`${getBasePath()}/suppliers`)}
          >
            New Supplier
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rounded-lg h-9 text-[12px] border-brand-border"
            disabled={!partyId}
            onClick={() => partyId && navigate(`${getBasePath()}/suppliers/${partyId}`)}
          >
            View Supplier
          </Button>
        </div>
      </div>
    </div>
  );
};
