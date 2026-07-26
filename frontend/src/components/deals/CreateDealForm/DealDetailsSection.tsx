import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import {
  DEAL_PRIORITY_VALUES,
  DEAL_SOURCE_VALUES,
  DEAL_STAGE_VALUES,
  type CreateDealFormValues,
} from '../CreateDealDialog.schema';

const STAGE_LABELS: Record<string, string> = {
  new: 'New',
  qualified: 'Qualified',
  requirement: 'Requirement',
  proposal_sent: 'Proposal Sent',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
  cancelled: 'Cancelled',
};

const PRIORITY_LABELS: Record<string, string> = {
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
};

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual',
  website: 'Website',
  email: 'Email',
  referral: 'Referral',
  import: 'Import',
  other: 'Other',
};

/**
 * Plain field section: title, value, stage/priority/source, expected close
 * date, probability, notes. Field set matches the current raw-useState "New
 * Deal" sheet plus `store()`'s validated fields 1:1.
 */
export function DealDetailsSection() {
  const { control } = useFormContext<CreateDealFormValues>();
  const currency = useCurrencyStore((s) => s.currency);

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Deal Title *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g. Q3 Equipment Supply" className="h-[38px] text-[13px] rounded-lg" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Value ({currency}) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="h-[38px] text-[13px] rounded-lg"
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="expected_close_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expected Close</FormLabel>
              <FormControl>
                <Input type="date" className="h-[38px] text-[13px] rounded-lg" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={control}
          name="stage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stage</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="h-[38px] text-[13px] rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DEAL_STAGE_VALUES.map((s) => (
                    <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="h-[38px] text-[13px] rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DEAL_PRIORITY_VALUES.map((p) => (
                    <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="h-[38px] text-[13px] rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DEAL_SOURCE_VALUES.map((s) => (
                    <SelectItem key={s} value={s}>{SOURCE_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="probability"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Probability (%)</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                max={100}
                step={1}
                placeholder="50"
                className="h-[38px] text-[13px] rounded-lg"
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ''}
                className="rounded-xl resize-none min-h-[90px] text-[13px]"
                placeholder="Deal context, requirements, next steps..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
