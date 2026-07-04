import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { getBasePath } from '@/hooks/useBasePath';
import type { CustomerLabel } from '@/types';
import { LabelBadge } from './LabelBadge';
import { Plus, Check, Loader2, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface LabelSelectorProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}

const PRESET_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F97316',
  '#EAB308', '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6',
];

export const LabelSelector = ({ selectedIds, onChange, disabled }: LabelSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: labels = [], isLoading } = useQuery<CustomerLabel[]>({
    queryKey: ['customer-labels'],
    queryFn: async () => (await api.get(`/admin/customer-labels`)).data,
    staleTime: 120_000,
  });

  const createLabel = useMutation({
    mutationFn: (data: { name: string; color: string }) =>
      api.post(`/admin/customer-labels`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['customer-labels'] });
      onChange([...selectedIds, res.data.id]);
      setCreating(false);
      setNewName('');
      toast.success(`Label "${res.data.name}" created`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create label'),
  });

  const toggle = (id: number) => {
    onChange(selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id]
    );
  };

  const selectedLabels = labels.filter(l => selectedIds.includes(l.id));

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="flex flex-wrap gap-1 min-h-[44px] w-full items-center px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-sm text-admin-text-secondary hover:border-zeronix-blue/50 transition-colors"
      >
        {selectedLabels.length === 0 && (
          <span className="flex items-center gap-1.5 text-admin-text-muted text-xs">
            <Tag size={12} /> Add labels...
          </span>
        )}
        {selectedLabels.map(label => (
          <LabelBadge key={label.id} label={label} />
        ))}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-full bg-admin-surface border border-admin-border rounded-xl shadow-2xl overflow-hidden">
          {isLoading && (
            <div className="flex justify-center p-4">
              <Loader2 size={16} className="animate-spin text-admin-text-muted" />
            </div>
          )}

          {!isLoading && labels.length === 0 && !creating && (
            <p className="text-xs text-admin-text-muted text-center py-4">No labels yet</p>
          )}

          <div className="max-h-48 overflow-y-auto">
            {labels.map(label => (
              <button
                key={label.id}
                type="button"
                onClick={() => toggle(label.id)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-admin-bg/60 transition-colors text-left"
              >
                <LabelBadge label={label} size="md" />
                {selectedIds.includes(label.id) && (
                  <Check size={14} className="text-zeronix-blue flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Create new */}
          <div className="border-t border-admin-border p-2">
            {!creating ? (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-zeronix-blue hover:bg-zeronix-blue/5 rounded-lg transition-colors"
              >
                <Plus size={13} /> Create new label
              </button>
            ) : (
              <div className="space-y-2 p-1">
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value.toUpperCase())}
                  placeholder="LABEL-NAME"
                  className="w-full h-8 px-2 text-xs font-mono bg-admin-bg border border-admin-border rounded-lg text-admin-text-primary focus:outline-none focus:border-zeronix-blue"
                />
                <div className="flex gap-1 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                      style={{ backgroundColor: c, outline: newColor === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                    />
                  ))}
                  <input
                    type="color"
                    value={newColor}
                    onChange={e => setNewColor(e.target.value)}
                    className="w-5 h-5 rounded-full cursor-pointer border-0 p-0 bg-transparent"
                    title="Custom color"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!newName.trim() || createLabel.isPending}
                    onClick={() => createLabel.mutate({ name: newName.trim(), color: newColor })}
                    className="flex-1 h-7 text-xs font-bold bg-zeronix-blue text-white rounded-lg disabled:opacity-50 flex items-center justify-center"
                  >
                    {createLabel.isPending ? <Loader2 size={12} className="animate-spin" /> : 'Create'}
                  </button>
                  <button type="button" onClick={() => { setCreating(false); setNewName(''); }} className="flex-1 h-7 text-xs font-medium text-admin-text-muted border border-admin-border rounded-lg hover:bg-admin-bg">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
