import { DollarSign } from 'lucide-react';
import type { CurrencyCode } from '@/lib/currency';

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Approximation of the UAE Central Bank's 2025 Dirham symbol
 * (a "D" stem crossed by two horizontal bars). No Unicode codepoint
 * exists for it yet, so it's drawn as an inline glyph.
 */
export const DirhamIcon = ({ size = 16, className = '' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role="img"
    aria-label="UAE Dirham"
  >
    <path d="M6 4v16" />
    <path d="M6 4c5 0 9 3.58 9 8s-4 8-9 8" />
    <path d="M3 9.5h13" />
    <path d="M3 13.5h13" />
  </svg>
);

interface CurrencyIconProps extends IconProps {
  currency: CurrencyCode;
}

export const CurrencyIcon = ({ currency, size = 16, className = '' }: CurrencyIconProps) =>
  currency === 'AED' ? (
    <DirhamIcon size={size} className={className} />
  ) : (
    <DollarSign size={size} className={className} />
  );
