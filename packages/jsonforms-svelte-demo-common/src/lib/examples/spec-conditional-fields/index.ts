import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../definitions.js';
import schema from './schema.json';
import uischema from './uischema.json';
import data from './data.json';
import config from './config.json';
import translations from './translations.json';

function localize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(localize);
  if (!value || typeof value !== 'object') return value;
  const source = value as Record<string, unknown>;
  const result = Object.fromEntries(
    Object.entries(source).map(([key, child]) => [key, localize(child)]),
  );
  if (typeof source.type === 'string' && typeof source.label === 'string')
    result.i18n = source.label;
  return result;
}

export const createSpecConditionalFieldsExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-conditional-fields',
      label: 'Spec: Conditional fields',
      schema: schema as JsonSchema,
      uischema: localize(uischema) as UISchemaElement,
      data,
      config,
    },
    translations,
    getLocale,
  );
