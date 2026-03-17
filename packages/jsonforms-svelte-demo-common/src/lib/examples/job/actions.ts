import type { DemoActionEvent } from '../actions';

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const getRequestedLocale = (params: Record<string, unknown>): string | undefined => {
  if (typeof params.lang === 'string') {
    return params.lang;
  }

  return typeof params.locale === 'string' ? params.locale : undefined;
};

const changeLang = (event: DemoActionEvent) => {
  const nextLocale = getRequestedLocale(event.params);
  if (!nextLocale) {
    return;
  }

  const appStore = isObjectRecord(event.context.appStore) ? event.context.appStore : undefined;
  const jsonforms = appStore && isObjectRecord(appStore.jsonforms) ? appStore.jsonforms : undefined;
  const localeStore = jsonforms && isObjectRecord(jsonforms.locale) ? jsonforms.locale : undefined;

  if (localeStore && 'value' in localeStore) {
    (localeStore as { value: unknown }).value = nextLocale;
    return;
  }

  if (jsonforms) {
    jsonforms.locale = nextLocale;
    return;
  }

  const rootNode = event.$el.getRootNode();
  if (rootNode instanceof ShadowRoot && rootNode.host instanceof HTMLElement) {
    rootNode.host.setAttribute('locale', nextLocale);
  }
};

const toggleMode = (event: DemoActionEvent) => {
  const getFormModeOverride =
    typeof event.context.getFormModeOverride === 'function'
      ? (event.context.getFormModeOverride as () => unknown)
      : undefined;
  const setFormModeOverride =
    typeof event.context.setFormModeOverride === 'function'
      ? (event.context.setFormModeOverride as (mode: 'light' | 'dark') => void)
      : undefined;

  if (getFormModeOverride && setFormModeOverride) {
    const currentMode = getFormModeOverride();
    setFormModeOverride(currentMode === 'dark' ? 'light' : 'dark');
    return;
  }

  const appStore = isObjectRecord(event.context.appStore) ? event.context.appStore : undefined;
  const modeStore = appStore && isObjectRecord(appStore.mode) ? appStore.mode : undefined;

  if (modeStore && 'value' in modeStore) {
    const currentMode = (modeStore as { value: unknown }).value;
    (modeStore as { value: unknown }).value = currentMode === 'dark' ? 'light' : 'dark';
    return;
  }

  const rootNode = event.$el.getRootNode();
  if (rootNode instanceof ShadowRoot && rootNode.host instanceof HTMLElement) {
    const currentMode = rootNode.host.getAttribute('mode');
    rootNode.host.setAttribute('mode', currentMode === 'dark' ? 'light' : 'dark');
  }
};

export const onHandleAction = (event: DemoActionEvent) => {
  if (event.action === 'changeLang') {
    event.callback = changeLang;
  } else if (event.action === 'toggleMode') {
    event.callback = toggleMode;
  }
};
