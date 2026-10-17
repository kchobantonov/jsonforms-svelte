import { createTranslator as coreTranslator, type Translator } from '@jsonforms/core';

const lookup = (catalog: unknown, key: string): string | undefined => {
  if (!catalog || typeof catalog !== 'object') return undefined;
  if (Object.hasOwn(catalog, key)) {
    const value = (catalog as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : undefined;
  }
  let value: unknown = catalog;
  for (const segment of key.split('.')) {
    if (!value || typeof value !== 'object' || !Object.hasOwn(value, segment)) return undefined;
    value = (value as Record<string, unknown>)[segment];
  }
  return typeof value === 'string' ? value : undefined;
};

type Segment = { text: string } | { parameter: string; source: string };

/** Catalog {name} and legacy ${name} parameters are inert text substitutions. */
function formatMessage(
  message: string,
  params: Record<string, unknown>,
  templates: Map<string, Segment[]>,
): string {
  if (!message.includes('{')) return message;
  let segments = templates.get(message);
  if (!segments) {
    segments = [];
    let cursor = 0;
    for (const match of message.matchAll(/\$?\{\s*([A-Za-z_$][\w$]*)\s*\}/g)) {
      segments.push({ text: message.slice(cursor, match.index) });
      segments.push({ parameter: match[1], source: match[0] });
      cursor = match.index! + match[0].length;
    }
    segments.push({ text: message.slice(cursor) });
    templates.set(message, segments);
  }
  return segments
    .map((segment) => {
      if ('text' in segment) return segment.text;
      const error = Object.hasOwn(params, 'error') ? params.error : undefined;
      const errorParams =
        error && typeof error === 'object' && Object.hasOwn(error, 'params')
          ? (error as { params: unknown }).params
          : undefined;
      const source = Object.hasOwn(params, segment.parameter)
        ? params
        : errorParams &&
            typeof errorParams === 'object' &&
            Object.hasOwn(errorParams, segment.parameter)
          ? (errorParams as Record<string, unknown>)
          : undefined;
      if (!source) return segment.source;
      const value = source[segment.parameter];
      return value == null ? '' : String(value);
    })
    .join('');
}

export const createCatalogTranslator = (
  locale: string,
  translations?: Record<string, unknown>,
): Translator => {
  // Cache parsed templates per translator, never their parameterized results.
  // Replacing a locale/catalog also releases its cache for garbage collection.
  const templates = new Map<string, Segment[]>();
  const locales = [...new Set([locale, locale.split('-')[0], 'en'])];
  return coreTranslator((key, fallback, values?: Record<string, unknown>) => {
    let message: string | undefined;
    for (const language of locales) {
      const catalog =
        translations && Object.hasOwn(translations, language) ? translations[language] : undefined;
      message = lookup(catalog, key);
      if (message !== undefined) break;
    }
    message ??= fallback;
    return message !== undefined && values ? formatMessage(message, values, templates) : message;
  });
};
