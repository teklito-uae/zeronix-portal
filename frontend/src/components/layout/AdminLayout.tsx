import { Outlet } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';

import { MobileBottomNav } from './MobileBottomNav';
import { SplashScreen } from '../shared/SplashScreen';
import { GlobalSearch } from './GlobalSearch';

export const AdminLayout = () => {
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [showSplash] = useState(() => {
    // Only show splash once per session
    if (sessionStorage.getItem('zeronix-splash-shown')) return false;
    sessionStorage.setItem('zeronix-splash-shown', 'true');
    return true;
  });
  const lastScrollY = useRef(0);
  const [searchOpen, setSearchOpen] = useState(false);

  // Ctrl+K / Cmd+K to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = document.getElementById('main-content')?.scrollTop || 0;
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setShowBottomNav(false);
      } else {
        setShowBottomNav(true);
      }
      lastScrollY.current = currentScrollY;
    };

    const mainElement = document.getElementById('main-content');
    mainElement?.addEventListener('scroll', handleScroll);
    return () => mainElement?.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {showSplash && <SplashScreen />}
      <div className="flex h-screen bg-brand-page-bg p-0 md:p-3 gap-0 md:gap-3 overflow-hidden text-brand-primary">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div
            id="main-content"
            className="flex-1 overflow-y-auto touch-scroll"
          >
            <div className="animate-in fade-in duration-200 h-full">
              <Outlet />
            </div>
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav isVisible={showBottomNav} />
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
};

