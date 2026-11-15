import type { DemoMode, DemoThemeName } from '$lib/modules/themes';
import { themes } from '$lib/modules/themes';
import {
  appstoreLayouts,
  createDemoBaseStore,
  replaceDemoUrl,
  useLocalStorage,
  type AppstoreLayouts,
} from '@chobantonov/jsonforms-svelte-demo-common';

export { appstoreLayouts, type AppstoreLayouts };
export const getWebComponentThemeStyle = (): string => '';

const baseStore = createDemoBaseStore('skeleton-example', replaceDemoUrl);

const appstore = baseStore as ReturnType<typeof createDemoBaseStore> & {
  mode: ReturnType<typeof useLocalStorage<DemoMode>>;
  theme: ReturnType<typeof useLocalStorage<DemoThemeName>>;
};
appstore.mode = useLocalStorage(
  'skeleton-example-mode',
  'system' as DemoMode,
  (value): value is DemoMode => value === 'system' || value === 'light' || value === 'dark',
);
appstore.theme = useLocalStorage(
  'skeleton-example-theme',
  'cerberus' as DemoThemeName,
  (value): value is DemoThemeName => themes.some((theme) => theme.name === value),
);

export const useAppStore = () => {
  return appstore;
};
