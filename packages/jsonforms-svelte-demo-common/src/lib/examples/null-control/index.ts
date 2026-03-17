import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createStaticExample, type DemoExample } from '../definitions.js';
import data from './data.json' with { type: 'json' };
import schema from './schema.json' with { type: 'json' };
import uischema from './uischema.json' with { type: 'json' };

export const createNullControlExample = (): DemoExample =>
  createStaticExample({
    name: 'null-control',
    label: 'Null',
    data,
    schema: schema as JsonSchema,
    uischema: uischema as UISchemaElement,
  });
