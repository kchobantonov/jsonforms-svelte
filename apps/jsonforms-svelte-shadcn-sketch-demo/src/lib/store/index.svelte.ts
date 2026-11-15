import type { DemoMode, DemoThemeName } from '$lib/modules/themes';
import { themes } from '$lib/modules/themes';
import {
  defaultShadcnDesignSystem,
  normalizeShadcnDesignSystem,
  type ShadcnDesignSystemConfig,
} from '@chobantonov/jsonforms-svelte-shadcn';
import {
  appstoreLayouts,
  createDemoBaseStore,
  replaceDemoUrl,
  useHistoryHashQuery,
  useLocalStorage,
  type AppstoreLayouts,
} from '@chobantonov/jsonforms-svelte-demo-common';

export { appstoreLayouts, type AppstoreLayouts };

const baseStore = createDemoBaseStore('shadcn-sketch-example', replaceDemoUrl);

const appstore = baseStore as Omit<ReturnType<typeof createDemoBaseStore>, 'activeTab'> & {
  activeTab: ReturnType<typeof useHistoryHashQuery<string>>;
  mode: ReturnType<typeof useLocalStorage<DemoMode>>;
  theme: ReturnType<typeof useLocalStorage<DemoThemeName>>;
  designSystem: ReturnType<typeof useLocalStorage<ShadcnDesignSystemConfig>>;
};
appstore.mode = useLocalStorage(
  'shadcn-sketch-example-mode',
  'system' as DemoMode,
  (value): value is DemoMode => value === 'system' || value === 'light' || value === 'dark',
);
appstore.theme = useLocalStorage(
  'shadcn-sketch-example-theme',
  'slate' as DemoThemeName,
  (value): value is DemoThemeName => themes.some((theme) => theme.name === value),
);
appstore.designSystem = useLocalStorage(
  'shadcn-sketch-example-design-system',
  defaultShadcnDesignSystem,
  (value): value is ShadcnDesignSystemConfig => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const candidate = value as Record<string, unknown>;
    const normalized = normalizeShadcnDesignSystem(candidate);
    return Object.keys(defaultShadcnDesignSystem).every(
      (key) => candidate[key] === normalized[key],
    );
  },
);

export const getWebComponentThemeStyle = (): string => '';

export const useAppStore = () => {
  return appstore;
};
