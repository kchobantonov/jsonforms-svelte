import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import schema from '@chobantonov/jsonforms-extended-spec/examples/markup-label/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/markup-label/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/markup-label/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/markup-label/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/markup-label/translations.json';
import supplementalTranslations from '@chobantonov/jsonforms-extended-spec/examples/markup-label/translations.json';

export const createSpecMarkupLabelExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-markup-label',
      label: 'Spec: Markdown labels',
      schema: schema as unknown as JsonSchema,
      uischema: uischema as UISchemaElement,
      data,
      config,
    },
    mergeExampleTranslations(translations, supplementalTranslations),
    getLocale,
  );
