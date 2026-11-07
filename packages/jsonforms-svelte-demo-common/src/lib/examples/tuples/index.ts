import { createLocalizedExample, type DemoExample } from '../definitions.js';
import type { UISchemaTester } from '@jsonforms/core';
import translations from './translations.json';
import schema from './schema.json';
import uischema from './uischema.json';
import data from './data.json';
import uischemas from './uischemas.json';
const addressTester: UISchemaTester = (schema) => (schema.title === 'Address' ? 10 : -1);
const phoneTester: UISchemaTester = (schema) => (schema.title === 'Phone numbers' ? 10 : -1);
const nativeUiSchemas = [
  { ...uischemas[0], tester: addressTester },
  { ...uischemas[1], tester: phoneTester },
];
export const createTuplesExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'tuples',
      label: 'Tuples (coordinates & positional records)',
      schema,
      uischema,
      data,
      uischemas: nativeUiSchemas as unknown as DemoExample['uischemas'],
    },
    translations,
    getLocale,
  );
