import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../definitions.js';
import { onHandleAction } from './actions.js';
import data from './data.json' with { type: 'json' };
import i18n from './i18n.json' with { type: 'json' };
import schema from './schema.json' with { type: 'json' };
import uischema from './uischema.json' with { type: 'json' };
import uischemas from './uischemas.json' with { type: 'json' };

export const createJobExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'job',
      label: 'Job Application',
      data,
      schema: schema as JsonSchema,
      uischema: uischema as UISchemaElement,
      uischemas: uischemas as unknown as DemoExample['uischemas'],
      onHandleAction,
    },
    i18n as Record<string, unknown>,
    getLocale,
  );
