import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import schema from '@chobantonov/jsonforms-extended-spec/examples/group-layout/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/group-layout/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/group-layout/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/group-layout/config.json';
import sourceTranslations from '@chobantonov/jsonforms-extended-spec/examples/group-layout/translations.json';
import supplement from '@chobantonov/jsonforms-extended-spec/examples/group-layout/translations.json';
const translations = mergeExampleTranslations(sourceTranslations, supplement);

export const createSpecGroupLayoutExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-group-layout',
      label: 'Spec: Group layout',
      schema: schema as unknown as JsonSchema,
      uischema: uischema as UISchemaElement,
      data,
      config,
    },
    translations,
    getLocale,
  );
