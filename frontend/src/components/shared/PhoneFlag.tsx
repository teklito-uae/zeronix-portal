import { getCountryFromPhone } from '@/lib/phoneUtils';
import { Phone } from 'lucide-react';

interface PhoneFlagProps {
  phone: string | null | undefined;
  showNumber?: boolean;
  size?: 'sm' | 'md';
}

/**
 * Renders a country flag emoji alongside the phone number.
 * Shows an "Unknown" badge when country cannot be detected.
 */
export const PhoneFlag = ({ phone, showNumber = true, size = 'sm' }: PhoneFlagProps) => {
  const country = getCountryFromPhone(phone);
  const textCls = size === 'sm' ? 'text-[11px]' : 'text-xs';

  if (!phone) {
    return (
      <span className={`inline-flex items-center gap-1 ${textCls} text-admin-text-muted italic`}>
        <Phone size={10} className="opacity-40" />
        No phone
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${textCls}`}>
      {country ? (
        <span title={country.name} className="flex items-center justify-center">
          <img 
            src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`} 
            alt={country.name} 
            className="w-4 h-auto rounded-[2px] shadow-sm"
          />
        </span>
      ) : (
        <span
          title="Unknown country"
          className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-admin-border text-[8px] font-bold text-admin-text-muted leading-none"
        >
          ?
        </span>
      )}
      {showNumber && (
        <span className="text-admin-text-secondary font-medium">{phone}</span>
      )}
    </span>
  );
};
