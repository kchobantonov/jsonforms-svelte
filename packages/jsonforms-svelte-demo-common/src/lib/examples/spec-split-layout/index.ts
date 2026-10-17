import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../definitions.js';
import schema from './schema.json';
import uischema from './uischema.json';
import data from './data.json';
import config from './config.json';
import sourceTranslations from './translations.json';
import supplement from './translations.supplement.json';
const translations = mergeExampleTranslations(sourceTranslations, supplement);

export const createSpecSplitLayoutExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-split-layout',
      label: 'Spec: Split layout',
      schema: schema as unknown as JsonSchema,
      uischema: uischema as UISchemaElement,
      data,
      config,
    },
    translations,
    getLocale,
  );
