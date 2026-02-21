import { browser } from '$app/environment';
import { replaceState } from '$app/navigation';
import { page } from '$app/state';
import type { ValidationMode } from '@jsonforms/core';

export const appstoreLayouts = ['', 'demo-and-data'] as const;
export type AppstoreLayouts = (typeof appstoreLayouts)[number];
export const appThemeColors = ['sunset', 'ocean', 'forest', 'amber'] as const;
export type AppThemeColor = (typeof appThemeColors)[number];

const themeScaleKeys = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'] as const;
type ThemeScaleKey = (typeof themeScaleKeys)[number];
type ThemeScale = Record<ThemeScaleKey, string>;

interface ThemePalette {
  label: string;
  preview: string;
  primary: ThemeScale;
  secondary: ThemeScale;
  darkOverrides?: {
    primary?: Partial<ThemeScale>;
    secondary?: Partial<ThemeScale>;
  };
}

export const appThemePalettes: Record<AppThemeColor, ThemePalette> = {
  sunset: {
    label: 'Sunset',
    preview: '#ef562f',
    primary: {
      '50': '#fff5f2',
      '100': '#fff1ee',
      '200': '#ffe4de',
      '300': '#ffd5cc',
      '400': '#ffbcad',
      '500': '#fe795d',
      '600': '#ef562f',
      '700': '#eb4f27',
      '800': '#cc4522',
      '900': '#a5371b',
    },
    secondary: {
      '50': '#f0f9ff',
      '100': '#e0f2fe',
      '200': '#bae6fd',
      '300': '#7dd3fc',
      '400': '#38bdf8',
      '500': '#0ea5e9',
      '600': '#0284c7',
      '700': '#0369a1',
      '800': '#075985',
      '900': '#0c4a6e',
    },
    darkOverrides: {
      primary: { '50': '#1f130f', '100': '#2b1913', '200': '#3b2119' },
      secondary: { '50': '#08202b', '100': '#0b2a36', '200': '#0f3746' },
    },
  },
  ocean: {
    label: 'Ocean',
    preview: '#2563eb',
    primary: {
      '50': '#eff6ff',
      '100': '#dbeafe',
      '200': '#bfdbfe',
      '300': '#93c5fd',
      '400': '#60a5fa',
      '500': '#3b82f6',
      '600': '#2563eb',
      '700': '#1d4ed8',
      '800': '#1e40af',
      '900': '#1e3a8a',
    },
    secondary: {
      '50': '#ecfeff',
      '100': '#cffafe',
      '200': '#a5f3fc',
      '300': '#67e8f9',
      '400': '#22d3ee',
      '500': '#06b6d4',
      '600': '#0891b2',
      '700': '#0e7490',
      '800': '#155e75',
      '900': '#164e63',
    },
    darkOverrides: {
      primary: { '50': '#0b1220', '100': '#111a2e', '200': '#1b2944' },
      secondary: { '50': '#07242b', '100': '#0a313a', '200': '#0f404c' },
    },
  },
  forest: {
    label: 'Forest',
    preview: '#059669',
    primary: {
      '50': '#ecfdf5',
      '100': '#d1fae5',
      '200': '#a7f3d0',
      '300': '#6ee7b7',
      '400': '#34d399',
      '500': '#10b981',
      '600': '#059669',
      '700': '#047857',
      '800': '#065f46',
      '900': '#064e3b',
    },
    secondary: {
      '50': '#f7fee7',
      '100': '#ecfccb',
      '200': '#d9f99d',
      '300': '#bef264',
      '400': '#a3e635',
      '500': '#84cc16',
      '600': '#65a30d',
      '700': '#4d7c0f',
      '800': '#3f6212',
      '900': '#365314',
    },
    darkOverrides: {
      primary: { '50': '#0b1d17', '100': '#102820', '200': '#153529' },
      secondary: { '50': '#1a1f0d', '100': '#232a12', '200': '#2f3818' },
    },
  },
  amber: {
    label: 'Amber',
    preview: '#d97706',
    primary: {
      '50': '#fffbeb',
      '100': '#fef3c7',
      '200': '#fde68a',
      '300': '#fcd34d',
      '400': '#fbbf24',
      '500': '#f59e0b',
      '600': '#d97706',
      '700': '#b45309',
      '800': '#92400e',
      '900': '#78350f',
    },
    secondary: {
      '50': '#fff1f2',
      '100': '#ffe4e6',
      '200': '#fecdd3',
      '300': '#fda4af',
      '400': '#fb7185',
      '500': '#f43f5e',
      '600': '#e11d48',
      '700': '#be123c',
      '800': '#9f1239',
      '900': '#881337',
    },
    darkOverrides: {
      primary: { '50': '#21160a', '100': '#2c1f0d', '200': '#3a2a12' },
      secondary: { '50': '#2a0f16', '100': '#34131c', '200': '#461a27' },
    },
  },
};

export const appThemeColorLabels: Record<AppThemeColor, string> = {
  sunset: appThemePalettes.sunset.label,
  ocean: appThemePalettes.ocean.label,
  forest: appThemePalettes.forest.label,
  amber: appThemePalettes.amber.label,
};

export const appThemeColorPreview: Record<AppThemeColor, string> = {
  sunset: appThemePalettes.sunset.preview,
  ocean: appThemePalettes.ocean.preview,
  forest: appThemePalettes.forest.preview,
  amber: appThemePalettes.amber.preview,
};

const toThemeScaleCssVars = (
  colorKey: 'primary' | 'secondary',
  scale: Partial<ThemeScale> | ThemeScale,
): string => {
  return themeScaleKeys
    .filter((tone) => scale[tone] !== undefined)
    .map((tone) => `  --color-${colorKey}-${tone}: ${scale[tone]};`)
    .join('\n');
};

const primaryBlueAliasCssVars = (): string => {
  return themeScaleKeys.map((tone) => `  --color-blue-${tone}: var(--color-primary-${tone});`).join('\n');
};

export const getWebComponentThemeStyle = (themeColor: AppThemeColor): string => {
  const palette = appThemePalettes[themeColor] ?? appThemePalettes.sunset;
  const darkPrimary = palette.darkOverrides?.primary ?? {};
  const darkSecondary = palette.darkOverrides?.secondary ?? {};

  return `
:host {
${toThemeScaleCssVars('primary', palette.primary)}
${toThemeScaleCssVars('secondary', palette.secondary)}
  --color-brand: var(--color-primary-600);
${primaryBlueAliasCssVars()}
}
:host .dark {
${toThemeScaleCssVars('primary', darkPrimary)}
${toThemeScaleCssVars('secondary', darkSecondary)}
}
`.trim();
};

// Helper to safely call replaceState only when router is ready
async function safeReplaceState(url: string) {
  if (!browser) return;

  try {
    replaceState(url, {});
  } catch (error) {
    // If router still not ready, use pushState as fallback
    console.warn('Router not ready, using history.replaceState');
    window.history.replaceState({}, '', url);
  }
}

function useHistoryHashQuery<T extends string | boolean | number>(
  queryParam: string,
  initialValue: T,
) {
  let data = $state<T>(initialValue);
  let initialized = false;

  // Function to update data based on URL hash
  const updateDataFromHash = () => {
    if (!browser) return;

    const hashAndQuery = window.location.hash.slice(1);
    const [_, query] = hashAndQuery.split('?');

    const searchParams = new URLSearchParams(query);
    if (searchParams) {
      try {
        const value = searchParams.has(queryParam)
          ? searchParams.get(queryParam)
          : `${initialValue}`;

        if (typeof initialValue === 'boolean') {
          data = (value === 'true') as T;
        } else if (typeof initialValue === 'number') {
          data = (value ? parseFloat(value) : 0) as T;
        } else if (typeof initialValue === 'string') {
          data = value as T;
        }
      } catch (error) {
        console.error('Error parsing hash:', error);
      }
    }
  };

  // Initial update from URL hash
  if (browser && !initialized) {
    updateDataFromHash();
    initialized = true;
  }

  return {
    get value() {
      return data;
    },
    set value(newValue: T) {
      data = newValue;

      if (!browser) return;

      const encodedData = encodeURIComponent(newValue as string | number | boolean);
      const hashAndQuery = window.location.hash.slice(1);
      const [hash, query] = hashAndQuery.split('?');

      const searchParams = new URLSearchParams(query);

      if (newValue === initialValue) {
        searchParams.delete(queryParam);
      } else {
        searchParams.set(queryParam, encodedData);
      }

      const newUrl = `${page.url.pathname}${page.url.search}#${hash}${searchParams.size > 0 ? '?' + searchParams : ''}`;
      safeReplaceState(newUrl);
    },
  };
}

export function useLocalStorage<T extends string | boolean | number | Record<string, any>>(
  key: string,
  initialValue: T,
) {
  // Read from localStorage
  let storedValue;

  if (browser) {
    const storedValueAsString = localStorage.getItem(key);

    if (storedValueAsString) {
      if (typeof initialValue === 'string') {
        storedValue = storedValueAsString;
      } else if (typeof initialValue === 'number') {
        storedValue = parseFloat(storedValueAsString);
      } else if (typeof initialValue === 'boolean') {
        storedValue = storedValueAsString === 'true';
      } else {
        storedValue = JSON.parse(storedValueAsString);
      }
    }
  }

  let data = $state(storedValue ?? initialValue);

  return {
    get value() {
      return data;
    },
    set value(newValue: typeof initialValue) {
      data = newValue;

      if (!browser) return;

      if (newValue === undefined || newValue === null) {
        localStorage.removeItem(key);
      } else if (
        typeof newValue === 'string' ||
        typeof newValue === 'boolean' ||
        typeof newValue === 'number'
      ) {
        localStorage.setItem(key, newValue + '');
      } else {
        localStorage.setItem(key, JSON.stringify(newValue));
      }
    },
  };
}

class AppStore {
  rtl = $state(browser && document.dir === 'rtl' ? true : false);
  layout = useLocalStorage('flowbite-example-layout', '' as string);
  formOnly = useHistoryHashQuery('form-only', false as boolean);
  activeTab = useHistoryHashQuery('active-tab', '0');
  useWebComponentView = useHistoryHashQuery('use-webcomponent', false as boolean);
  dark = useLocalStorage(
    'flowbite-example-dark',
    browser ? window.matchMedia('(prefers-color-scheme: dark)').matches : false,
  );
  themeColor = useLocalStorage('flowbite-example-theme-color', 'sunset' as AppThemeColor);
  drawer = useHistoryHashQuery('drawer', true as boolean);
  settings = $state(false);
  jsonforms = $state({
    readonly: useHistoryHashQuery('read-only', false as boolean),
    validationMode: 'ValidateAndShow' as ValidationMode,
    config: {
      restrict: true,
      trim: false,
      showUnfocusedDescription: false,
      hideRequiredAsterisk: false,
      collapseNewItems: false,
      breakHorizontal: false,
      initCollapsed: false,
      hideAvatar: false,
      hideArraySummaryValidation: false,
      enableFilterErrorsBeforeTouch: false,
      filterErrorKeywordsBeforeTouch: ['required'],
      allowAdditionalPropertiesIfMissing: false,
    },
    locale: useLocalStorage('flowbite-example-locale', 'en' as string),
  });
}

const appstore = new AppStore();

export const useAppStore = () => {
  return appstore;
};
