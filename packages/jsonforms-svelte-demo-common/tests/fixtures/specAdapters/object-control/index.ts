import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import { localizeSpecDocument } from '../../../../src/lib/examples/spec-localization';
import schema from '@chobantonov/jsonforms-extended-spec/examples/object-control/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/object-control/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/object-control/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/object-control/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/object-control/translations.json';
import supplement from '@chobantonov/jsonforms-extended-spec/examples/object-control/translations.json';
import { uischemas } from './uischemas.js';

export const createSpecObjectControlExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-object-control',
      label: 'Spec: Object control',
      schema: localizeSpecDocument(schema, 'specObjectControl.schema') as unknown as JsonSchema,
      uischema: localizeSpecDocument(uischema, 'specObjectControl.ui') as UISchemaElement,
      data,
      config,
      uischemas,
    },
    mergeExampleTranslations(translations, supplement),
    getLocale,
  );
