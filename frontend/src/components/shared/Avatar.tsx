import { cn } from '@/lib/utils';

export const getInitials = (name?: string | null) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name.slice(0, 2).toUpperCase();
};

/**
 * Deterministic name -> color, so the same person/company always renders the
 * same avatar color across the app. A small self-contained palette rather
 * than a package — there's no logic here worth pulling a dependency in for.
 */
const PALETTE = [
  { bg: '#EEF2FF', text: '#4F46E5' }, // indigo
  { bg: '#ECFDF5', text: '#059669' }, // emerald
  { bg: '#FFF7ED', text: '#EA580C' }, // orange
  { bg: '#FDF2F8', text: '#DB2777' }, // pink
  { bg: '#EFF6FF', text: '#2563EB' }, // blue
  { bg: '#FEF3C7', text: '#B45309' }, // amber
  { bg: '#F5F3FF', text: '#7C3AED' }, // violet
  { bg: '#ECFEFF', text: '#0891B2' }, // cyan
  { bg: '#FEF2F2', text: '#DC2626' }, // red
  { bg: '#F0FDF4', text: '#16A34A' }, // green
];

const colorFor = (name?: string | null) => {
  const key = name?.trim() || '?';
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

interface AvatarProps {
  name?: string | null;
  className?: string;
}

export const Avatar = ({ name, className }: AvatarProps) => {
  const { bg, text } = colorFor(name);
  return (
    <div
      className={cn('flex items-center justify-center rounded-full font-bold flex-shrink-0', className)}
      style={{ backgroundColor: bg, color: text }}
    >
      {getInitials(name)}
    </div>
  );
};
