import { mapSpecDocument } from '../../../../src/lib/examples/spec-localization';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import schema from '@chobantonov/jsonforms-extended-spec/examples/conditional-fields/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/conditional-fields/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/conditional-fields/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/conditional-fields/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/conditional-fields/translations.json';

export const createSpecConditionalFieldsExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-conditional-fields',
      label: 'Spec: Conditional fields',
      schema: schema as JsonSchema,
      uischema: mapSpecDocument(uischema, (node) => {
        if (typeof node.type === 'string' && typeof node.label === 'string') node.i18n = node.label;
      }) as UISchemaElement,
      data,
      config,
    },
    translations,
    getLocale,
  );
