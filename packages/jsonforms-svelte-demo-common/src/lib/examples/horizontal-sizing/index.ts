import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../definitions.js';
import translations from './translations.json';
import data from './data.json' with { type: 'json' };
import schema from './schema.json' with { type: 'json' };
import uischema from './uischema.json' with { type: 'json' };

export const createHorizontalSizingExample = (getLocale: () => string = () => 'en'): DemoExample =>
  createLocalizedExample(
    {
      name: 'horizontal-sizing',
      label: 'Horizontal Layout Sizing',
      data,
      schema: schema as JsonSchema,
      uischema: uischema as UISchemaElement,
    },
    translations,
    getLocale,
  );
