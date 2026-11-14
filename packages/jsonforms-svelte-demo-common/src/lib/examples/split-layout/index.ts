import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../definitions.js';
import translations from './translations.json';
import data from './data.json' with { type: 'json' };
import schema from './schema.json' with { type: 'json' };
import uischema from './uischema.json' with { type: 'json' };

export const createSplitLayoutExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'split-layout',
      label: 'Split layout sizing',
      data,
      schema: schema as JsonSchema,
      uischema: uischema as UISchemaElement,
    },
    translations,
    getLocale,
  );
