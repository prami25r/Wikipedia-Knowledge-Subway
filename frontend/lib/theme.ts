export type ThemeId = 'metro' | 'cyberpunk' | 'light';

export const THEME_STORAGE_KEY = 'wikipedia-subway-theme';

export const THEMES = [
  {
    id: 'metro',
    label: 'Neo Metro',
    shortLabel: 'Metro',
  },
  {
    id: 'cyberpunk',
    label: 'Infra Glow',
    shortLabel: 'Infra',
  },
  {
    id: 'light',
    label: 'Soft Grid',
    shortLabel: 'Soft',
  },
] as const satisfies ReadonlyArray<{ id: ThemeId; label: string; shortLabel: string }>;

export const THEME_CLASS_BY_ID: Record<ThemeId, string> = {
  metro: 'theme-metro',
  cyberpunk: 'theme-cyberpunk',
  light: 'theme-light',
};

export function isThemeId(value: unknown): value is ThemeId {
  return value === 'metro' || value === 'cyberpunk' || value === 'light';
}

export function getThemeClass(theme: ThemeId): string {
  return THEME_CLASS_BY_ID[theme];
}

export function getSystemThemePreference(): ThemeId {
  if (typeof window === 'undefined') {
    return 'metro';
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'metro';
}

export function resolveThemePreference(value: unknown): ThemeId {
  return isThemeId(value) ? value : getSystemThemePreference();
}

export function applyThemeToDocument(theme: ThemeId): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.classList.remove(...Object.values(THEME_CLASS_BY_ID));
  root.classList.add(getThemeClass(theme));
  root.dataset.theme = theme;
  root.style.colorScheme = theme === 'light' ? 'light' : 'dark';
}

export function getThemeInitScript(): string {
  return `
    (() => {
      const storageKey = ${JSON.stringify(THEME_STORAGE_KEY)};
      const themeClassById = ${JSON.stringify(THEME_CLASS_BY_ID)};
      const isThemeId = (value) => value === 'metro' || value === 'cyberpunk' || value === 'light';

      let storedTheme = null;
      try {
        storedTheme = window.localStorage.getItem(storageKey);
      } catch {}

      const theme = isThemeId(storedTheme)
        ? storedTheme
        : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'metro');

      const root = document.documentElement;
      root.classList.remove(...Object.values(themeClassById));
      root.classList.add(themeClassById[theme]);
      root.dataset.theme = theme;
      root.style.colorScheme = theme === 'light' ? 'light' : 'dark';
    })();
  `;
}

function readVar(styles: CSSStyleDeclaration, name: string): string {
  return styles.getPropertyValue(name).trim();
}

export function readThemeGraphPalette() {
  if (typeof document === 'undefined') {
    return {
      clusterColors: ['#00D1FF', '#33D7FF', '#4EBAFF', '#8B5CF6', '#A36BFF', '#6E84FF', '#2EE1FF', '#B794FF'],
      defaultEdgeColor: '#29435B',
      mutedEdgeColor: '#162435',
      mutedNodeColor: '#172332',
      fadedNodeColor: '#1B2A3B',
      selectedNodeColor: '#EAF7FF',
      routeHighlightColor: '#FDBA3B',
      labelColor: '#F5FAFF',
      hoverFillColor: '#0F1722',
      hoverShadowColor: '#000000',
      hoverTextColor: '#F5FAFF',
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
