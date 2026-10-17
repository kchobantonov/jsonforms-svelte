import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../definitions.js';
import schema from './schema.json';
import uischema from './uischema.json';
import data from './data.json';
import config from './config.json';
import translations from './translations.json';
import supplements from './supplemental-translations.json';

// Add catalog prefixes in the host adapter; preserve canonical fixture JSON.
function localize(value: unknown, kind: 'schema' | 'ui', path = ''): unknown {
  if (Array.isArray(value))
    return value.map((child, index) => localize(child, kind, `${path}/${index}`));
  if (!value || typeof value !== 'object') return value;
  const source = value as Record<string, unknown>;
  const result = Object.fromEntries(
    Object.entries(source).map(([key, child]) => [key, localize(child, kind, `${path}/${key}`)]),
  );
  if (
    (kind === 'schema' && typeof source.title === 'string') ||
    (kind === 'ui' && (source.type === 'Label' || source.type === 'Category'))
  ) {
    result.i18n = `specCombinators.${kind}${path}`;
  }
  return result;
}

export const createSpecCombinatorsExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-combinators',
      label: 'Spec: Combinators and schema conditions',
      schema: localize(schema, 'schema') as JsonSchema,
      uischema: localize(uischema, 'ui') as UISchemaElement,
      data,
      config,
    },
    mergeExampleTranslations(translations, supplements),
    getLocale,
  );
