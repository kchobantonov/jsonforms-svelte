import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import {
  createLocalizedExample,
  type DemoExample,
} from '../../../../src/lib/examples/definitions.js';
import { localizeSpecDocument } from '../../../../src/lib/examples/spec-localization';
import schema from '@chobantonov/jsonforms-extended-spec/examples/template-slots/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/template-slots/uischema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/template-slots/data.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/template-slots/translations.json';
import { uischemas } from './uischemas';
export const createSpecTemplateSlotsExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'spec-template-slots',
      label: 'Spec: Named templates and slots',
      schema: schema as JsonSchema,
      uischema: localizeSpecDocument(uischema, 'specTemplateSlots.ui') as UISchemaElement,
      data,
      uischemas,
    },
    translations,
    getLocale,
  );
