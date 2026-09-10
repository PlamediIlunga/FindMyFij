'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'fij-carte-theme';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      setThemeState(stored);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, mounted]);

  function setTheme(next: Theme) {
    setThemeState(next);
  }

  function toggleTheme() {
    setThemeState((current) => (current === 'light' ? 'dark' : 'light'));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme doit être utilisé dans un ThemeProvider');
  }
  return context;
}
