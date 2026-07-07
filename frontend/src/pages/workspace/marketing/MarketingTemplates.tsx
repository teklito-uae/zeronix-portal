import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { useResourceList } from '@/hooks/useApi';
import { PageLoader } from '@/components/shared/PageLoader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreHorizontal, Pencil, Copy, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import type { MarketingTemplate } from '@/types';

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'introduction', label: 'Introduction' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'renewal', label: 'Renewal' },
  { value: 'promotional', label: 'Promotional' },
  { value: 'custom', label: 'Custom' },
];

export const MarketingTemplates = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<MarketingTemplate | null>(null);

  const { data, isLoading } = useResourceList<MarketingTemplate>('marketing/templates', {
    search: search || undefined,
    category: category === 'all' ? undefined : category,
    per_page: 50,
  });

  const templates: MarketingTemplate[] = data?.data || [];

  const duplicate = async (template: MarketingTemplate) => {
    try {
      const res = await api.post(`/admin/marketing/templates/${template.id}/duplicate`);
      queryClient.invalidateQueries({ queryKey: ['marketing/templates'] });
      toast.success('Template duplicated');
      navigate(`/workspace/marketing/templates/${res.data.id}/edit`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to duplicate template');
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/marketing/templates/${deleteTarget.id}`);
      queryClient.invalidateQueries({ queryKey: ['marketing/templates'] });
      toast.success('Template deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete template');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <MarketingLayout
      title="Templates"
      actions={
        <Button onClick={() => navigate('/workspace/marketing/templates/new')} className="h-9 text-[13px] gap-1.5">
          <Plus size={14} /> New Template
        </Button>
      }
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-subtle" size={14} />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates..." className="pl-8 h-9 text-[13px]" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`h-8 px-3 rounded-md text-[12px] font-medium border transition-colors ${
                category === c.value ? 'bg-brand-accent text-white border-brand-accent' : 'bg-brand-white text-brand-secondary border-brand-border'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <PageLoader label="Loading templates..." />
      ) : templates.length === 0 ? (
        <EmptyState icon={FileText} title="No templates found" description="Create your first email template to get started." actionLabel="New Template" onAction={() => navigate('/workspace/marketing/templates/new')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <div
              key={t.id}
              onClick={() => navigate(`/workspace/marketing/templates/${t.id}/edit`)}
              className="bg-brand-white border border-brand-border rounded-xl p-4 cursor-pointer hover:border-brand-accent/40 hover:shadow-md transition-all flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-brand-primary truncate">{t.name}</p>
                  <p className="text-[11px] text-brand-subtle truncate">{t.subject}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0"><MoreHorizontal size={15} /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => navigate(`/workspace/marketing/templates/${t.id}/edit`)}>
                      <Pencil size={13} className="mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => duplicate(t)}>
                      <Copy size={13} className="mr-2" /> Duplicate
                    </DropdownMenuItem>
                    {!t.is_builtin && (
                      <DropdownMenuItem onClick={() => setDeleteTarget(t)} className="text-brand-danger focus:text-brand-danger">
                        <Trash2 size={13} className="mr-2" /> Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div
                className="h-24 rounded-md border border-brand-border bg-brand-surface/40 overflow-hidden text-[9px] p-2 text-brand-subtle"
                dangerouslySetInnerHTML={{ __html: t.body_html }}
                style={{ pointerEvents: 'none' }}
              />
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant="outline" className="text-[10px] capitalize">{t.category.replace('_', ' ')}</Badge>
                {t.is_builtin && <Badge variant="outline" className="text-[10px] bg-brand-accent-light text-brand-accent border-0">Built-in</Badge>}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete template?"
        description={`"${deleteTarget?.name}" will be permanently removed.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={remove}
      />
    </MarketingLayout>
  );
};
