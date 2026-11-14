import { createTranslator } from './i18n';
import messages from '../components/demo-messages.json';

/** Shared demo-shell messages, using the same locale fallback as form catalogs. */
export const createDemoTranslator = (locale: string) => {
  const translate = createTranslator(locale, messages);
  return (key: string, fallback = key, values?: Record<string, unknown>): string =>
    translate(key, fallback, values) ?? fallback;
};
