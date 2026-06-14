import type { CustomerLabel } from '@/types';

interface LabelBadgeProps {
  label: CustomerLabel;
  size?: 'sm' | 'md';
  onRemove?: () => void;
}

export const LabelBadge = ({ label, size = 'sm', onRemove }: LabelBadgeProps) => {
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  const textSize = size === 'sm' ? 'text-[9px]' : 'text-[11px]';
  const padding = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 ${padding} rounded-full font-bold tracking-wider border ${textSize}`}
      style={{
        backgroundColor: label.color + '18',
        borderColor: label.color + '40',
        color: label.color,
      }}
    >
      <span className={`${dotSize} rounded-full flex-shrink-0`} style={{ backgroundColor: label.color }} />
      {label.name}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity leading-none"
        >
          ×
        </button>
      )}
    </span>
  );
};
