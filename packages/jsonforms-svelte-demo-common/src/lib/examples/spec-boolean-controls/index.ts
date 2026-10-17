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
