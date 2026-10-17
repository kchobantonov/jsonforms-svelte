import type { JsonSchema, UISchemaElement, UISchemaTester } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../definitions.js';
import schema from './schema.json';
import uischema from './uischema.json';
import data from './data.json';
import config from './config.json';
import translations from './translations.json';
import supplementalTranslations from './supplemental-translations.json';
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
