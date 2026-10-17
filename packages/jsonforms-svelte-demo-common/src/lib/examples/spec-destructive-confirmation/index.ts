import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../definitions.js';
import { localizeSpecDocument } from '../spec-localization';
import schema from './schema.json';
import uischema from './uischema.json';
import data from './data.json';
import config from './config.json';
import translations from './translations.json';
import supplement from './translations.supplement.json';

const hostSchema = structuredClone(schema);
for (const name of ['object', 'array'] as const) {
  Object.assign(hostSchema.properties.compositeRows.items.properties[name], {
    i18n: `specDestructiveConfirmation.schema.properties.compositeRows.items.properties.${name}`,
  });
}

export const createSpecDestructiveConfirmationExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-destructive-confirmation',
      label: 'Spec: Destructive-change confirmation',
      schema: localizeSpecDocument(
        hostSchema,
        'specDestructiveConfirmation.schema',
      ) as unknown as JsonSchema,
      uischema: localizeSpecDocument(uischema, 'specDestructiveConfirmation.ui') as UISchemaElement,
      data,
      config,
    },
    mergeExampleTranslations(translations, supplement),
    getLocale,
  );
