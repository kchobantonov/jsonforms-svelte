import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import schema from '@chobantonov/jsonforms-extended-spec/examples/cron-control/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/cron-control/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/cron-control/data.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/cron-control/translations.json';
import supplements from '@chobantonov/jsonforms-extended-spec/examples/cron-control/translations.json';
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
