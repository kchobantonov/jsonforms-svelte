import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import schema from '@chobantonov/jsonforms-extended-spec/examples/validator-profile/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/validator-profile/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/validator-profile/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/validator-profile/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/validator-profile/translations.json';

export const createSpecValidatorProfileExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-validator-profile',
      label: 'Spec: Validator profile',
      schema: schema as JsonSchema,
      uischema: uischema as UISchemaElement,
      data,
      config,
    },
    translations,
    getLocale,
  );
