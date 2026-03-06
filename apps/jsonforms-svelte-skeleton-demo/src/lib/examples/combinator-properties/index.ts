import type { JsonSchema } from '@jsonforms/core';
import data from './data.json' with { type: 'json' };
import schema from './schema.json' with { type: 'json' };
import uischema from './uischema.json' with { type: 'json' };

export default [
  {
    name: 'combinator-properties',
    label: 'Combinator Properties',
    data: data,
    schema: schema as unknown as JsonSchema,
    uischema: uischema,
  },
];
