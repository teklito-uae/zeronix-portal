import { z } from 'zod';
import type { DealPriority, DealSource, DealStage } from '@/types';

/**
 * Mirrors `DealController::store()` (backend/app/Http/Controllers/DealController.php)
 * exactly for the fields this dialog collects. Notable divergences from the
 * raw backend rules, made deliberately for a better create-form UX (the
 * backend stays lenient so other callers — e.g. quick-add flows — aren't
 * forced through the same UX):
 *  - `title` is `nullable` server-side but required here.
 *  - `value` is `nullable` server-side but required (>= 0) here.
 * Everything else (customer resolution, item shape) matches the backend
 * 1:1 — see `resolveContact()` and the `items.*` validation rules in
 * `store()`.
 */

export const DEAL_STAGE_VALUES: [DealStage, ...DealStage[]] = [
  'new',
  'qualified',
  'requirement',
  'proposal_sent',
  'negotiation',
  'won',
  'lost',
  'cancelled',
];

export const DEAL_SOURCE_VALUES: [DealSource, ...DealSource[]] = [
  'manual',
  'website',
  'email',
  'referral',
  'import',
  'other',
];

export const DEAL_PRIORITY_VALUES: [DealPriority, ...DealPriority[]] = ['normal', 'high', 'urgent'];

/**
 * Mirrors the current (raw useState) "New Deal" form's `LinkMode` in
 * frontend/src/pages/workspace/Deals.tsx — an existing Account, an existing
 * Lead (converted to customer_name/customer_email on submit — the backend
 * has no `lead_id` param on `store()`), or a brand-new contact resolved
 * server-side by `resolveContact()`.
 */
export const CUSTOMER_MODE_VALUES = ['account', 'lead', 'new'] as const;
export type CustomerMode = (typeof CUSTOMER_MODE_VALUES)[number];

// Numbers are NOT declared with `z.coerce` here: coercion makes the
// resolver's *input* type `unknown`, which breaks every downstream
// react-hook-form field typed against this schema (Select/Input onChange
// handlers already convert strings to numbers themselves before calling
// `field.onChange`/`setValue`/`replace`, so plain `z.number()` is enough and
// keeps a single, precise `CreateDealFormValues` type usable everywhere).
const dealItemSchema = z.object({
  product_id: z.number().int().positive().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Must be 0 or more').optional(),
  tax_percent: z.number().min(0, 'Must be 0 or more').optional(),
  discount_percent: z.number().min(0).max(100, 'Must be between 0 and 100').optional(),
});

export const createDealSchema = z
  .object({
    customerMode: z.enum(CUSTOMER_MODE_VALUES),

    // 'account' mode
    customer_id: z.number().int().positive().optional(),
    customer_contact_id: z.number().int().positive().optional(),

    // 'lead' mode
    lead_id: z.number().int().positive().optional(),

    // 'new' mode
    customer_name: z.string().max(255).optional(),
    customer_email: z
      .string()
      .max(255)
      .optional()
      .refine((v) => !v || z.string().email().safeParse(v).success, {
        message: 'Enter a valid email address',
      }),
    customer_phone: z.string().max(50).optional(),
    customer_company: z.string().max(255).optional(),

    title: z.string().trim().min(1, 'Title is required').max(255),
    value: z.number().min(0, 'Value must be 0 or more'),
    stage: z.enum(DEAL_STAGE_VALUES),
    priority: z.enum(DEAL_PRIORITY_VALUES),
    source: z.enum(DEAL_SOURCE_VALUES),
    expected_close_date: z.string().optional(),
    probability: z.number().int().min(0).max(100).optional(),
    notes: z.string().optional(),
    items: z.array(dealItemSchema),
  })
  .superRefine((data, ctx) => {
    if (data.customerMode === 'account' && !data.customer_id) {
      ctx.addIssue({
        code: 'custom',
        message: 'Select an account',
        path: ['customer_id'],
      });
    }
    if (data.customerMode === 'lead' && !data.lead_id) {
      ctx.addIssue({
        code: 'custom',
        message: 'Select a lead',
        path: ['lead_id'],
      });
    }
    if (data.customerMode === 'new') {
      if (!data.customer_name?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Full name is required',
          path: ['customer_name'],
        });
      }
      if (!data.customer_email?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Email is required',
          path: ['customer_email'],
        });
      }
    }
  });

export type CreateDealFormValues = z.infer<typeof createDealSchema>;
export type DealItemFormValues = z.infer<typeof dealItemSchema>;
