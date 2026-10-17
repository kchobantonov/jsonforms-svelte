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

export const createSpecNumericControlsExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-numeric-controls',
      label: 'Spec: Numeric controls',
      schema: localizeSpecDocument(schema, 'specNumericControls.schema') as JsonSchema,
      uischema: localizeSpecDocument(uischema, 'specNumericControls.ui') as UISchemaElement,
      data,
      config,
    },
    mergeExampleTranslations(translations, supplement),
    getLocale,
  );
