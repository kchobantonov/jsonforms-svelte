import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import { localizeSpecDocument } from '../../../../src/lib/examples/spec-localization';
import schema from '@chobantonov/jsonforms-extended-spec/examples/null-control/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/null-control/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/null-control/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/null-control/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/null-control/translations.json';
import supplement from '@chobantonov/jsonforms-extended-spec/examples/null-control/translations.json';

export const createSpecNullControlExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-null-control',
      label: 'Spec: Null control',
      schema: localizeSpecDocument(schema, 'specNullControl.schema') as JsonSchema,
      uischema: localizeSpecDocument(uischema, 'specNullControl.ui') as UISchemaElement,
      data,
      config,
    },
    mergeExampleTranslations(translations, supplement),
    getLocale,
  );
