import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createStaticExample, type DemoExample } from '../definitions.js';
import data from './data.json' with { type: 'json' };
import schema from './schema.json' with { type: 'json' };
import uischema from './uischema.json' with { type: 'json' };

export const createSplitLayoutExample = (): DemoExample =>
  createStaticExample({
    name: 'split-layout',
    label: 'Split Layout',
    data,
    schema: schema as JsonSchema,
    uischema: uischema as UISchemaElement,
  });
