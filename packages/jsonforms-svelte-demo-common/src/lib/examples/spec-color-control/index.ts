import supplementalTranslations from './supplemental-translations.json';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  mergeExampleTranslations,
  createLocalizedExample,
  type DemoExample,
} from '../definitions.js';
import schema from './schema.json';
import uischema from './uischema.json';
import data from './data.json';
import config from './config.json';
import sourceTranslations from './translations.json';
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
