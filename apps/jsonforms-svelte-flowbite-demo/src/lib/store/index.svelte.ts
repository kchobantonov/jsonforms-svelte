import { browser } from '$app/environment';
import { replaceState } from '$app/navigation';
import { page } from '$app/state';
import type { ValidationMode } from '@jsonforms/core';

export const appstoreLayouts = ['', 'demo-and-data'] as const;
export type AppstoreLayouts = (typeof appstoreLayouts)[number];

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
  dark = useLocalStorage(
    'flowbite-example-dark',
    browser ? window.matchMedia('(prefers-color-scheme: dark)').matches : false,
  );
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
