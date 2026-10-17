import type { ControlElement, JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../definitions.js';
import { localizeDetailSchema } from '../spec-detail-localization.js';
import schema from './schema.json';
import uischema from './uischema.json';
import data from './data.json';
import translations from './translations.supplement.json';
import { uischemas } from './uischemas.js';
export const createSpecEditorDetailsExample = (getLocale: () => string): DemoExample => {
  const localized = structuredClone(uischema);
  (localized.elements[0] as ControlElement).i18n = 'editorDetail.object';
  const mixed = localized.elements[1] as ControlElement;
  mixed.i18n = 'editorDetail.mixed';
  mixed.options!['object-detail'].i18n = 'editorDetail.note';
  mixed.options!['string-detail'].elements[0].i18n = 'editorDetail.string';
  return createLocalizedExample(
    {
      name: 'spec-editor-details',
      label: 'Spec: Editor details',
      schema: localizeDetailSchema(schema as JsonSchema),
      uischema: localized as UISchemaElement,
      data,
      uischemas: uischemas as unknown as DemoExample['uischemas'],
    },
    translations,
    getLocale,
  );
};
