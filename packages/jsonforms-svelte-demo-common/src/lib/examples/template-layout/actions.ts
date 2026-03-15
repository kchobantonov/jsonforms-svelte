import type { DemoActionEvent } from '../button/actions';

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

export const onHandleAction = (event: DemoActionEvent) => {
  if (event.action === 'changeLang') {
    event.callback = changeLang;
  }
};
