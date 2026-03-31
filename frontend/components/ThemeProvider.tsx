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
  const [isMounted, setIsMounted] = useState(false);
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <button
      type='button'
      role='switch'
      aria-checked={theme === 'dark'}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
      onClick={toggleTheme}
      className='theme-toggle'
    >
      <span aria-hidden='true' className='theme-toggle__icon-shell'>
        {theme === 'dark' ? (
          <svg viewBox='0 0 24 24' className='theme-toggle__icon' fill='none'>
            <path
              d='M20 14.2A7.8 7.8 0 1 1 9.8 4 6.3 6.3 0 1 0 20 14.2Z'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        ) : (
          <svg viewBox='0 0 24 24' className='theme-toggle__icon' fill='none'>
            <circle cx='12' cy='12' r='4.25' stroke='currentColor' />
            <path d='M12 2.75v2.1M12 19.15v2.1M21.25 12h-2.1M4.85 12h-2.1M18.54 5.46l-1.49 1.49M6.95 17.05l-1.49 1.49M18.54 18.54l-1.49-1.49M6.95 6.95 5.46 5.46' stroke='currentColor' strokeLinecap='round' />
          </svg>
        )}
      </span>
    </button>
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>('dark');

  useEffect(() => {
    const initialTheme = isThemeId(document.documentElement.dataset.theme) ? document.documentElement.dataset.theme : getSystemThemePreference();
    applyThemeToDocument(initialTheme);

    startTransition(() => {
      setThemeState(initialTheme);
    });

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
