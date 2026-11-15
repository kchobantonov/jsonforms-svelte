import type { JsonSchema, UISchemaElement, UISchemaTester } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import schema from '@chobantonov/jsonforms-extended-spec/examples/choice-controls/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/choice-controls/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/choice-controls/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/choice-controls/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/choice-controls/translations.json';
import supplementalTranslations from '@chobantonov/jsonforms-extended-spec/examples/choice-controls/translations.json';
import uischemas from './uischemas.json';

const emailDetailTester: UISchemaTester = (schema, schemaPath) =>
  schemaPath === '#/properties/cardContact' && schema.properties?.address?.format === 'email'
    ? 10
    : -1;
const nativeUiSchemas = uischemas.map((entry) => ({ ...entry, tester: emailDetailTester }));

export const createSpecChoiceControlsExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-choice-controls',
      label: 'Spec: choice controls and cards',
      schema: schema as unknown as JsonSchema,
      uischema: uischema as UISchemaElement,
      data,
      config,
      uischemas: nativeUiSchemas as unknown as DemoExample['uischemas'],
    },
    mergeExampleTranslations(translations, supplementalTranslations),
    getLocale,
  );
