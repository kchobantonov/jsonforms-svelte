import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import schema from '@chobantonov/jsonforms-extended-spec/examples/layout-sizing/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/layout-sizing/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/layout-sizing/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/layout-sizing/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/layout-sizing/translations.json';

export const createSpecLayoutSizingExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-layout-sizing',
      label: 'Spec: layout sizing',
      schema: schema as unknown as JsonSchema,
      uischema: uischema as UISchemaElement,
      data,
      config,
    },
    translations,
    getLocale,
  );
