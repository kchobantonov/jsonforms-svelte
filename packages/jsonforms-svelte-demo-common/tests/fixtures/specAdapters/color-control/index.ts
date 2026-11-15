import supplementalTranslations from '@chobantonov/jsonforms-extended-spec/examples/color-control/translations.json';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import schema from '@chobantonov/jsonforms-extended-spec/examples/color-control/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/color-control/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/color-control/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/color-control/config.json';
import sourceTranslations from '@chobantonov/jsonforms-extended-spec/examples/color-control/translations.json';
const translations = mergeExampleTranslations(sourceTranslations, supplementalTranslations);

// Add translation keys in the host adapter; the pinned source JSON stays intact.
const localizedUiSchema = {
  ...uischema,
  elements: uischema.elements.map((group) => ({
    ...group,
    elements: group.elements.map((category, index) => ({
      ...category,
      elements: category.elements.map((element) =>
        element.type === 'Label' ? { ...element, i18n: `colorIntro${index}` } : element,
      ),
    })),
  })),
};

export const createSpecColorControlExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-color-control',
      label: 'Spec: Color control',
      schema: schema as unknown as JsonSchema,
      uischema: localizedUiSchema as UISchemaElement,
      data,
      config,
    },
    translations,
    getLocale,
  );
