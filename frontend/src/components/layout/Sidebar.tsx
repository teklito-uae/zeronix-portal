import { useSidebarStore } from '@/store/useSidebarStore';

export const Sidebar = () => {
  const { isOpen } = useSidebarStore();
  
  return (
    <aside className={`bg-admin-sidebar-bg border-r border-admin-border transition-all ${isOpen ? 'w-60' : 'w-16'}`}>
      <div className="h-16 flex items-center justify-center border-b border-admin-border">
        {isOpen ? <span className="font-bold text-xl text-zeronix-blue">Zeronix</span> : <span className="font-bold">Z</span>}
      </div>
      <nav className="p-2 space-y-1">
        {/* Nav Items Here */}
      </nav>
    </aside>
  );
};
