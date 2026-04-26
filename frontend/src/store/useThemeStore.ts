import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme, isCustomer?: boolean) => void;
  toggle: (isCustomer?: boolean) => void;
  initTheme: (isCustomer?: boolean) => void;
}

const getThemeKey = (isCustomer?: boolean) => isCustomer ? 'zeronix-customer-theme' : 'zeronix-theme';


export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'light', // Default, will be initialized
  setTheme: (theme, isCustomer) => {
    const key = getThemeKey(isCustomer);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(key, theme);
    set({ theme });
  },
  toggle: (isCustomer) =>
    set((state) => {
      const key = getThemeKey(isCustomer);
      const next = state.theme === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', next === 'dark');
      localStorage.setItem(key, next);
      return { theme: next };
    }),
  initTheme: (isCustomer) => {
    const key = getThemeKey(isCustomer);
    const theme = (localStorage.getItem(key) as Theme) || 'light';
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
  }
}));
