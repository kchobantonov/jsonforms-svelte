import type { DemoMode, DemoThemeName } from '$lib/modules/themes';
import {
  appstoreLayouts,
  createDemoBaseStore,
  useLocalStorage,
  type AppstoreLayouts,
} from '@chobantonov/jsonforms-svelte-demo-common';

export { appstoreLayouts, type AppstoreLayouts };
export const getWebComponentThemeStyle = (): string => '';

const baseStore = createDemoBaseStore('skeleton-example');

const appstore = baseStore as ReturnType<typeof createDemoBaseStore> & {
  mode: ReturnType<typeof useLocalStorage<DemoMode>>;
  theme: ReturnType<typeof useLocalStorage<DemoThemeName>>;
};
appstore.mode = useLocalStorage('skeleton-example-mode', 'system' as DemoMode);
appstore.theme = useLocalStorage('skeleton-example-theme', 'cerberus' as DemoThemeName);

export const useAppStore = () => {
  return appstore;
};
