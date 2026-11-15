import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import schema from '@chobantonov/jsonforms-extended-spec/examples/recursive-tree/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/recursive-tree/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/recursive-tree/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/recursive-tree/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/recursive-tree/translations.json';
import { uischemas } from './uischemas';
export const createSpecRecursiveTreeExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-recursive-tree',
      label: 'Spec: Recursive tree',
      schema: schema as JsonSchema,
      uischema: uischema as UISchemaElement,
      data,
      config,
      uischemas: uischemas as unknown as DemoExample['uischemas'],
    },
    translations,
    getLocale,
  );
