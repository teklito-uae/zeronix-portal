import ReactPhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface PhoneInputProps {
  value?: string;
  onChange: (value?: string) => void;
  className?: string;
  placeholder?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, className, placeholder = 'Enter phone number...' }, ref) => {
    return (
      <ReactPhoneInput
        international
        defaultCountry="AE"
        value={value}
        onChange={onChange}
        className={cn(
          "flex h-9 w-full rounded-md border border-brand-border bg-transparent px-3 py-1 text-[13px] shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-brand-subtle focus-within:outline-none focus-within:ring-1 focus-within:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-50",
          "[&_.PhoneInputInput]:border-none [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:focus:outline-none [&_.PhoneInputInput]:text-[13px] [&_.PhoneInputInput]:text-brand-primary",
          "[&_.PhoneInputCountryIcon]:h-4 [&_.PhoneInputCountryIcon]:w-6 [&_.PhoneInputCountryIcon]:shadow-sm [&_.PhoneInputCountrySelectArrow]:text-brand-subtle",
          className
        )}
        placeholder={placeholder}
        ref={ref as any}
      />
    );
  }
);
PhoneInput.displayName = 'PhoneInput';
