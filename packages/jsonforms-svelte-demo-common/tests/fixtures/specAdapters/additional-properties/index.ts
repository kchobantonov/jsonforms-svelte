import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import { localizeDetailSchema } from '../../../../src/lib/examples/spec-detail-localization';
import schema from '@chobantonov/jsonforms-extended-spec/examples/additional-properties/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/additional-properties/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/additional-properties/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/additional-properties/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/additional-properties/translations.json';
import supplement from '@chobantonov/jsonforms-extended-spec/examples/additional-properties/translations.json';

export const createSpecAdditionalPropertiesExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-additional-properties',
      label: 'Spec: Additional properties',
      schema: localizeDetailSchema(schema as JsonSchema),
      uischema: uischema as UISchemaElement,
      data,
      config,
    },
    mergeExampleTranslations(translations, supplement),
    getLocale,
  );
