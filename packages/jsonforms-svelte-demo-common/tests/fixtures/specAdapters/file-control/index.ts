import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import schema from '@chobantonov/jsonforms-extended-spec/examples/file-control/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/file-control/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/file-control/data.json';
import sourceTranslations from '@chobantonov/jsonforms-extended-spec/examples/file-control/translations.json';
const translations = sourceTranslations;

export const createSpecFileControlExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-file-control',
      label: 'Spec: File control',
      schema: schema as unknown as JsonSchema,
      uischema: uischema as UISchemaElement,
      data,
    },
    translations,
    getLocale,
  );
