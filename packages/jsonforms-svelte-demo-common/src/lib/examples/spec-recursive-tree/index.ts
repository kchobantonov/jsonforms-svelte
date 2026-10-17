import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../definitions.js';
import schema from './schema.json';
import uischema from './uischema.json';
import data from './data.json';
import config from './config.json';
import translations from './translations.json';
import { uischemas } from './uischemas';
export const createSpecRecursiveTreeExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-recursive-tree',
      label: 'Spec: Recursive tree',
      schema: schema as JsonSchema,
      uischema: uischema as UISchemaElement,
      data,
      config,
      uischemas: uischemas as unknown as DemoExample['uischemas'],
    },
    translations,
    getLocale,
  );
