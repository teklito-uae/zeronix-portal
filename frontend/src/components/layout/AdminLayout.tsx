import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

import { MobileBottomNav } from './MobileBottomNav';
import { SplashScreen } from '../shared/SplashScreen';

export const AdminLayout = () => {
  const [showSplash] = useState(() => {
    // Only show splash once per session
    if (sessionStorage.getItem('zeronix-splash-shown')) return false;
    sessionStorage.setItem('zeronix-splash-shown', 'true');
    return true;
  });

  return (
    <>
      {showSplash && <SplashScreen />}
      <div className="flex h-screen bg-brand-page-bg overflow-hidden text-brand-primary">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 md:px-6 pt-3 flex-shrink-0 border-b border-brand-border/60 bg-brand-white">
            <Topbar />
          </div>
          <div
            id="main-content"
            className="flex-1 overflow-y-auto touch-scroll pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0"
          >
            <div className="animate-in fade-in duration-200 h-full">
              <Outlet />
            </div>
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </>
  );
};


