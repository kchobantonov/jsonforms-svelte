import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import schema from '@chobantonov/jsonforms-extended-spec/examples/mixed-control/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/mixed-control/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/mixed-control/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/mixed-control/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/mixed-control/translations.json';
import supplements from '@chobantonov/jsonforms-extended-spec/examples/mixed-control/translations.json';
import { localizeMixedSchema } from './localize-schema.js';
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
    ...(node.type === 'Control' && node.scope === '#/properties/branchFeedback'
      ? {
          i18n: 'branchFeedback.value',
          options: {
            ...(node.options as Record<string, unknown> | undefined),
            structuredLayout: 'nested',
            collapsed: false,
          },
        }
      : {}),
  };
}
export const createSpecMixedControlExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-mixed-control',
      label: 'Spec: Mixed control',
      schema: localizeMixedSchema(schema) as JsonSchema,
      uischema: localizeUI(uischema) as UISchemaElement,
      data,
      config,
    },
    mergeExampleTranslations(translations, supplements),
    getLocale,
  );
