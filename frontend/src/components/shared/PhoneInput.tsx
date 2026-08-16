import ReactPhoneInput, { isPossiblePhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { cn } from '@/lib/utils';
import { forwardRef, useState, type ComponentRef } from 'react';

interface PhoneInputProps {
  value?: string;
  onChange: (value?: string) => void;
  className?: string;
  placeholder?: string;
}

/**
 * Global phone/mobile input — worldwide format, no country flag/selector
 * (contacts come from any country, not just UAE). Users type the full
 * number including "+<country code>"; validity is checked against the
 * libphonenumber worldwide numbering plans as they type.
 */
export const PhoneInput = forwardRef<ComponentRef<typeof ReactPhoneInput>, PhoneInputProps>(
  ({ value, onChange, className, placeholder = 'e.g. +1 415 555 2671' }, ref) => {
    const [touched, setTouched] = useState(false);
    const invalid = touched && !!value && !isPossiblePhoneNumber(value);

    return (
      <div className="space-y-1">
        <ReactPhoneInput
          international
          countrySelectComponent={() => null}
          value={value}
          onChange={onChange}
          onBlur={() => setTouched(true)}
          className={cn(
            "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-[13px] shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-brand-subtle focus-within:outline-none focus-within:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
            invalid
              ? "border-brand-danger focus-within:ring-brand-danger"
              : "border-brand-border focus-within:ring-brand-primary",
            "[&_.PhoneInputInput]:border-none [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:focus:outline-none [&_.PhoneInputInput]:text-[13px] [&_.PhoneInputInput]:text-brand-primary",
            className
          )}
          placeholder={placeholder}
          ref={ref}
        />
        {invalid && (
          <p className="text-[11px] text-brand-danger ml-1">Enter a valid international phone number.</p>
        )}
      </div>
    );
  }
);
PhoneInput.displayName = 'PhoneInput';
