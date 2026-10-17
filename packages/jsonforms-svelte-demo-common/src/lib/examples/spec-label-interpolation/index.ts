import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
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
