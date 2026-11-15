import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import schema from '@chobantonov/jsonforms-extended-spec/examples/split-layout/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/split-layout/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/split-layout/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/split-layout/config.json';
import sourceTranslations from '@chobantonov/jsonforms-extended-spec/examples/split-layout/translations.json';
import supplement from '@chobantonov/jsonforms-extended-spec/examples/split-layout/translations.json';
const translations = mergeExampleTranslations(sourceTranslations, supplement);

export const createSpecSplitLayoutExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-split-layout',
      label: 'Spec: Split layout',
      schema: schema as unknown as JsonSchema,
      uischema: uischema as UISchemaElement,
      data,
      config,
    },
    translations,
    getLocale,
  );
