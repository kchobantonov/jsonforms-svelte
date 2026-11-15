import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../definitions.js';
import schema from './schema.json';
import uischema from './uischema.json';
import data from './data.json';
import translations from './translations.json';

export const createScalarContradictionExamples = (getLocale: () => string): DemoExample[] =>
  [
    { name: 'scalar-contradiction-authored', uischema: uischema as UISchemaElement },
    { name: 'scalar-contradiction-generated', uischema: undefined },
  ].map(({ name, uischema }) =>
    createLocalizedExample(
      {
        name,
        label: `Scalar contradictory allOf (${name.endsWith('authored') ? 'authored' : 'generated'})`,
        schema: schema as JsonSchema,
        uischema,
        data,
      },
      translations,
      getLocale,
    ),
  );
