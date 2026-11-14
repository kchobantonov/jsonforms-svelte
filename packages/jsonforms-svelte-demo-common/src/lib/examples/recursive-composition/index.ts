import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../definitions.js';
import schema from './schema.json';
import uischema from './uischema.json';
import data from './data.json';
import translations from './translations.json';

const requiredSchema = structuredClone(schema);
Object.assign(requiredSchema.$defs.Node.allOf[1], { required: ['next'] });
const defaultSchema = structuredClone(schema);
Object.assign(defaultSchema.$defs.Node.allOf[0].properties.label!, { default: 'New node' });

export const createRecursiveCompositionExamples = (getLocale: () => string): DemoExample[] =>
  [
    { name: 'recursive-composition', label: 'Recursive allOf reference', schema },
    {
      name: 'recursive-composition-required',
      label: 'Required recursive allOf reference',
      schema: requiredSchema,
    },
    {
      name: 'recursive-composition-default',
      label: 'Recursive allOf reference with a field default',
      schema: defaultSchema,
    },
  ].map((example) =>
    createLocalizedExample(
      {
        ...example,
        schema: example.schema as JsonSchema,
        uischema: uischema as UISchemaElement,
        data,
      },
      translations,
      getLocale,
    ),
  );
