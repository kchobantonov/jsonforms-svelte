import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../definitions.js';
import { localizeDetailSchema } from '../spec-detail-localization';
import schema from './schema.json';
import uischema from './uischema.json';
import data from './data.json';
import config from './config.json';
import translations from './translations.supplement.json';

/** Catalog annotations live on copies; preserve canonical JSON for provenance checks. */
function localizedUi(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(localizedUi);
  if (!value || typeof value !== 'object') return value;
  const node = value as Record<string, unknown>;
  return {
    ...Object.fromEntries(Object.entries(node).map(([key, child]) => [key, localizedUi(child)])),
    ...(typeof node.label === 'string'
      ? { i18n: `rowDetails.${node.label.toLowerCase().replace(/[^a-z0-9]+/g, '_')}` }
      : {}),
  };
}
export const createSpecTableRowDetailsExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-table-row-details',
      label: 'Spec: Table row details',
      schema: localizeDetailSchema(schema as JsonSchema),
      uischema: localizedUi(uischema) as UISchemaElement,
      data,
      config,
    },
    translations,
    getLocale,
  );
