import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../definitions.js';
import schema from './schema.json';
import uischema from './uischema.json';
import data from './data.json';
import config from './config.json';
import translations from './translations.json';
export const createSpecKitchenSinkExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-kitchen-sink',
      label: 'Spec: Job application',
      schema: schema as unknown as JsonSchema,
      uischema: uischema as UISchemaElement,
      data,
      config,
    },
    translations,
    getLocale,
  );
