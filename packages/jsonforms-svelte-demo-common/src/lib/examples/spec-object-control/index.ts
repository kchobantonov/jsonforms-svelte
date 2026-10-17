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
import { uischemas } from './uischemas.js';

export const createSpecObjectControlExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-object-control',
      label: 'Spec: Object control',
      schema: localizeSpecDocument(schema, 'specObjectControl.schema') as unknown as JsonSchema,
      uischema: localizeSpecDocument(uischema, 'specObjectControl.ui') as UISchemaElement,
      data,
      config,
      uischemas,
    },
    mergeExampleTranslations(translations, supplement),
    getLocale,
  );
