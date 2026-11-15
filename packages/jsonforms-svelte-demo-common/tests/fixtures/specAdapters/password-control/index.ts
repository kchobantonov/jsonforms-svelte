import supplementalTranslations from '@chobantonov/jsonforms-extended-spec/examples/password-control/translations.json';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import schema from '@chobantonov/jsonforms-extended-spec/examples/password-control/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/password-control/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/password-control/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/password-control/config.json';
import sourceTranslations from '@chobantonov/jsonforms-extended-spec/examples/password-control/translations.json';

const translations = mergeExampleTranslations(sourceTranslations, supplementalTranslations);
const localizedUiSchema = {
  ...uischema,
  elements: uischema.elements.map((element) =>
    element.type !== 'Categorization'
      ? element
      : {
          ...element,
          elements: element.elements!.map((category, index) => ({
            ...category,
            elements: category.elements.map((child) =>
              child.type === 'Label' ? { ...child, i18n: `passwordIntro${index}` } : child,
            ),
          })),
        },
  ),
};
export const createSpecPasswordControlExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-password-control',
      label: 'Spec: Password control',
      schema: schema as unknown as JsonSchema,
      uischema: localizedUiSchema as UISchemaElement,
      data,
      config,
    },
    translations,
    getLocale,
  );
