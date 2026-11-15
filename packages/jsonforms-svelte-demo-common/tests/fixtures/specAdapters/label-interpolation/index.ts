import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import schema from '@chobantonov/jsonforms-extended-spec/examples/label-interpolation/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/label-interpolation/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/label-interpolation/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/label-interpolation/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/label-interpolation/translations.json';
import supplementalTranslations from '@chobantonov/jsonforms-extended-spec/examples/label-interpolation/translations.json';

export const createSpecLabelInterpolationExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-label-interpolation',
      label: 'Spec: label interpolation',
      schema: schema as unknown as JsonSchema,
      uischema: uischema as UISchemaElement,
      data,
      config,
    },
    mergeExampleTranslations(translations, supplementalTranslations),
    getLocale,
  );
