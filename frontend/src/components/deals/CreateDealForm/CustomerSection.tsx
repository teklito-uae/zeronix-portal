import { useFormContext } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Building2, Plus, UserCircle2 } from 'lucide-react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Customer, CustomerContact, Lead } from '@/types';
import type { CreateDealFormValues } from '../CreateDealDialog.schema';

interface CustomerSectionProps {
  open: boolean;
  customers: Customer[];
  leads: Lead[];
}

/**
 * Toggle between an existing Account, an existing Lead, or a brand-new
 * contact — mirrors the `LinkMode` toggle in the current raw-useState "New
 * Deal" sheet (frontend/src/pages/workspace/Deals.tsx), reimplemented as
 * controlled react-hook-form fields.
 */
export function CustomerSection({ open, customers, leads }: CustomerSectionProps) {
  const { control, watch, setValue } = useFormContext<CreateDealFormValues>();
  const customerMode = watch('customerMode');
  const customerId = watch('customer_id');

  // Same lazy contact lookup the current form does: only fetched once an
  // account is selected in 'account' mode.
  const { data: contacts = [] } = useQuery({
    queryKey: ['customers', customerId, 'contacts'],
    queryFn: async () => (await api.get(`/admin/customers/${customerId}/contacts`)).data as CustomerContact[],
    enabled: open && customerMode === 'account' && !!customerId,
  });

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="customerMode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Link To</FormLabel>
            <Select
              value={field.value}
              onValueChange={(v) => {
                field.onChange(v);
                // Clear the other modes' fields so a stale selection can't
                // slip into the submit payload.
                setValue('customer_id', undefined);
                setValue('customer_contact_id', undefined);
                setValue('lead_id', undefined);
                setValue('customer_name', undefined);
                setValue('customer_email', undefined);
                setValue('customer_phone', undefined);
                setValue('customer_company', undefined);
              }}
            >
              <FormControl>
                <SelectTrigger className="h-[38px] text-[13px] rounded-lg">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="account">
                  <div className="flex items-center gap-2"><Building2 size={14} /> Existing Account</div>
                </SelectItem>
                <SelectItem value="lead">
                  <div className="flex items-center gap-2"><UserCircle2 size={14} /> Existing Lead</div>
                </SelectItem>
                <SelectItem value="new">
                  <div className="flex items-center gap-2"><Plus size={14} /> New Contact</div>
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {customerMode === 'account' && (
        <>
          <FormField
            control={control}
            name="customer_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account *</FormLabel>
                <Select
                  value={field.value ? String(field.value) : undefined}
                  onValueChange={(v) => {
                    field.onChange(Number(v));
                    setValue('customer_contact_id', undefined);
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="h-[38px] text-[13px] rounded-lg">
                      <SelectValue placeholder="Select an account..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[260px]">
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} {c.company ? `— ${c.company}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {!!customerId && contacts.length > 0 && (
            <FormField
              control={control}
              name="customer_contact_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact (optional)</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger className="h-[38px] text-[13px] rounded-lg">
                        <SelectValue placeholder="Select a contact..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contacts.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </>
      )}

      {customerMode === 'lead' && (
        <FormField
          control={control}
          name="lead_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lead *</FormLabel>
              <Select
                value={field.value ? String(field.value) : undefined}
                onValueChange={(v) => field.onChange(Number(v))}
              >
                <FormControl>
                  <SelectTrigger className="h-[38px] text-[13px] rounded-lg">
                    <SelectValue placeholder="Select a lead..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[260px]">
                  {leads.filter((l) => l.email).map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      {l.name} {l.company ? `— ${l.company}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {customerMode === 'new' && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-brand-surface rounded-xl border border-brand-border/50">
          <FormField
            control={control}
            name="customer_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} placeholder="e.g. John Doe" className="h-[36px] text-[13px] rounded-lg" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="customer_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} type="email" placeholder="john@example.com" className="h-[36px] text-[13px] rounded-lg" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="customer_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} className="h-[36px] text-[13px] rounded-lg" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="customer_company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} className="h-[36px] text-[13px] rounded-lg" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
}
