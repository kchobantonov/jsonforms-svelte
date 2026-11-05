import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import { localizeSpecDocument } from '../../../../src/lib/examples/spec-localization';
import schema from '@chobantonov/jsonforms-extended-spec/examples/pre-touch-errors/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/pre-touch-errors/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/pre-touch-errors/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/pre-touch-errors/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/pre-touch-errors/translations.json';
import supplement from '@chobantonov/jsonforms-extended-spec/examples/pre-touch-errors/translations.json';

export const createSpecPreTouchErrorsExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-pre-touch-errors',
      label: 'Spec: Pre-touch errors',
      schema: schema as JsonSchema,
      uischema: localizeSpecDocument(uischema, 'specPreTouch.ui') as UISchemaElement,
      data,
      config,
    },
    mergeExampleTranslations(translations, supplement),
    getLocale,
  );
