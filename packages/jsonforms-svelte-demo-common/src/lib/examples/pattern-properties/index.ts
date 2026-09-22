import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createStaticExample, type DemoExample } from '../definitions.js';
import schema from './schema.json';
import uischema from './uischema.json';
import data from './data.json';

export const createPatternPropertiesExample = (): DemoExample =>
  createStaticExample({
    name: 'pattern-properties',
    label: 'Additional properties (overlapping patterns)',
    schema: schema as JsonSchema,
    uischema: uischema as UISchemaElement,
    data,
  });
