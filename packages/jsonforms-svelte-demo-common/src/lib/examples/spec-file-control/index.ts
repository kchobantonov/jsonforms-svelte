import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../definitions.js';
import schema from './schema.json';
import uischema from './uischema.json';
import data from './data.json';
import sourceTranslations from './translations.json';
const translations = sourceTranslations;

export const createSpecFileControlExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-file-control',
      label: 'Spec: File control',
      schema: schema as unknown as JsonSchema,
      uischema: uischema as UISchemaElement,
      data,
    },
    translations,
    getLocale,
  );
