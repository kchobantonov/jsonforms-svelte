import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../definitions.js';
import schema from './schema.json';
import uischema from './uischema.json';
import data from './data.json';
import config from './config.json';
import translations from './translations.json';
import { uischemas } from './uischemas';
export const createSpecTreeMaxDepthExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-tree-max-depth',
      label: 'Spec: Tree maximum depth',
      schema: schema as unknown as JsonSchema,
      uischema: uischema as UISchemaElement,
      data,
      config,
      uischemas: uischemas as unknown as DemoExample['uischemas'],
    },
    translations,
    getLocale,
  );
