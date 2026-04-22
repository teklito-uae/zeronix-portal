import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    return (localStorage.getItem('zeronix-theme') as Theme) || 'light';
  }
  return 'light';
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('zeronix-theme', theme);
    set({ theme });
  },
  toggle: () =>
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', next === 'dark');
      localStorage.setItem('zeronix-theme', next);
      return { theme: next };
    }),
}));

// Initialize theme on load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('zeronix-theme');
  if (stored === 'dark') {
    document.documentElement.classList.add('dark');
  }
}
