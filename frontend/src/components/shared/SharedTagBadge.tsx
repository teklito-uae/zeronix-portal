import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

const TAG_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-indigo-100 text-indigo-800',
  'bg-purple-100 text-purple-800',
  'bg-pink-100 text-pink-800',
  'bg-rose-100 text-rose-800',
  'bg-orange-100 text-orange-800',
  'bg-yellow-100 text-yellow-800',
  'bg-green-100 text-green-800',
  'bg-teal-100 text-teal-800',
  'bg-cyan-100 text-cyan-800',
];

const getTagColor = (tag: string) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
};

interface SharedTagBadgeProps {
  tag: string;
  color?: string | null;
  onRemove?: () => void;
  className?: string;
}

export const SharedTagBadge = ({ tag, color, onRemove, className }: SharedTagBadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border-0',
        color || getTagColor(tag),
        className
      )}
    >
      {tag}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-75 focus:outline-none"
        >
          <X size={10} />
        </button>
      )}
    </span>
  );
};
