import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import schema from '@chobantonov/jsonforms-extended-spec/examples/kitchen-sink/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/kitchen-sink/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/kitchen-sink/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/kitchen-sink/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/kitchen-sink/translations.json';
export const createSpecKitchenSinkExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-kitchen-sink',
      label: 'Spec: Job application',
      schema: schema as unknown as JsonSchema,
      uischema: uischema as UISchemaElement,
      data,
      config,
    },
    translations,
    getLocale,
  );
