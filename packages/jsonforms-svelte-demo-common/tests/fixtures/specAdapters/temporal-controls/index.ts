import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import { localizeSpecDocument } from '../../../../src/lib/examples/spec-localization';
import schema from '@chobantonov/jsonforms-extended-spec/examples/temporal-controls/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/temporal-controls/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/temporal-controls/data.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/temporal-controls/translations.json';
import supplement from '@chobantonov/jsonforms-extended-spec/examples/temporal-controls/translations.json';

export const createSpecTemporalControlsExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-temporal-controls',
      label: 'Spec: Temporal controls',
      schema: localizeSpecDocument(schema, 'specTemporalControls.schema') as JsonSchema,
      uischema: localizeSpecDocument(uischema, 'specTemporalControls.ui') as UISchemaElement,
      data,
    },
    mergeExampleTranslations(translations, supplement),
    getLocale,
  );
