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
import supplement from './translations.supplement.json';
import { uischemas } from './uischemas.js';

// Retain titles used by trusted registry testers and explicit per-position i18n.
// Catalog annotations belong to host copies, never to the canonical fixture JSON.
function localize(value: unknown, path: string[]): unknown {
  if (Array.isArray(value))
    return value.map((item, index) => localize(item, [...path, `${index}`]));
  if (!value || typeof value !== 'object') return value;
  const node = Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, localize(item, [...path, key])]),
  );
  if (
    !node.i18n &&
    (node.title || node.description || node.type === 'Label' || typeof node.label === 'string')
  )
    node.i18n = `tupleExample.${path.join('.')}`;
  return node;
}

export const createSpecTupleControlExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-tuple-control',
      label: 'Spec: Tuple control',
      schema: localize(schema, ['schema']) as JsonSchema,
      uischema: localize(uischema, ['ui']) as UISchemaElement,
      data,
      uischemas,
    },
    mergeExampleTranslations(translations, supplement),
    getLocale,
  );
