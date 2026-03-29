export type ThemeId = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'wikipedia-subway-theme';

export const THEME_CLASS_BY_ID: Record<ThemeId, string> = {
  dark: 'theme-dark',
  light: 'theme-light',
};

export function isThemeId(value: unknown): value is ThemeId {
  return value === 'dark' || value === 'light';
}

export function getThemeClass(theme: ThemeId): string {
  return THEME_CLASS_BY_ID[theme];
}

export function getSystemThemePreference(): ThemeId {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function applyThemeToDocument(theme: ThemeId): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.classList.remove(...Object.values(THEME_CLASS_BY_ID));
  root.classList.add(getThemeClass(theme));
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

export function getThemeInitScript(): string {
  return `
    (() => {
      const storageKey = ${JSON.stringify(THEME_STORAGE_KEY)};
      const themeClassById = ${JSON.stringify(THEME_CLASS_BY_ID)};
      const isThemeId = (value) => value === 'dark' || value === 'light';

      let storedTheme = null;
      try {
        storedTheme = window.localStorage.getItem(storageKey);
      } catch {}

      const theme = isThemeId(storedTheme)
        ? storedTheme
        : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

      const root = document.documentElement;
      root.classList.remove(...Object.values(themeClassById));
      root.classList.add(themeClassById[theme]);
      root.dataset.theme = theme;
      root.style.colorScheme = theme;
    })();
  `;
}

function readVar(styles: CSSStyleDeclaration, name: string): string {
  return styles.getPropertyValue(name).trim();
}

export function readThemeGraphPalette() {
  if (typeof document === 'undefined') {
    return {
      clusterColors: ['#4DA3FF', '#78B5F2', '#6B86A6', '#F2A65A', '#D48C52', '#8FA56E', '#5B87A8', '#B68C6A'],
      defaultEdgeColor: '#415161',
      mutedEdgeColor: '#24313D',
      mutedNodeColor: '#25303A',
      fadedNodeColor: '#1A232C',
      selectedNodeColor: '#E6EAF0',
      routeHighlightColor: '#D9BA84',
      labelColor: '#E6EAF0',
      hoverFillColor: '#151C23',
      hoverShadowColor: 'rgba(7, 10, 13, 0.34)',
      hoverTextColor: '#E6EAF0',
    };
  }

  const styles = getComputedStyle(document.documentElement);

  return {
    clusterColors: Array.from({ length: 8 }, (_, index) => readVar(styles, `--theme-line-${index + 1}`)),
    defaultEdgeColor: readVar(styles, '--theme-edge'),
    mutedEdgeColor: readVar(styles, '--theme-edge-muted'),
    mutedNodeColor: readVar(styles, '--theme-node-muted'),
    fadedNodeColor: readVar(styles, '--theme-node-faded'),
    selectedNodeColor: readVar(styles, '--theme-station'),
    routeHighlightColor: readVar(styles, '--theme-line-highlight'),
    labelColor: readVar(styles, '--theme-canvas-label'),
    hoverFillColor: readVar(styles, '--theme-hover-panel'),
    hoverShadowColor: readVar(styles, '--theme-hover-shadow'),
    hoverTextColor: readVar(styles, '--theme-hover-text'),
  };
}
