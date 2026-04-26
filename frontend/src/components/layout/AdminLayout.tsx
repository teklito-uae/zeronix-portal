import { Outlet } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileBottomNav } from './MobileBottomNav';
import { SplashScreen } from '../shared/SplashScreen';

export const AdminLayout = () => {
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [showSplash] = useState(() => {
    // Only show splash once per session
    if (sessionStorage.getItem('zeronix-splash-shown')) return false;
    sessionStorage.setItem('zeronix-splash-shown', 'true');
    return true;
  });
  const lastScrollY = useRef(0);

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
      <div className="flex h-screen bg-admin-bg text-admin-text-primary overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 min-w-0">
          <Topbar />
          <main
            id="main-content"
            className="flex-1 overflow-y-auto touch-scroll p-4 md:p-8 pb-20 md:pb-8"
          >
            <div className="animate-in fade-in duration-200">
              <Outlet />
            </div>
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav isVisible={showBottomNav} />
      </div>
    </>
  );
};
