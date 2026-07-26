import { Handshake, Plus, KanbanSquare, List } from 'lucide-react';
import { PageTabs, type PageTab } from '@/components/shared/PageTabs';
import { Button } from '@/components/ui/button';

type DealsViewMode = 'kanban' | 'list';

interface DealsHeaderProps {
  viewMode: DealsViewMode;
  onViewModeChange: (mode: DealsViewMode) => void;
  onNewDeal: () => void;
}

const VIEW_TABS: PageTab[] = [
  { id: 'kanban', label: 'Pipeline', icon: <KanbanSquare size={14} /> },
  { id: 'list', label: 'List', icon: <List size={14} /> },
];

export const DealsHeader = ({ viewMode, onViewModeChange, onNewDeal }: DealsHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-5 py-3 md:py-4 gap-3 md:gap-0 border-b border-brand-border bg-brand-white flex-shrink-0">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <h1 className="text-[16px] md:text-[18px] font-bold text-brand-primary flex items-center gap-2">
          <Handshake size={18} className="text-brand-subtle" />
          Deal Pipeline
        </h1>
        <PageTabs tabs={VIEW_TABS} value={viewMode} onChange={(id) => onViewModeChange(id as DealsViewMode)} />
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onNewDeal} className="text-[13px] font-medium px-4 h-[34px] rounded-lg shadow-sm">
          <Plus size={15} className="mr-1.5" /> <span className="hidden sm:inline">New Deal</span>
        </Button>
      </div>
    </div>
  );
};
