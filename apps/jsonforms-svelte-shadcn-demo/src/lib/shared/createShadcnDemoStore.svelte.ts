import type { DemoMode, DemoThemeName } from '$shadcnDemo/themes';
import { themes } from '$shadcnDemo/themes';
import {
  defaultShadcnDesignSystem,
  normalizeShadcnDesignSystem,
  type ShadcnDesignSystemConfig,
} from '@chobantonov/jsonforms-svelte-shadcn';
import {
  createDemoBaseStore,
  replaceDemoUrl,
  useHistoryHashQuery,
  useLocalStorage,
} from '@chobantonov/jsonforms-svelte-demo-common';

export function createShadcnDemoStore(prefix: string) {
  const baseStore = createDemoBaseStore(prefix, replaceDemoUrl);

  const appstore = baseStore as Omit<ReturnType<typeof createDemoBaseStore>, 'activeTab'> & {
    activeTab: ReturnType<typeof useHistoryHashQuery<string>>;
    mode: ReturnType<typeof useLocalStorage<DemoMode>>;
    theme: ReturnType<typeof useLocalStorage<DemoThemeName>>;
    designSystem: ReturnType<typeof useLocalStorage<ShadcnDesignSystemConfig>>;
  };
  appstore.mode = useLocalStorage(
    prefix + '-mode',
    'system' as DemoMode,
    (value): value is DemoMode => value === 'system' || value === 'light' || value === 'dark',
  );
  appstore.theme = useLocalStorage(
    prefix + '-theme',
    'slate' as DemoThemeName,
    (value): value is DemoThemeName => themes.some((theme) => theme.name === value),
  );
  appstore.designSystem = useLocalStorage(
    prefix + '-design-system',
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

  return appstore;
}
