import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../definitions.js';
import { localizeDetailSchema } from '../spec-detail-localization';
import schema from './schema.json';
import uischema from './uischema.json';
import data from './data.json';
import config from './config.json';
import translations from './translations.json';
import supplement from './translations.supplement.json';

export const createSpecAdditionalPropertiesExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-additional-properties',
      label: 'Spec: Additional properties',
      schema: localizeDetailSchema(schema as JsonSchema),
      uischema: uischema as UISchemaElement,
      data,
      config,
    },
    mergeExampleTranslations(translations, supplement),
    getLocale,
  );
