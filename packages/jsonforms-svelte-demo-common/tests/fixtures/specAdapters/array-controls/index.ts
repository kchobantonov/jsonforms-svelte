import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import { localizeSpecDocument } from '../../../../src/lib/examples/spec-localization';
import schema from '@chobantonov/jsonforms-extended-spec/examples/array-controls/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/array-controls/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/array-controls/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/array-controls/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/array-controls/translations.json';
import supplement from '@chobantonov/jsonforms-extended-spec/examples/array-controls/translations.json';

export const createSpecArrayControlsExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-array-controls',
      label: 'Spec: Array controls',
      schema: localizeSpecDocument(schema, 'specArrayControls.schema') as unknown as JsonSchema,
      uischema: localizeSpecDocument(uischema, 'specArrayControls.ui') as UISchemaElement,
      data,
      config,
    },
    mergeExampleTranslations(translations, supplement),
    getLocale,
  );
