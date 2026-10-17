import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../definitions.js';
import schema from './schema.json';
import uischema from './uischema.json';
import data from './data.json';
import config from './config.json';
import translations from './translations.json';

export const createSpecValidatorProfileExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-validator-profile',
      label: 'Spec: Validator profile',
      schema: schema as JsonSchema,
      uischema: uischema as UISchemaElement,
      data,
      config,
    },
    translations,
    getLocale,
  );
