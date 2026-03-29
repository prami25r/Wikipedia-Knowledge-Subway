'use client';

import { createContext, startTransition, useContext, useEffect, useState, type ReactNode } from 'react';
import { applyThemeToDocument, getSystemThemePreference, isThemeId, THEME_STORAGE_KEY, type ThemeId } from '@/lib/theme';

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function persistTheme(theme: ThemeId) {
  applyThemeToDocument(theme);

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage write failures so theme switching still works.
  }
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type='button'
      role='switch'
      aria-checked={theme === 'dark'}
      aria-label='Toggle appearance'
      title='Toggle appearance'
      onClick={toggleTheme}
      className='theme-toggle'
    >
      <span aria-hidden='true' className='theme-toggle__track'>
        <span className='theme-toggle__stars'>
          <span className='theme-toggle__star theme-toggle__star--one' />
          <span className='theme-toggle__star theme-toggle__star--two' />
          <span className='theme-toggle__star theme-toggle__star--three' />
          <span className='theme-toggle__star theme-toggle__star--four' />
        </span>
        <span className='theme-toggle__dots'>
          <span className='theme-toggle__dot theme-toggle__dot--large' />
          <span className='theme-toggle__dot theme-toggle__dot--small' />
        </span>
        <span className='theme-toggle__thumb'>
          <span className='theme-toggle__moon-cutout' />
        </span>
      </span>
    </button>
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    if (typeof document === 'undefined') {
      return 'dark';
    }

    const initialTheme = document.documentElement.dataset.theme;
    return isThemeId(initialTheme) ? initialTheme : 'dark';
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');

    const handleSystemThemeChange = () => {
      let storedTheme: string | null = null;

      try {
        storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      } catch {
        storedTheme = null;
      }

      if (storedTheme !== null) {
        return;
      }

      const nextTheme = getSystemThemePreference();
      applyThemeToDocument(nextTheme);

      startTransition(() => {
        setThemeState(nextTheme);
      });
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) {
        return;
      }

      const nextTheme = isThemeId(event.newValue) ? event.newValue : getSystemThemePreference();
      applyThemeToDocument(nextTheme);

      startTransition(() => {
        setThemeState(nextTheme);
      });
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setTheme = (nextTheme: ThemeId) => {
    persistTheme(nextTheme);

    startTransition(() => {
      setThemeState(nextTheme);
    });
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
