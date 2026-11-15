import type { ControlElement, JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import { localizeDetailSchema } from '../../../../src/lib/examples/spec-detail-localization.js';
import schema from '@chobantonov/jsonforms-extended-spec/examples/editor-details/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/editor-details/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/editor-details/data.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/editor-details/translations.json';
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
