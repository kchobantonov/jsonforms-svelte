import { createTranslator } from '../i18n/i18n.js';

/** Keep authored AG Grid header overrides native while translating their text. */
export function localizeSpecAgGridHeaders(
  value: unknown,
  getLocale: () => string,
  translations: Record<string, Record<string, string>>,
  path: string[] = ['specAgGrid.ui'],
): void {
  if (!value || typeof value !== 'object') return;
  const node = value as Record<string, unknown>;
  if (typeof node.headerName === 'string') {
    const fallback = node.headerName;
    node.headerValueGetter = () =>
      createTranslator(getLocale(), translations)([...path, 'headerName'].join('.'), fallback);
  }
  for (const [key, child] of Object.entries(node))
    localizeSpecAgGridHeaders(child, getLocale, translations, [...path, key]);
}
