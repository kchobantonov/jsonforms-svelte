import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import { localizeSpecDocument } from '../../../../src/lib/examples/spec-localization';
import schema from '@chobantonov/jsonforms-extended-spec/examples/numeric-controls/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/numeric-controls/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/numeric-controls/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/numeric-controls/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/numeric-controls/translations.json';
import supplement from '@chobantonov/jsonforms-extended-spec/examples/numeric-controls/translations.json';

export const createSpecNumericControlsExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-numeric-controls',
      label: 'Spec: Numeric controls',
      schema: localizeSpecDocument(schema, 'specNumericControls.schema') as JsonSchema,
      uischema: localizeSpecDocument(uischema, 'specNumericControls.ui') as UISchemaElement,
      data,
      config,
    },
    mergeExampleTranslations(translations, supplement),
    getLocale,
  );
