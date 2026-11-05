import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import { localizeSpecDocument } from '../../../../src/lib/examples/spec-localization';
import schema from '@chobantonov/jsonforms-extended-spec/examples/presentation/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/presentation/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/presentation/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/presentation/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/presentation/translations.json';
import supplement from '@chobantonov/jsonforms-extended-spec/examples/presentation/translations.json';

export const createSpecPresentationExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-presentation',
      label: 'Spec: Presentation elements',
      schema: localizeSpecDocument(schema, 'specPresentation.schema') as JsonSchema,
      uischema: localizeSpecDocument(uischema, 'specPresentation.ui') as UISchemaElement,
      data,
      config,
    },
    mergeExampleTranslations(translations, supplement),
    getLocale,
  );
