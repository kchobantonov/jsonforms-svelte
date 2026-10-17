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
import translations from './translations.json';
import supplement from './translations.supplement.json';
export const createSpecAdditionalItemsPaginationExample = (
  getLocale: () => string,
): DemoExample => {
  const localizedSchema = structuredClone(schema);
  for (const property of Object.values(localizedSchema.properties)) {
    Object.assign(property.items[0], { i18n: 'shipment.reference' });
  }
  const localizedUi = structuredClone(uischema);
  localizedUi.elements[0].elements.forEach((category, index) => {
    Object.assign(category.elements[0], { i18n: `shipment.${index}` });
  });
  return createLocalizedExample(
    {
      name: 'spec-additional-items-pagination',
      label: 'Spec: Additional items pagination',
      schema: localizedSchema as unknown as JsonSchema,
      uischema: localizedUi as UISchemaElement,
      data,
      config,
    },
    mergeExampleTranslations(translations, supplement),
    getLocale,
  );
};
