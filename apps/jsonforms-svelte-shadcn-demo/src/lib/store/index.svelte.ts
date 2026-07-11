import type { DemoMode, DemoThemeName } from '$lib/modules/themes';
import {
  defaultShadcnDesignSystem,
  type ShadcnDesignSystemConfig,
} from '@chobantonov/jsonforms-svelte-shadcn';
import {
  appstoreLayouts,
  createDemoBaseStore,
  useHistoryHashQuery,
  useLocalStorage,
  type AppstoreLayouts,
} from '@chobantonov/jsonforms-svelte-demo-common';

export { appstoreLayouts, type AppstoreLayouts };

const baseStore = createDemoBaseStore('shadcn-example');

const appstore = baseStore as Omit<ReturnType<typeof createDemoBaseStore>, 'activeTab'> & {
  activeTab: ReturnType<typeof useHistoryHashQuery<string>>;
  mode: ReturnType<typeof useLocalStorage<DemoMode>>;
  theme: ReturnType<typeof useLocalStorage<DemoThemeName>>;
  designSystem: ReturnType<typeof useLocalStorage<ShadcnDesignSystemConfig>>;
};
appstore.mode = useLocalStorage('shadcn-example-mode', 'system' as DemoMode);
appstore.theme = useLocalStorage('shadcn-example-theme', 'slate' as DemoThemeName);
appstore.designSystem = useLocalStorage('shadcn-example-design-system', defaultShadcnDesignSystem);

export const getWebComponentThemeStyle = (): string => '';

export const useAppStore = () => {
  return appstore;
};
