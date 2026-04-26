import { useState, useEffect } from 'react';
import { Logo } from './Logo';

export const SplashScreen = () => {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 1200);
    const remove = setTimeout(() => setVisible(false), 1600);
    return () => { clearTimeout(timer); clearTimeout(remove); };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0E1A23] transition-opacity duration-400 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div
        className="flex flex-col items-center"
        style={{ animation: 'splashLogoIn 800ms ease-out forwards' }}
      >
        <Logo size="xl" showText className="drop-shadow-2xl" />
        <div className="mt-6 flex gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '0ms' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '200ms' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '400ms' }} />
        </div>
      </div>
      <p className="absolute bottom-10 text-[11px] text-gray-500 font-medium tracking-wider uppercase">
        Zeronix Technology
      </p>
    </div>
  );
};
