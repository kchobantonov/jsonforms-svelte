import config from './config.json';
import { NOT_APPLICABLE } from '@jsonforms/core';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createStaticExample, type DemoExample } from '../definitions.js';
import data from './data.json' with { type: 'json' };
import schema from './schema.json' with { type: 'json' };
import uischema from './uischema.json' with { type: 'json' };
import uischemas from './uischemas.json' with { type: 'json' };

export const createTemplateSlotExample = (): DemoExample =>
  createStaticExample({
    name: 'template-slot',
    label: 'Template/Slot Layout',
    config,
    data,
    schema: schema as JsonSchema,
    uischema: uischema as UISchemaElement,
    uischemas: uischemas.map((entry) => ({
      ...entry,
      tester: () => NOT_APPLICABLE,
    })) as unknown as DemoExample['uischemas'],
  });
