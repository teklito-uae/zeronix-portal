import { useSidebarStore } from '@/store/useSidebarStore';
import { Menu } from 'lucide-react';

export const Topbar = () => {
  const { toggle } = useSidebarStore();
  
  return (
    <header className="h-16 bg-admin-surface border-b border-admin-border flex items-center px-4 justify-between">
      <button onClick={toggle} className="p-2 hover:bg-admin-surface-hover rounded-brand">
        <Menu size={20} />
      </button>
      <div className="flex items-center gap-4">
        {/* User Profile / Theme Toggle */}
      </div>
    </header>
  );
};
