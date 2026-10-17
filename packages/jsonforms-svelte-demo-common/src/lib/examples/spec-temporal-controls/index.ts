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
import translations from './translations.json';
import supplement from './translations.supplement.json';

export const createSpecTemporalControlsExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-temporal-controls',
      label: 'Spec: Temporal controls',
      schema: localizeSpecDocument(schema, 'specTemporalControls.schema') as JsonSchema,
      uischema: localizeSpecDocument(uischema, 'specTemporalControls.ui') as UISchemaElement,
      data,
    },
    mergeExampleTranslations(translations, supplement),
    getLocale,
  );
