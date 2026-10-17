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

export const createSpecContainerValidationIndicatorExample = (
  getLocale: () => string,
): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-container-validation-indicator',
      label: 'Spec: Container validation indicator',
      schema: localizeSpecDocument(
        schema,
        'specContainerValidation.schema',
      ) as unknown as JsonSchema,
      uischema: localizeSpecDocument(uischema, 'specContainerValidation.ui') as UISchemaElement,
      data,
      config,
    },
    mergeExampleTranslations(translations, supplement),
    getLocale,
  );
