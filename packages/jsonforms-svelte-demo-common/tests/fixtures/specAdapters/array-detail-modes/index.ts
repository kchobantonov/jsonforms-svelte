import type { ControlElement, JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import { localizeDetailSchema } from '../../../../src/lib/examples/spec-detail-localization.js';
import schema from '@chobantonov/jsonforms-extended-spec/examples/array-detail-modes/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/array-detail-modes/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/array-detail-modes/data.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/array-detail-modes/translations.json';
import { uischemas } from './uischemas.js';
export const createSpecArrayDetailModesExample = (getLocale: () => string): DemoExample => {
  const localized = structuredClone(uischema);
  localized.elements.forEach((element, index) => {
    (element as ControlElement).i18n = `arrayDetail.${index}`;
    const detail = element.options.detail;
    if (typeof detail === 'object')
      detail.elements.forEach((field, fieldIndex) => {
        (field as ControlElement).i18n =
          fieldIndex === 0 ? 'arrayDetail.inlineNote' : 'arrayDetail.inlineName';
      });
  });
  return createLocalizedExample(
    {
      name: 'spec-array-detail-modes',
      label: 'Spec: Array detail modes',
      schema: localizeDetailSchema(schema as JsonSchema),
      uischema: localized as UISchemaElement,
      data,
      uischemas: uischemas as unknown as DemoExample['uischemas'],
    },
    translations,
    getLocale,
  );
};
