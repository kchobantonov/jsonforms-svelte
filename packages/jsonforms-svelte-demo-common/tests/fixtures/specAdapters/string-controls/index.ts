import supplementalTranslations from '@chobantonov/jsonforms-extended-spec/examples/string-controls/translations.json';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import schema from '@chobantonov/jsonforms-extended-spec/examples/string-controls/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/string-controls/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/string-controls/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/string-controls/config.json';
import sourceTranslations from '@chobantonov/jsonforms-extended-spec/examples/string-controls/translations.json';
const translations = mergeExampleTranslations(sourceTranslations, supplementalTranslations);
const localizedUiSchema = {
  ...uischema,
  elements: uischema.elements.map((group) => ({
    ...group,
    elements: group.elements.map((category, index) => ({
      ...category,
      elements: category.elements.map((child) =>
        child.type === 'Label' ? { ...child, i18n: `stringIntro${index}` } : child,
      ),
    })),
  })),
};
export const createSpecStringControlsExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-string-controls',
      label: 'Spec: String controls',
      schema: schema as unknown as JsonSchema,
      uischema: localizedUiSchema as UISchemaElement,
      data,
      config,
    },
    translations,
    getLocale,
  );
