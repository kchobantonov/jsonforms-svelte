import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import { localizeSpecDocument } from '../../../../src/lib/examples/spec-localization';
import schema from '@chobantonov/jsonforms-extended-spec/examples/categorization/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/categorization/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/categorization/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/categorization/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/categorization/translations.json';
import supplement from '@chobantonov/jsonforms-extended-spec/examples/categorization/translations.json';

export const createSpecCategorizationExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-categorization',
      label: 'Spec: Categorization',
      schema: localizeSpecDocument(schema, 'specCategorization.schema') as JsonSchema,
      uischema: localizeSpecDocument(uischema, 'specCategorization.ui') as UISchemaElement,
      data,
      config,
    },
    mergeExampleTranslations(translations, supplement),
    getLocale,
  );
