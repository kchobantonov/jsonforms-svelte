import type { DemoMode, DemoThemeName } from '$lib/modules/themes';
import {
  appstoreLayouts,
  createDemoBaseStore,
  useHistoryHashQuery,
  useLocalStorage,
  type AppstoreLayouts,
} from '@chobantonov/jsonforms-svelte-demo-common';

export { appstoreLayouts, type AppstoreLayouts };
export const getWebComponentThemeStyle = (): string => '';

const baseStore = createDemoBaseStore('shadcn-example');

const appstore = baseStore as Omit<ReturnType<typeof createDemoBaseStore>, 'activeTab'> & {
  activeTab: ReturnType<typeof useHistoryHashQuery<string>>;
  mode: ReturnType<typeof useLocalStorage<DemoMode>>;
  theme: ReturnType<typeof useLocalStorage<DemoThemeName>>;
};
appstore.mode = useLocalStorage('shadcn-example-mode', 'system' as DemoMode);
appstore.theme = useLocalStorage('shadcn-example-theme', 'slate' as DemoThemeName);

export const useAppStore = () => {
  return appstore;
};
