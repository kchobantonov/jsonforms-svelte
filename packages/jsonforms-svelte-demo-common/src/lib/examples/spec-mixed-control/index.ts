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
function localize(value: unknown, path = ''): unknown {
  if (Array.isArray(value)) return value.map((child, index) => localize(child, `${path}/${index}`));
  if (!value || typeof value !== 'object') return value;
  const node = value as Record<string, unknown>;
  return {
    ...Object.fromEntries(
      Object.entries(node).map(([key, child]) => [key, localize(child, `${path}/${key}`)]),
    ),
    ...(typeof node.title === 'string' ? { i18n: node.i18n ?? `mixedExample${path}` } : {}),
  };
}
function localizeUI(value: unknown, path = ''): unknown {
  if (Array.isArray(value))
    return value.map((child, index) => localizeUI(child, `${path}/${index}`));
  if (!value || typeof value !== 'object') return value;
  const node = value as Record<string, unknown>;
  return {
    ...Object.fromEntries(
      Object.entries(node).map(([key, child]) => [key, localizeUI(child, `${path}/${key}`)]),
    ),
    ...(!node.i18n && (typeof node.label === 'string' || typeof node.text === 'string')
      ? { i18n: `mixedExampleUI${path}` }
      : {}),
  };
}
export const createSpecMixedControlExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-mixed-control',
      label: 'Spec: Mixed control',
      schema: localize(schema) as JsonSchema,
      uischema: localizeUI(uischema) as UISchemaElement,
      data,
      config,
    },
    mergeExampleTranslations(translations, supplements),
    getLocale,
  );
