import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createStaticExample, type DemoExample } from '../definitions.js';
import schema from './schema.json';
import uischema from './uischema.json';
import data from './data.json';

export const createScalarCompositionExample = (): DemoExample =>
  createStaticExample({
    name: 'scalar-composition',
    label: 'Scalar composition (validation without branch forms)',
    schema: schema as JsonSchema,
    uischema: uischema as UISchemaElement,
    data,
  });
