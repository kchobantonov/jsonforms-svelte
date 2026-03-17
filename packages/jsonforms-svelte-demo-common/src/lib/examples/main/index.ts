import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../definitions.js';
import data from './data.json' with { type: 'json' };
import i18n from './i18n.json' with { type: 'json' };
import schema from './schema.json' with { type: 'json' };
import uischema from './uischema.json' with { type: 'json' };

export const createMainExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'main',
      label: 'Main',
      data,
      schema: schema as JsonSchema,
      uischema: uischema as UISchemaElement,
    },
    i18n as Record<string, unknown>,
    getLocale,
  );
