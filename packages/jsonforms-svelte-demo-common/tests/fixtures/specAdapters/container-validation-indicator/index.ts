import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import { localizeSpecDocument } from '../../../../src/lib/examples/spec-localization';
import schema from '@chobantonov/jsonforms-extended-spec/examples/container-validation-indicator/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/container-validation-indicator/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/container-validation-indicator/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/container-validation-indicator/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/container-validation-indicator/translations.json';
import supplement from '@chobantonov/jsonforms-extended-spec/examples/container-validation-indicator/translations.json';

export const createSpecContainerValidationIndicatorExample = (
  getLocale: () => string,
): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-container-validation-indicator',
      label: 'Spec: Container validation indicator',
      schema: localizeSpecDocument(
        schema,
        'specContainerValidation.schema',
      ) as unknown as JsonSchema,
      uischema: localizeSpecDocument(uischema, 'specContainerValidation.ui') as UISchemaElement,
      data,
      config,
    },
    mergeExampleTranslations(translations, supplement),
    getLocale,
  );
