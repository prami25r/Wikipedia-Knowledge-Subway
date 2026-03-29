'use client';

import { createContext, startTransition, useContext, useEffect, useState, type ReactNode } from 'react';
import { applyThemeToDocument, getSystemThemePreference, isThemeId, THEMES, THEME_STORAGE_KEY, type ThemeId } from '@/lib/theme';

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_THUMB_POSITION: Record<ThemeId, string> = {
  metro: 'translate-x-0',
  cyberpunk: 'translate-x-[2.75rem]',
  light: 'translate-x-[5.5rem]',
};

function ThemeIcon({ themeId }: { themeId: ThemeId }) {
  if (themeId === 'metro') {
    return (
      <span className='relative block h-4 w-4 rounded-full border border-current'>
        <span className='absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current' />
      </span>
    );
  }

  if (themeId === 'cyberpunk') {
    return <span className='block h-3.5 w-3.5 rotate-45 rounded-[0.2rem] border border-current' />;
  }

  return <span className='block h-3.5 w-3.5 rounded-[0.45rem] border border-current' />;
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className='flex items-center gap-2 rounded-full border border-theme-border bg-theme-floating px-2 py-1.5 shadow-theme-soft backdrop-blur'>
      <span className='hidden text-[11px] font-semibold uppercase tracking-[0.24em] text-theme-soft lg:inline'>Theme</span>
      <div className='relative flex items-center gap-1 rounded-full bg-theme-card p-1'>
        <span
          aria-hidden='true'
          className={`absolute left-1 top-1 h-10 w-10 rounded-full bg-theme-primary shadow-theme-soft transition-transform duration-300 ease-out ${THEME_THUMB_POSITION[theme]}`}
        />
        {THEMES.map((option) => {
          const isActive = option.id === theme;

          return (
            <button
              key={option.id}
              type='button'
              title={option.label}
              aria-label={`Switch to ${option.label}`}
              aria-pressed={isActive}
              onClick={() => setTheme(option.id)}
              className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full ${
                isActive ? 'text-theme-bg' : 'text-theme-muted hover:text-theme-text'
              }`}
            >
              <ThemeIcon themeId={option.id} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    if (typeof document === 'undefined') {
      return 'metro';
    }

    const initialTheme = document.documentElement.dataset.theme;
    return isThemeId(initialTheme) ? initialTheme : 'metro';
  });

  useEffect(() => {
    applyThemeToDocument(theme);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage write failures so theme switching still works.
    }
  }, [theme]);

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

      startTransition(() => {
        setThemeState(getSystemThemePreference());
      });
    };

    const handleStorage = (event: StorageEvent) => {
      const nextTheme = event.newValue;

      if (event.key !== THEME_STORAGE_KEY || !isThemeId(nextTheme)) {
        return;
      }

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
    startTransition(() => {
      setThemeState(nextTheme);
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
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
