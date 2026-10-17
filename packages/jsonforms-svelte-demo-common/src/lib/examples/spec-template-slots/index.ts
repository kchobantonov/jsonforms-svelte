import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../definitions.js';
import { localizeSpecDocument } from '../spec-localization';
import schema from './schema.json';
import uischema from './uischema.json';
import data from './data.json';
import translations from './translations.supplement.json';
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
