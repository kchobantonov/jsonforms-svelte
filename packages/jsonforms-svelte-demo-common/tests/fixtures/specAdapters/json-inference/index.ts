import type { UISchemaElement } from '@jsonforms/core';
import {
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/json-inference/uischema.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/json-inference/translations.json';

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
