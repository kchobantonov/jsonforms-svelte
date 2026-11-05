import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import schema from '@chobantonov/jsonforms-extended-spec/examples/tree-max-depth/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/tree-max-depth/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/tree-max-depth/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/tree-max-depth/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/tree-max-depth/translations.json';
import { uischemas } from './uischemas';
export const createSpecTreeMaxDepthExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-tree-max-depth',
      label: 'Spec: Tree maximum depth',
      schema: schema as unknown as JsonSchema,
      uischema: uischema as UISchemaElement,
      data,
      config,
      uischemas: uischemas as unknown as DemoExample['uischemas'],
    },
    translations,
    getLocale,
  );
