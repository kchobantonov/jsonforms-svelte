import type { UISchemaElement } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../definitions.js';
import uischema from './uischema.json';
import translations from './translations.json';

export const createSpecJsonInferenceExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-json-inference',
      label: 'Spec: JSON inference',
      uischema: uischema as UISchemaElement,
    },
    translations,
    getLocale,
  );
