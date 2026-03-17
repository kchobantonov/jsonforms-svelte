import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../definitions.js';
import { onHandleAction } from './actions.js';
import data from './data.json' with { type: 'json' };
import i18n from './i18n.json' with { type: 'json' };
import schema from './schema.json' with { type: 'json' };
import uischema from './uischema.json' with { type: 'json' };

export const createTemplateLayoutExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'template-layout',
      label: 'Template Layout',
      data,
      schema: schema as JsonSchema,
      uischema: uischema as UISchemaElement,
      onHandleAction,
    },
    i18n as Record<string, unknown>,
    getLocale,
  );
