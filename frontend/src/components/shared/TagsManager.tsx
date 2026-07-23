import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Check } from 'lucide-react';
import { SharedTagBadge } from './SharedTagBadge';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';

interface TagsManagerProps {
  selectedTags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

const COLOR_OPTIONS = [
  { value: 'bg-blue-100 text-blue-800', label: 'Blue' },
  { value: 'bg-indigo-100 text-indigo-800', label: 'Indigo' },
  { value: 'bg-purple-100 text-purple-800', label: 'Purple' },
  { value: 'bg-pink-100 text-pink-800', label: 'Pink' },
  { value: 'bg-rose-100 text-rose-800', label: 'Rose' },
  { value: 'bg-orange-100 text-orange-800', label: 'Orange' },
  { value: 'bg-yellow-100 text-yellow-800', label: 'Yellow' },
  { value: 'bg-green-100 text-green-800', label: 'Green' },
  { value: 'bg-teal-100 text-teal-800', label: 'Teal' },
  { value: 'bg-cyan-100 text-cyan-800', label: 'Cyan' },
  { value: 'bg-gray-100 text-gray-800', label: 'Gray' },
];

export const TagsManager = ({ selectedTags, onAddTag, onRemoveTag }: TagsManagerProps) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].value);

  const { data: dbTags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => (await api.get('/admin/tags')).data,
  });

  const createTagMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      return (await api.post('/admin/tags', { name, color })).data;
    },
    onSuccess: (newTag) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      onAddTag(newTag.name);
      setSearch('');
      setOpen(false);
    },
  });

  const availableTags = dbTags.filter((t: any) => !selectedTags.includes(t.name) && t.name.toLowerCase().includes(search.toLowerCase()));
  const isNewTag = search.trim() !== '' && !dbTags.some((t: any) => t.name.toLowerCase() === search.toLowerCase());

  const handleCreateAndAdd = () => {
    if (!search.trim()) return;
    createTagMutation.mutate({ name: search.trim(), color: selectedColor });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {selectedTags.map((tagName) => {
        const dbTag = dbTags.find((t: any) => t.name === tagName);
        return (
          <SharedTagBadge 
            key={tagName} 
            tag={tagName} 
            color={dbTag?.color}
            onRemove={() => onRemoveTag(tagName)} 
          />
        );
      })}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-dashed border-brand-border text-brand-subtle hover:text-brand-primary hover:border-brand-primary transition-colors"
            title="Add tag"
          >
            <Plus size={12} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3 bg-brand-white border-brand-border shadow-lg rounded-xl" align="start">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search or create tag..."
            className="h-8 text-[12px] mb-3 bg-brand-bg border-brand-border"
            autoFocus
          />

          <div className="max-h-40 overflow-y-auto space-y-1 mb-2 custom-scrollbar pr-1">
            {availableTags.length === 0 && !isNewTag && (
              <p className="text-[11px] text-brand-subtle text-center py-2">No tags found.</p>
            )}
            {availableTags.map((t: any) => (
              <button
                key={t.id}
                onClick={() => {
                  onAddTag(t.name);
                  setSearch('');
                  setOpen(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded-md hover:bg-brand-bg flex items-center gap-2"
              >
                <div className={cn('w-2 h-2 rounded-full', t.color?.split(' ')[0] || 'bg-brand-border')} />
                <span className="text-[12px] text-brand-primary">{t.name}</span>
              </button>
            ))}
          </div>

          {isNewTag && (
            <div className="pt-3 border-t border-brand-border animate-in fade-in duration-200">
              <p className="text-[11px] font-semibold text-brand-subtle mb-2">Create New Tag</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setSelectedColor(c.value)}
                    className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center',
                      c.value.split(' ')[0],
                      selectedColor === c.value ? 'ring-2 ring-offset-1 ring-brand-primary' : ''
                    )}
                  >
                    {selectedColor === c.value && <Check size={10} className={c.value.split(' ')[1]} />}
                  </button>
                ))}
              </div>
              <Button
                size="sm"
                className="w-full h-8 text-[12px] bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg"
                onClick={handleCreateAndAdd}
                disabled={createTagMutation.isPending}
              >
                {createTagMutation.isPending ? 'Creating...' : `Create "${search}"`}
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};
