import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Handshake } from 'lucide-react';
import api from '@/lib/axios';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared/Spinner';
import { useCreateDeal } from '@/hooks/useDeals';
import type { Customer, DealStage, Lead, Product } from '@/types';
import { createDealSchema, type CreateDealFormValues } from './CreateDealDialog.schema';
import { CustomerSection } from './CreateDealForm/CustomerSection';
import { DealDetailsSection } from './CreateDealForm/DealDetailsSection';
import { LineItemsSection } from './CreateDealForm/LineItemsSection';

export interface CreateDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Pre-seeds the `stage` field — used when opened from a Kanban column's
   * "Add Deal" button so the deal lands directly in that column.
   */
  defaultStage?: DealStage;
}

const getDefaultValues = (defaultStage?: DealStage): CreateDealFormValues => ({
  customerMode: 'account',
  customer_id: undefined,
  customer_contact_id: undefined,
  lead_id: undefined,
  customer_name: undefined,
  customer_email: undefined,
  customer_phone: undefined,
  customer_company: undefined,
  title: '',
  value: 0,
  stage: defaultStage ?? 'new',
  priority: 'normal',
  source: 'manual',
  expected_close_date: undefined,
  probability: 50,
  notes: undefined,
  items: [],
});

/**
 * Builds the exact payload shape `dealsApi.createDeal` / backend
 * `DealController::store()` expects. `customerMode` (a form-only field) is
 * dropped; the customer-mode-specific fields are translated into the
 * `customer_id` OR `customer_name`+`customer_email` (+ optional
 * `customer_phone`/`customer_company`) shape `resolveContact()` reads.
 *
 * 'lead' mode has no `lead_id` param on `store()` — the selected lead's
 * name/email/phone/company are sent instead, exactly like the current
 * raw-useState "New Deal" sheet does. `resolveContact()` dedups by email
 * server-side, so this doesn't create a duplicate Lead.
 */
function toCreateDealPayload(values: CreateDealFormValues, leads: Lead[]): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    title: values.title,
    value: values.value,
    stage: values.stage,
    priority: values.priority,
    source: values.source,
    expected_close_date: values.expected_close_date || undefined,
    probability: values.probability,
    notes: values.notes || undefined,
  };

  if (values.customerMode === 'account') {
    payload.customer_id = values.customer_id;
    if (values.customer_contact_id) payload.customer_contact_id = values.customer_contact_id;
  } else if (values.customerMode === 'lead') {
    const lead = leads.find((l) => l.id === values.lead_id);
    if (lead) {
      payload.customer_name = lead.name;
      payload.customer_email = lead.email;
      payload.customer_phone = lead.phone || undefined;
      payload.customer_company = lead.company || undefined;
    }
  } else {
    payload.customer_name = values.customer_name;
    payload.customer_email = values.customer_email;
    payload.customer_phone = values.customer_phone || undefined;
    payload.customer_company = values.customer_company || undefined;
  }

  const validItems = values.items.filter((item) => !!item.product_id || item.quantity > 0);
  if (validItems.length > 0) {
    payload.items = validItems.map((item) => ({
      product_id: item.product_id || undefined,
      quantity: item.quantity || 1,
      unit_price: item.unit_price ?? undefined,
      tax_percent: item.tax_percent ?? undefined,
      discount_percent: item.discount_percent ?? undefined,
    }));
  }

  return payload;
}

export function CreateDealDialog({ open, onOpenChange, defaultStage }: CreateDealDialogProps) {
  const form = useForm<CreateDealFormValues>({
    resolver: zodResolver(createDealSchema),
    defaultValues: getDefaultValues(defaultStage),
  });

  // Reset to fresh defaults each time the dialog opens (a Kanban column may
  // pass a different `defaultStage` than the previous time it was opened).
  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(defaultStage));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultStage]);

  // Reference data, fetched lazily only while the dialog is open — mirrors
  // the `enabled: addOpen` lazy-loading in the current "New Deal" sheet
  // (frontend/src/pages/workspace/Deals.tsx).
  const { data: leads = [] } = useQuery({
    queryKey: ['leads', 'all'],
    queryFn: async () => (await api.get('/admin/leads?per_page=100')).data.data as Lead[],
    enabled: open,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: async () => (await api.get('/admin/customers?per_page=100')).data.data as Customer[],
    enabled: open,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => (await api.get('/admin/products?per_page=200')).data.data as Product[],
    enabled: open,
  });

  const createDeal = useCreateDeal();

  const onSubmit = (values: CreateDealFormValues) => {
    const payload = toCreateDealPayload(values, leads);
    createDeal.mutate(payload, {
      // useCreateDeal() already invalidates ['deals'] broadly and toasts on
      // success/error — this callback only handles this dialog's own state.
      onSuccess: () => {
        form.reset(getDefaultValues(defaultStage));
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-accent-light dark:bg-brand-accent/20 flex items-center justify-center">
              <Handshake size={20} className="text-brand-accent" />
            </div>
            <div>
              <DialogTitle className="text-[16px] font-bold text-brand-primary">New Deal</DialogTitle>
              <p className="text-[13px] font-medium text-brand-subtle mt-0.5">
                Track a sales opportunity through the pipeline.
              </p>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <CustomerSection open={open} customers={customers} leads={leads} />
            <DealDetailsSection />
            <div className="space-y-1.5">
              <p className="text-[12px] font-medium text-brand-secondary ml-1">Line Items (optional)</p>
              <LineItemsSection products={products} />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createDeal.isPending}>
                {createDeal.isPending ? <Spinner size={14} className="mr-2" /> : null}
                Create Deal
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
