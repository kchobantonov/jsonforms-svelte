import { defaultDemoConfig, mergeDemoConfig, type DemoConfig } from '../demoConfig';
import { browser } from '$app/environment';
import { replaceState } from '$app/navigation';
import { page } from '$app/state';
import type { ValidationMode } from '@jsonforms/core';
import { readDemoQuery, writeDemoQuery } from './hashQuery';
import {
  isDemoLocale,
  preferenceTypeGuard,
  readStoredPreference,
  writeStoredPreference,
} from './preferenceStorage';
export { exampleHashHref, readDemoQuery } from './hashQuery';

export const appstoreLayouts = ['default', 'demo-and-data'] as const;
export type AppstoreLayouts = (typeof appstoreLayouts)[number];

function safeReplaceState(url: string) {
  if (!browser) return;

  window.history.replaceState(window.history.state, '', url);
}

/** Use Kit after hydration, retaining its history metadata during early startup. */
export function replaceDemoUrl(url: string) {
  if (!browser) return;
  try {
    replaceState(url, page.state);
  } catch (error) {
    if (
      !(error instanceof Error) ||
      error.message !== 'Cannot call replaceState(...) before router is initialized'
    )
      throw error;
    safeReplaceState(url);
  }
}

export function useHistoryHashQuery<T extends string | boolean | number>(
  queryParam: string,
  initialValue: T,
  replaceUrl: (url: string) => void = safeReplaceState,
) {
  let data = $state<T>(initialValue);

  const updateDataFromUrl = () => {
    if (!browser) return;
    const value = readDemoQuery(new URL(window.location.href), queryParam);
    if (value === null) data = initialValue;
    else if (typeof initialValue === 'boolean') data = (value === 'true') as T;
    else if (typeof initialValue === 'number') {
      const parsed = Number(value);
      data = (Number.isFinite(parsed) ? parsed : initialValue) as T;
    } else data = value as T;
  };

  if (browser) {
    updateDataFromUrl();
    window.addEventListener('hashchange', updateDataFromUrl);
    window.addEventListener('popstate', updateDataFromUrl);
  }

  return {
    get value() {
      return data;
    },
    setSilently(newValue: T) {
      data = newValue;
    },
    set value(newValue: T) {
      if (Object.is(data, newValue)) return;
      data = newValue;

      if (!browser) return;

      replaceUrl(
        writeDemoQuery(
          new URL(window.location.href),
          queryParam,
          newValue === initialValue ? undefined : String(newValue),
        ),
      );
    },
  };
}

export function useLocalStorage<T extends string | boolean | number | Record<string, unknown>>(
  key: string,
  initialValue: T,
  isValid: (value: unknown) => value is T = preferenceTypeGuard(initialValue),
  migrate?: (value: unknown) => T | undefined,
) {
  const storage = () => {
    try {
      return browser ? localStorage : undefined;
    } catch {
      return undefined;
    }
  };
  let data = $state(readStoredPreference(storage(), key, initialValue, isValid, migrate));

  if (browser) {
    window.addEventListener('storage', (event) => {
      if (event.key !== key && event.key !== null) return;
      const currentStorage = storage();
      if (!currentStorage || event.storageArea !== currentStorage) return;
      data = readStoredPreference(currentStorage, key, initialValue, isValid, migrate);
    });
  }

  return {
    get value() {
      return data;
    },
    set value(newValue: typeof initialValue) {
      data = newValue;

      writeStoredPreference(storage(), key, newValue);
    },
  };
}

export const createDemoBaseStore = (storagePrefix: string, replaceUrl?: (url: string) => void) => {
  let rtl = $state(browser && document.dir === 'rtl');
  let settings = $state(false);

  const jsonforms = $state({
    readonly: useHistoryHashQuery('read-only', false as boolean, replaceUrl),
    validationMode: 'ValidateAndShow' as ValidationMode,
    config: {} as Partial<DemoConfig>,
    exampleConfig: {} as Record<string, unknown>,
    get configDefaults() {
      return defaultDemoConfig();
    },
    get effectiveConfig(): DemoConfig {
      return mergeDemoConfig(this.exampleConfig, this.config);
    },
    locale: useLocalStorage(`${storagePrefix}-locale`, 'en' as string, isDemoLocale),
  });

  return {
    get rtl() {
      return rtl;
    },
    set rtl(value: boolean) {
      rtl = value;
    },
    layout: useLocalStorage(
      `${storagePrefix}-layout`,
      'default' as AppstoreLayouts,
      (value): value is AppstoreLayouts =>
        typeof value === 'string' && (appstoreLayouts as readonly string[]).includes(value),
      (value) => (value === '' ? 'default' : undefined),
    ),
    formOnly: useHistoryHashQuery('form-only', false as boolean, replaceUrl),
    activeTab: useHistoryHashQuery('active-tab', 'demo' as string, replaceUrl),
    useWebComponentView: useHistoryHashQuery('use-webcomponent', false as boolean, replaceUrl),
    drawer: useHistoryHashQuery(
      'drawer',
      browser ? window.matchMedia('(min-width: 1280px)').matches : true,
      replaceUrl,
    ),
    get settings() {
      return settings;
    },
    set settings(value: boolean) {
      settings = value;
    },
    jsonforms,
  };
};
