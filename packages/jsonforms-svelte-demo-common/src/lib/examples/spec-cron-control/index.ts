import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../definitions.js';
import schema from './schema.json';
import uischema from './uischema.json';
import data from './data.json';
import translations from './translations.json';
import supplements from './supplemental-translations.json';
function localize(value: unknown, path = ''): unknown {
  if (Array.isArray(value)) return value.map((child, index) => localize(child, `${path}/${index}`));
  if (!value || typeof value !== 'object') return value;
  const node = value as Record<string, unknown>;
  return {
    ...Object.fromEntries(
      Object.entries(node).map(([key, child]) => [key, localize(child, `${path}/${key}`)]),
    ),
    ...(typeof node.title === 'string' ? { i18n: `cronExample${path}` } : {}),
  };
}
export const createSpecCronControlExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-cron-control',
      label: 'Spec: Scheduled jobs',
      schema: localize(schema) as JsonSchema,
      uischema: uischema as UISchemaElement,
      data,
    },
    mergeExampleTranslations(translations, supplements),
    getLocale,
  );
