import messages from './locales/messages.json';
const catalogs: Record<string, Record<string, string>> = messages;

export function rendererMessage(locale: string | undefined, key: string): string {
  const language = (locale ?? 'en').replaceAll('_', '-').toLowerCase();
  const candidates = [language, language.split('-')[0], 'en'];
  for (const candidate of candidates) {
    const catalog = Object.hasOwn(catalogs, candidate) ? catalogs[candidate] : undefined;
    if (catalog && Object.hasOwn(catalog, key)) return catalog[key];
  }
  return key;
}
