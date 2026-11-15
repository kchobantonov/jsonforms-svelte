import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import { localizeDetailSchema } from '../../../../src/lib/examples/spec-detail-localization';
import schema from '@chobantonov/jsonforms-extended-spec/examples/property-pagination/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/property-pagination/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/property-pagination/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/property-pagination/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/property-pagination/translations.json';
export const createSpecPropertyPaginationExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-property-pagination',
      label: 'Spec: Property pagination',
      schema: localizeDetailSchema(schema as JsonSchema),
      uischema: uischema as UISchemaElement,
      data,
      config,
    },
    translations,
    getLocale,
  );
