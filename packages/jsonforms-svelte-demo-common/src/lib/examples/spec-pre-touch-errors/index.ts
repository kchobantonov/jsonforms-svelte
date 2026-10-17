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

export const createSpecPreTouchErrorsExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-pre-touch-errors',
      label: 'Spec: Pre-touch errors',
      schema: schema as JsonSchema,
      uischema: localizeSpecDocument(uischema, 'specPreTouch.ui') as UISchemaElement,
      data,
      config,
    },
    mergeExampleTranslations(translations, supplement),
    getLocale,
  );
