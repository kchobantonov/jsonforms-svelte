import supplementalTranslations from '@chobantonov/jsonforms-extended-spec/examples/boolean-controls/translations.json';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import schema from '@chobantonov/jsonforms-extended-spec/examples/boolean-controls/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/boolean-controls/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/boolean-controls/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/boolean-controls/config.json';
import sourceTranslations from '@chobantonov/jsonforms-extended-spec/examples/boolean-controls/translations.json';

const translations = mergeExampleTranslations(sourceTranslations, supplementalTranslations);
const localizedUiSchema = {
  ...uischema,
  elements: uischema.elements.map((group) => ({
    ...group,
    elements: group.elements.map((category, categoryIndex) => ({
      ...category,
      elements: category.elements.map((child, childIndex) =>
        child.type === 'Label'
          ? { ...child, i18n: `booleanIntro${categoryIndex}_${childIndex}` }
          : child,
      ),
    })),
  })),
};
export const createSpecBooleanControlsExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-boolean-controls',
      label: 'Spec: Boolean controls',
      schema: schema as unknown as JsonSchema,
      uischema: localizedUiSchema as UISchemaElement,
      data,
      config,
    },
    translations,
    getLocale,
  );
